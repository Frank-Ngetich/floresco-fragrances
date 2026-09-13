import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { findUserByEmailWithSecrets } from '@/lib/users';
import { auth } from '@/lib/auth';
import { validatePassword } from '@/lib/password';
import { notifyPasswordChanged } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const db = await getDb();
    const user = await findUserByEmailWithSecrets(db, session.user.email.toLowerCase());
    if (!user?.password) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users)
      .set({ password: passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    notifyPasswordChanged(user.email, user.name).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/account/change-password]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
