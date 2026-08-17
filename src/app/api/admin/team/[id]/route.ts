import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { auth } from '@/lib/auth';
import { canManageTeam } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

const TEAM_ROLES: UserRole[] = ['staff', 'manager', 'owner'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    const actorId = (session?.user as { id?: string })?.id;
    if (!canManageTeam(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { role: newRole } = await req.json();
    if (!TEAM_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Role must be staff, manager, or owner.' }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(params.id);
    if (!target || !TEAM_ROLES.includes(target.role)) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    if (target.role === 'owner' && newRole !== 'owner' && String(target._id) === actorId) {
      return NextResponse.json({ error: "You can't change your own role away from Owner." }, { status: 400 });
    }
    if (target.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await User.countDocuments({ role: 'owner' });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'At least one Owner account must remain.' }, { status: 400 });
      }
    }

    target.role = newRole;
    await target.save();
    return NextResponse.json({ _id: target._id, name: target.name, email: target.email, role: target.role });
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    const actorId = (session?.user as { id?: string })?.id;
    if (!canManageTeam(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (params.id === actorId) {
      return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(params.id);
    if (!target || !TEAM_ROLES.includes(target.role)) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    if (target.role === 'owner') {
      const ownerCount = await User.countDocuments({ role: 'owner' });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'At least one Owner account must remain.' }, { status: 400 });
      }
    }

    await User.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}
