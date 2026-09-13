import { NextRequest, NextResponse } from 'next/server';
import { and, gte, eq, inArray, lt, sum, count, countDistinct } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { orders, products, productSizes, users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'dashboard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      [todayAgg], [weekAgg], [{ value: pendingCount }], [{ value: totalOrders }],
      [{ value: totalCustomers }], [{ value: lowStockCount }],
    ] = await Promise.all([
      db.select({ total: sum(orders.total) }).from(orders)
        .where(and(gte(orders.createdAt, todayStart), eq(orders.paymentStatus, 'paid'))),
      db.select({ total: sum(orders.total) }).from(orders)
        .where(and(gte(orders.createdAt, weekStart), eq(orders.paymentStatus, 'paid'))),
      db.select({ value: count() }).from(orders)
        .where(inArray(orders.status, ['pending', 'confirmed', 'packed'])),
      db.select({ value: count() }).from(orders),
      db.select({ value: count() }).from(users).where(eq(users.role, 'customer')),
      db.select({ value: countDistinct(products.id) }).from(products)
        .innerJoin(productSizes, eq(productSizes.productId, products.id))
        .where(and(lt(productSizes.stock, 5), eq(products.status, 'active'))),
    ]);

    return NextResponse.json({
      todayRevenue:  Number(todayAgg?.total ?? 0),
      weekRevenue:   Number(weekAgg?.total ?? 0),
      pendingOrders: pendingCount,
      totalOrders,
      totalCustomers,
      lowStockCount,
    });
  } catch (err: any) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
