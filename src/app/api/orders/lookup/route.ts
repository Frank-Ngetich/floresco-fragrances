import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { toIOrder } from '@/lib/orders';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = req.nextUrl;
    const orderNumber = searchParams.get('orderNumber')?.trim();
    const email       = searchParams.get('email')?.trim().toLowerCase();

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'orderNumber and email are required' },
        { status: 400 }
      );
    }

    const row = await db.query.orders.findFirst({
      where: and(eq(orders.orderNumber, orderNumber), eq(orders.customerEmail, email)),
      with: { items: true, statusHistory: true },
    });

    if (!row) {
      return NextResponse.json(
        { error: 'Order not found. Please check your order number and email address.' },
        { status: 404 }
      );
    }

    const order = toIOrder(row);
    /* Strip sensitive internal fields before returning */
    const safe = {
      orderNumber:    order.orderNumber,
      status:         order.status,
      createdAt:      order.createdAt,
      customer: {
        name:  order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      items:          order.items,
      delivery:       order.delivery,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        amount: order.payment.amount,
      },
      subtotal:       order.subtotal,
      total:          order.total,
      statusHistory:  order.statusHistory,
      trackingNumber: order.trackingNumber || null,
    };

    return NextResponse.json(safe);
  } catch (err: any) {
    console.error('[GET /api/orders/lookup]', err);
    return NextResponse.json({ error: 'Failed to look up order' }, { status: 500 });
  }
}
