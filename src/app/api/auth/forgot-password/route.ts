import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { findUserByEmailWithSecrets } from '@/lib/users';
import { notifyPasswordReset } from '@/lib/notifications';

export const runtime = 'nodejs';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://florescofragrances.co.ke';
const TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    const generic = NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' });

    if (!email?.trim()) return generic;

    const db = await getDb();
    const normalised = email.trim().toLowerCase();
    const user = await findUserByEmailWithSecrets(db, normalised);

    if (user?.password) {
      const rawToken    = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await db.update(users)
        .set({ resetToken: hashedToken, resetTokenExpiry: new Date(Date.now() + TOKEN_TTL_MS), updatedAt: new Date() })
        .where(eq(users.id, user.id));

      const resetUrl = `${SITE}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalised)}`;
      await notifyPasswordReset(user.email, user.name, resetUrl);
    }

    return generic;
  } catch (err: any) {
    console.error('[POST /api/auth/forgot-password]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
