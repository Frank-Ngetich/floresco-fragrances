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
    hasR2AccountId: !!process.env.R2_ACCOUNT_ID,
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
