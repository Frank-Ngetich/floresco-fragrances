import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { findUserByEmail } from '@/lib/users';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const db = await getDb();
    const email = session.user.email.toLowerCase();
    const { name, phone } = await req.json();

    const existing = await findUserByEmail(db, email);
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await db.update(users)
      .set({
        ...(name  ? { name: name.trim() }   : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return NextResponse.json({
      name:  name  ? name.trim()  : existing.name,
      email: existing.email,
      phone: phone ? phone.trim() : existing.phone,
    });
  } catch (err: any) {
    console.error('[PATCH /api/account/profile]', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
