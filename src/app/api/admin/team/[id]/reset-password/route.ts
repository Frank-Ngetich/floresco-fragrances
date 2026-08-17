import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { auth } from '@/lib/auth';
import { canManageTeam } from '@/lib/permissions';
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

    await connectDB();
    const target = await User.findById(params.id);
    if (!target || !TEAM_ROLES.includes(target.role)) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    const tempPassword = generateTempPassword();
    target.password = await bcrypt.hash(tempPassword, 12);
    await target.save();

    return NextResponse.json({ tempPassword });
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
