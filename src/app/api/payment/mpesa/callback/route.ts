import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { orders, orderStatusHistory } from '@/db/schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    const db = await getDb();
    const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.mpesaCheckoutId, CheckoutRequestID)).limit(1);

    if (order) {
      const now = new Date();
      if (ResultCode === 0) {
        /* Payment successful */
        const meta: Record<string, any> = {};
        (CallbackMetadata?.Item || []).forEach((item: any) => {
          meta[item.Name] = item.Value;
        });

        await db.batch([
          db.update(orders)
            .set({ paymentStatus: 'paid', mpesaRef: meta.MpesaReceiptNumber || '', paymentPaidAt: now, status: 'confirmed', updatedAt: now })
            .where(eq(orders.id, order.id)),
          db.insert(orderStatusHistory).values({
            orderId: order.id, status: 'confirmed', updatedAt: now,
            note: `M-Pesa payment received. Ref: ${meta.MpesaReceiptNumber || 'N/A'}`,
          }),
        ]);
      } else {
        /* Payment failed or cancelled */
        await db.update(orders)
          .set({ paymentStatus: 'failed', paymentFailureReason: ResultDesc, updatedAt: now })
          .where(eq(orders.id, order.id));
      }
    }

    /* Always return 200 to Safaricom or they will retry */
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('[POST /api/payment/mpesa/callback]', err);
    /* Still 200 to prevent Safaricom retries */
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
