import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';

export const runtime = 'nodejs';

// TEMPORARY diagnostic route — reports only booleans/counts, never actual
// secret values or password hashes. Delete this file once the Cloudflare
// env var / database issue is resolved.
export async function GET() {
  const keys = Object.keys(process.env);
  const result: Record<string, unknown> = {
    totalEnvKeys: keys.length,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasR2AccountId: !!(process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID),
    hasR2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
    hasR2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    hasR2BucketName: !!(process.env.R2_BUCKET_NAME || process.env.R2_BUCKET),
    hasR2PublicUrl: !!process.env.R2_PUBLIC_URL,
    r2PublicUrl: process.env.R2_PUBLIC_URL || null,
    r2BucketName: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || null,
    hasMpesaConsumerKey:    !!process.env.MPESA_CONSUMER_KEY,
    hasMpesaConsumerSecret: !!process.env.MPESA_CONSUMER_SECRET,
    hasMpesaShortcode:      !!process.env.MPESA_SHORTCODE,
    hasMpesaPasskey:        !!process.env.MPESA_PASSKEY,
    mpesaCallbackUrl:       process.env.MPESA_CALLBACK_URL || null,
    mpesaEnvironment:       process.env.MPESA_ENVIRONMENT || null,
    mongoUriHost: process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || null,
    mongoUriDbName: process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || null,
  };

  try {
    await connectDB();
    const userCount = await User.countDocuments({});
    const owner = await User.findOne({ email: 'owner@florescofragrances.co.ke' }).select('email role').lean();
    result.dbConnected = true;
    result.userCount = userCount;
    result.ownerExists = !!owner;
    result.ownerRole = (owner as any)?.role || null;
  } catch (err: any) {
    result.dbConnected = false;
    result.dbError = err.message;
  }

  return NextResponse.json(result);
}
