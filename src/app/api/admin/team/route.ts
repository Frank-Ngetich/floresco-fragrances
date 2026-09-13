import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { inArray, eq, asc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { findUserByEmailWithSecrets } from '@/lib/users';
import { newId } from '@/lib/id';
import { auth } from '@/lib/auth';
import { canManageTeam } from '@/lib/permissions';
import { notifyTeamInvite } from '@/lib/notifications';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

const TEAM_ROLES: UserRole[] = ['staff', 'manager', 'owner'];

function generateTempPassword() {
  // Avoid visually ambiguous characters (0/O, l/1/I) for easy sharing.
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canManageTeam(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await getDb();
    const team = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
      .from(users)
      .where(inArray(users.role, TEAM_ROLES))
      .orderBy(asc(users.createdAt));
    return NextResponse.json({ team });
  } catch {
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canManageTeam(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, email, role: newRole } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }
    if (!TEAM_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Role must be staff, manager, or owner.' }, { status: 400 });
    }

    const db = await getDb();
    const normalised = email.trim().toLowerCase();
    const existing = await findUserByEmailWithSecrets(db, normalised);
    if (existing?.password) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const now = new Date();

    let member: { id: string; name: string; email: string; role: UserRole };
    if (existing) {
      // A passwordless guest-checkout record already exists for this email — claim it.
      await db.update(users)
        .set({ name: name.trim(), role: newRole, password: passwordHash, mustChangePassword: true, updatedAt: now })
        .where(eq(users.id, existing.id));
      member = { id: existing.id, name: name.trim(), email: existing.email, role: newRole };
    } else {
      const id = newId();
      await db.insert(users).values({
        id, name: name.trim(), email: normalised, role: newRole,
        password: passwordHash, mustChangePassword: true, createdAt: now, updatedAt: now,
      });
      member = { id, name: name.trim(), email: normalised, role: newRole };
    }

    notifyTeamInvite(member.email, member.name, tempPassword, member.role).catch(console.error);

    return NextResponse.json({
      user: { _id: member.id, name: member.name, email: member.email, role: member.role },
      tempPassword,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create account' }, { status: 500 });
  }
}
