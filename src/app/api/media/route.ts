import { NextRequest, NextResponse } from 'next/server';
import { AwsClient } from 'aws4fetch';
import { auth } from '@/lib/auth';
import { canWriteMedia } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

// The full @aws-sdk/client-s3 package reaches for Node's `fs` (config-file
// credential resolution) even when explicit credentials are passed, which
// Cloudflare Workers' nodejs_compat shim doesn't implement — every call
// fails with "[unenv] fs.readFile is not implemented yet!". aws4fetch signs
// requests with only Web Crypto + fetch, so it works unmodified on Workers.

function getR2() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('Missing R2 env vars: CLOUDFLARE_ACCOUNT_ID (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  }

  const client = new AwsClient({ accessKeyId: accessKey, secretAccessKey: secretKey, service: 's3', region: 'auto' });
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  return { client, endpoint };
}

const BUCKET  = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || 'floresco-media';
const PUB_URL = process.env.R2_PUBLIC_URL  || '';   // e.g. https://media.florescofragrances.co.ke

function xmlTag(block: string, tag: string): string | undefined {
  return block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];
}
function decodeXmlEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/* ── GET /api/media — list all objects ── */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (!canWriteMedia(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { client, endpoint } = getR2();
    const prefix = req.nextUrl.searchParams.get('prefix') || '';

    const listUrl = new URL(`${endpoint}/${BUCKET}`);
    listUrl.searchParams.set('list-type', '2');
    listUrl.searchParams.set('max-keys', '500');
    if (prefix) listUrl.searchParams.set('prefix', prefix);

    const res = await client.fetch(listUrl.toString());
    if (!res.ok) throw new Error(`R2 list failed: ${res.status} ${await res.text()}`);
    const xml = await res.text();

    const contentBlocks = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) || [];
    const files = contentBlocks.map((block) => {
      const key = decodeXmlEntities(xmlTag(block, 'Key') || '');
      return {
        key,
        url:          PUB_URL ? `${PUB_URL}/${key}` : `/__r2__/${key}`,
        size:         Number(xmlTag(block, 'Size') || 0),
        lastModified: xmlTag(block, 'LastModified'),
        name:         key.split('/').pop() || key,
      };
    });

    return NextResponse.json({ files, total: files.length });
  } catch (err: any) {
    console.error('[GET /api/media]', err.message);
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

    const safe = filename.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-');
    const key  = folder ? `${folder}/${Date.now()}-${safe}` : `${Date.now()}-${safe}`;

    const { client, endpoint } = getR2();
    const cacheControl = 'public, max-age=31536000, immutable';

    const signed = await client.sign(`${endpoint}/${BUCKET}/${key}`, {
      method: 'PUT',
      aws: { signQuery: true },
      headers: { 'content-type': contentType, 'cache-control': cacheControl },
    });

    const publicUrl = PUB_URL ? `${PUB_URL}/${key}` : `/__r2__/${key}`;
    return NextResponse.json({ presignedUrl: signed.url, key, publicUrl });
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

    const { client, endpoint } = getR2();
    const res = await client.fetch(`${endpoint}/${BUCKET}/${key}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed: ${res.status} ${await res.text()}`);

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    console.error('[DELETE /api/media]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
