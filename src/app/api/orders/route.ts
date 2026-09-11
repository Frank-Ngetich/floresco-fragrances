import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, User } from '@/models';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import { calcDiscount } from '@/lib/coupons';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

function generateOrderNumber(): string {
  const now    = new Date();
  const date   = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `FL-${date}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
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

    /* Ensure customer record exists (upsert by email) */
    const customerUser = await User.findOneAndUpdate(
      { email: customer.email.toLowerCase() },
      {
        $setOnInsert: {
          email: customer.email.toLowerCase(),
          name:  customer.name,
          phone: customer.phone,
          role:  'customer',
        },
      },
      { upsert: true, new: true }
    );

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: {
        userId: sessionUserId || customerUser._id,
        name:   customer.name,
        email:  customer.email.toLowerCase(),
        phone:  customer.phone,
      },
      items: items.map((i: any) => ({
        productId: i.productId,
        name:      i.name,
        brand:     i.brand || '',
        size:      i.size,
        price:     Number(i.price),
        quantity:  Number(i.quantity),
        image:     i.image || '',
      })),
      delivery: {
        method:  delivery?.method || 'courier',
        fee:     Number(delivery?.fee ?? 0),
        address: delivery?.address || null,
      },
      payment: {
        method: payment?.method || 'mpesa',
        status: 'pending',
        amount: recomputedTotal,
      },
      discount: discountAmount > 0 ? { code: discount.code.trim().toUpperCase(), amount: discountAmount } : undefined,
      subtotal: Number(subtotal),
      total:    recomputedTotal,
      status:   'pending',
      statusHistory: [{ status: 'pending', updatedAt: new Date() }],
    });

    return NextResponse.json({ orderNumber, _id: order._id }, { status: 201 });
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

    await connectDB();
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, Number(searchParams.get('page')  || 1));
    const limit  = Math.min(100, Number(searchParams.get('limit') || 20));
    const status = searchParams.get('status');
    const query: any = {};
    if (status && status !== 'all') query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
