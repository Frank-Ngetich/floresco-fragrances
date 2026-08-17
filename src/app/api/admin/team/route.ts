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

    await connectDB();
    const team = await User.find({ role: { $in: TEAM_ROLES } })
      .select('name email role createdAt')
      .sort({ createdAt: 1 })
      .lean();
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

    await connectDB();
    const normalised = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalised }).select('+password');
    if (existing?.password) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    let member;
    if (existing) {
      // A passwordless guest-checkout record already exists for this email — claim it.
      existing.name = name.trim();
      existing.role = newRole;
      existing.password = passwordHash;
      await existing.save();
      member = existing;
    } else {
      member = await User.create({ name: name.trim(), email: normalised, role: newRole, password: passwordHash });
    }

    return NextResponse.json({
      user: { _id: member._id, name: member.name, email: member.email, role: member.role },
      tempPassword,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create account' }, { status: 500 });
  }
}
