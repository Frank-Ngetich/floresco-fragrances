import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, User } from '@/models';

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

    const { customer, items, delivery, payment, subtotal, total } = body;

    if (!customer?.email || !customer?.phone || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields: customer.email, customer.phone, items' }, { status: 400 });
    }

    /* Ensure customer record exists (upsert by email) */
    await User.findOneAndUpdate(
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
        name:  customer.name,
        email: customer.email.toLowerCase(),
        phone: customer.phone,
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
        amount: Number(payment?.amount ?? total),
      },
      subtotal: Number(subtotal),
      total:    Number(total),
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
