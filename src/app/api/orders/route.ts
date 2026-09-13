import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { orders, orderItems, orderStatusHistory, users } from '@/db/schema';
import { toIOrder, generateOrderNumber } from '@/lib/orders';
import { newId } from '@/lib/id';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import { calcDiscount } from '@/lib/coupons';
import { notifyOrderConfirmation, notifyAdminNewOrder } from '@/lib/notifications';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    const { customer, items, delivery, payment, discount, subtotal } = body;

    if (!customer?.email || !customer?.phone || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields: customer.email, customer.phone, items' }, { status: 400 });
    }

    /* Never trust a client-supplied discount amount — recompute it
       server-side from the known coupon list against the real subtotal. */
    const discountAmount = calcDiscount(discount?.code, Number(subtotal) || 0);
    const recomputedTotal = (Number(subtotal) || 0) + Number(delivery?.fee ?? 0) - discountAmount;

    /* If the shopper is logged in, tag the order with their real account ID
       so it reliably shows up in their order history even if the email they
       typed at checkout doesn't exactly match their account email. */
    const session = await auth();
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;

    /* Ensure a customer record exists (upsert-by-email, insert-only —
       never overwrites an existing account's name/phone). */
    const email = customer.email.toLowerCase();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    let customerUserId = existingUser?.id;
    if (!customerUserId) {
      customerUserId = newId();
      const now = new Date();
      await db.insert(users).values({
        id: customerUserId, email, name: customer.name, phone: customer.phone, role: 'customer',
        createdAt: now, updatedAt: now,
      });
    }

    const orderNumber = generateOrderNumber();
    const orderId = newId();
    const now = new Date();

    await db.batch([
      db.insert(orders).values({
        id: orderId,
        orderNumber,
        customerUserId: sessionUserId || customerUserId,
        customerEmail: email,
        customerPhone: customer.phone,
        customerName: customer.name,
        deliveryMethod: delivery?.method || 'courier',
        deliveryAddress: delivery?.address || null,
        deliveryFee: Number(delivery?.fee ?? 0),
        paymentMethod: payment?.method || 'mpesa',
        paymentStatus: 'pending',
        paymentAmount: recomputedTotal,
        status: 'pending',
        subtotal: Number(subtotal),
        discountCode: discountAmount > 0 ? discount.code.trim().toUpperCase() : null,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        total: recomputedTotal,
        createdAt: now,
        updatedAt: now,
      }),
      ...items.map((i: any) => db.insert(orderItems).values({
        orderId, productId: i.productId || null, name: i.name, size: i.size,
        price: Number(i.price), quantity: Number(i.quantity), image: i.image || null,
      })),
      db.insert(orderStatusHistory).values({ orderId, status: 'pending', updatedAt: now }),
    ] as any);

    /* Fire-and-forget — don't make the customer wait on email delivery */
    const created = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true, statusHistory: true, notifications: true } });
    const orderObj = toIOrder(created);
    notifyOrderConfirmation(orderObj).catch(console.error);
    notifyAdminNewOrder(orderObj).catch(console.error);

    return NextResponse.json({ orderNumber, _id: orderId }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, Number(searchParams.get('page')  || 1));
    const limit  = Math.min(100, Number(searchParams.get('limit') || 20));
    const status = searchParams.get('status');
    const where = status && status !== 'all' ? eq(orders.status, status as any) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db.query.orders.findMany({
        where, orderBy: desc(orders.createdAt),
        offset: (page - 1) * limit, limit,
        with: { items: true, statusHistory: true, notifications: true },
      }),
      db.select({ value: count() }).from(orders).where(where),
    ]);

    return NextResponse.json({ orders: rows.map(toIOrder), total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
