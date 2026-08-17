import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    await connectDB();
    const { name, phone } = await req.json();

    const customer = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      { $set: { ...(name ? { name: name.trim() } : {}), ...(phone ? { phone: phone.trim() } : {}) } },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ name: customer.name, email: customer.email, phone: customer.phone });
  } catch (err: any) {
    console.error('[PATCH /api/account/profile]', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
