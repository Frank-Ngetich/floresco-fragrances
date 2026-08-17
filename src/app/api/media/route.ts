import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/auth';
import { canWriteMedia } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

function getR2Client() {
  // Support both naming conventions: the scaffold's original R2_ACCOUNT_ID
  // and this patch's CLOUDFLARE_ACCOUNT_ID.
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('Missing R2 env vars: CLOUDFLARE_ACCOUNT_ID (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

const BUCKET  = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || 'floresco-media';
const PUB_URL = process.env.R2_PUBLIC_URL  || '';   // e.g. https://media.florescofragrances.co.ke

/* ── GET /api/media — list all objects ── */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (!canWriteMedia(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const r2     = getR2Client();
    const prefix = req.nextUrl.searchParams.get('prefix') || '';

    const res = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix || undefined,
      MaxKeys: 500,
    }));

    const files = (res.Contents || []).map(obj => ({
      key:          obj.Key!,
      url:          PUB_URL ? `${PUB_URL}/${obj.Key}` : `/__r2__/${obj.Key}`,
      size:         obj.Size || 0,
      lastModified: obj.LastModified?.toISOString(),
      name:         obj.Key!.split('/').pop() || obj.Key!,
    }));

    return NextResponse.json({ files, total: files.length });
  } catch (err: any) {
    console.error('[GET /api/media]', err.message);
    /* If R2 not configured yet, return empty list gracefully */
    if (err.message.includes('Missing R2 env vars')) {
      return NextResponse.json({ files: [], total: 0, unconfigured: true });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── POST /api/media — get presigned upload URL ── */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (!canWriteMedia(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { filename, contentType, folder } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 });
    }

    /* Sanitise filename */
    const safe = filename
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/-+/g, '-');

    const key = folder ? `${folder}/${Date.now()}-${safe}` : `${Date.now()}-${safe}`;

    const r2  = getR2Client();
    const cmd = new PutObjectCommand({
      Bucket:       BUCKET,
      Key:          key,
      ContentType:  contentType,
      // Filenames are timestamp-prefixed (never reused), so this URL's content
      // never changes — safe to cache aggressively at the browser and CDN edge.
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const presignedUrl = await getSignedUrl(r2, cmd, { expiresIn: 3600 });
    const publicUrl    = PUB_URL
      ? `${PUB_URL}/${key}`
      : `/__r2__/${key}`;

    return NextResponse.json({ presignedUrl, key, publicUrl });
  } catch (err: any) {
    console.error('[POST /api/media]', err.message);
    if (err.message.includes('Missing R2 env vars')) {
      return NextResponse.json({
        error: 'R2 not configured. Add CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME to .env.local',
        unconfigured: true,
      }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── DELETE /api/media — delete an object ── */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (!canWriteMedia(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    const r2 = getR2Client();
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    console.error('[DELETE /api/media]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
