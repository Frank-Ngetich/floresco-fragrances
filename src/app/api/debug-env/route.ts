import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// TEMPORARY diagnostic route — reports only booleans/counts, never actual
// secret values. Delete this file once the Cloudflare env var issue is
// resolved.
export async function GET() {
  const keys = Object.keys(process.env);
  return NextResponse.json({
    totalEnvKeys: keys.length,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasR2AccountId: !!process.env.R2_ACCOUNT_ID,
    sampleKeys: keys.slice(0, 15),
  });
}
