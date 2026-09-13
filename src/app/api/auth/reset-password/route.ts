import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { validatePassword } from '@/lib/password';
import { notifyPasswordChanged } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();
    if (!email?.trim() || !token?.trim() || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const db = await getDb();
    const normalised  = email.trim().toLowerCase();
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const [user] = await db.select().from(users).where(and(
      eq(users.email, normalised),
      eq(users.resetToken, hashedToken),
      gt(users.resetTokenExpiry, new Date()),
    )).limit(1);

    if (!user) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(users)
      .set({ password: passwordHash, mustChangePassword: false, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    notifyPasswordChanged(user.email, user.name).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/auth/reset-password]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
