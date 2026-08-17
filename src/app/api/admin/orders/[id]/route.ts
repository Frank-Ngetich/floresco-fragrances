import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';
import { notifyOrderStatusChange } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { status, trackingNumber, note } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(
      { $or: [{ _id: params.id.length === 24 ? params.id : null }, { orderNumber: params.id }] },
      {
        $set: {
          status,
          ...(trackingNumber ? { trackingNumber } : {}),
        },
        $push: {
          statusHistory: {
            status,
            updatedAt: new Date(),
            ...(note ? { note } : {}),
          },
        },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    /* Fire-and-forget notifications */
    try {
      await notifyOrderStatusChange(order.toObject(), note);
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
    await connectDB();
    const order = await Order.findOne({
      $or: [
        { _id: params.id.length === 24 ? params.id : undefined },
        { orderNumber: params.id },
      ],
    }).lean();
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
