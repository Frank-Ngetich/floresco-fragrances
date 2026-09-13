import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { findUserByEmailWithSecrets } from '@/lib/users';
import { newId } from '@/lib/id';
import { validatePassword } from '@/lib/password';
import { notifyWelcome } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required.' },
        { status: 400 }
      );
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const db = await getDb();
    const normalised = email.trim().toLowerCase();
    const existing = await findUserByEmailWithSecrets(db, normalised);

    /* A real, already-registered account has a password set — block it. */
    if (existing?.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    /* No account yet, OR a passwordless "guest" record created during a
       guest checkout — either way, claim/create it with the new password. */
    let customer: { id: string; name: string; email: string };
    if (existing) {
      await db.update(users)
        .set({ name: name.trim(), phone: phone?.trim() || existing.phone, password: passwordHash, updatedAt: now })
        .where(eq(users.id, existing.id));
      customer = { id: existing.id, name: name.trim(), email: existing.email };
    } else {
      const id = newId();
      await db.insert(users).values({
        id, name: name.trim(), email: normalised, phone: phone?.trim() || null,
        role: 'customer', password: passwordHash, createdAt: now, updatedAt: now,
      });
      customer = { id, name: name.trim(), email: normalised };
    }

    notifyWelcome(customer.email, customer.name).catch(console.error);

    return NextResponse.json(
      { _id: customer.id, name: customer.name, email: customer.email },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
