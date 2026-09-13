import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canManageTeam } from '@/lib/permissions';
import { notifyTeamInvite } from '@/lib/notifications';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

const TEAM_ROLES: UserRole[] = ['staff', 'manager', 'owner'];

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canManageTeam(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await getDb();
    const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!target || !TEAM_ROLES.includes(target.role as UserRole)) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await db.update(users).set({ password: passwordHash, mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, target.id));

    notifyTeamInvite(target.email, target.name, tempPassword, target.role).catch(console.error);

    return NextResponse.json({ tempPassword });
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
