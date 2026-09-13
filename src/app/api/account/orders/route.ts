import { NextRequest, NextResponse } from 'next/server';
import { or, eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { toIOrder } from '@/lib/orders';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const userId = (session.user as { id?: string }).id;
    const email = session.user.email.toLowerCase();

    const db = await getDb();
    /* Match by account ID first (reliable, set on every order going forward)
       and fall back to email for orders placed before this existed. */
    const rows = await db.query.orders.findMany({
      where: userId ? or(eq(orders.customerUserId, userId), eq(orders.customerEmail, email)) : eq(orders.customerEmail, email),
      orderBy: desc(orders.createdAt),
      with: { items: true },
    });

    const result = rows.map(toIOrder).map((o) => ({
      orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt, items: o.items, total: o.total, payment: o.payment,
    }));
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[GET /api/account/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
