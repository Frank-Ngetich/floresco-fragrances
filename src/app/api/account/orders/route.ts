import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    await connectDB();

    const orders = await Order.find({ 'customer.email': session.user.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .select('orderNumber status createdAt items total payment')
      .lean();

    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('[GET /api/account/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
