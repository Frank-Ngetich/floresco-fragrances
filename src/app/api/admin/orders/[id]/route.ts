import { NextRequest, NextResponse } from 'next/server';
import { or, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { orders, orderStatusHistory } from '@/db/schema';
import { toIOrder } from '@/lib/orders';
import { notifyOrderStatusChange } from '@/lib/notifications';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

// SQL string equality has no equivalent to Mongoose's CastError on a
// malformed ObjectId, so — unlike the old code — this can just try both
// columns unconditionally rather than pre-checking the param's shape.
function byIdOrOrderNumber(id: string) {
  return or(eq(orders.id, id), eq(orders.orderNumber, id));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status, trackingNumber, note } = await req.json();
    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const db = await getDb();
    const [existing] = await db.select({ id: orders.id }).from(orders).where(byIdOrOrderNumber(params.id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const now = new Date();
    await db.batch([
      db.update(orders)
        .set({ status, ...(trackingNumber ? { trackingNumber } : {}), updatedAt: now })
        .where(eq(orders.id, existing.id)),
      db.insert(orderStatusHistory).values({ orderId: existing.id, status, updatedAt: now, ...(note ? { note } : {}) }),
    ]);

    const row = await db.query.orders.findFirst({ where: eq(orders.id, existing.id), with: { items: true, statusHistory: true, notifications: true } });
    const order = toIOrder(row);

    /* Fire-and-forget notifications */
    try {
      await notifyOrderStatusChange(order, note);
    } catch (notifErr) {
      console.warn('[notifications] Failed to send status email:', notifErr);
      /* Don't fail the request if notification fails */
    }

    return NextResponse.json(order);
  } catch (err: any) {
    console.error('[PATCH /api/admin/orders/:id]', err);
    return NextResponse.json({ error: err.message || 'Failed to update order' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const row = await db.query.orders.findFirst({
      where: byIdOrOrderNumber(params.id),
      with: { items: true, statusHistory: true, notifications: true },
    });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toIOrder(row));
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
