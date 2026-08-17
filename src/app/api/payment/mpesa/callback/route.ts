import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    await connectDB();

    if (ResultCode === 0) {
      /* Payment successful */
      const meta: Record<string, any> = {};
      (CallbackMetadata?.Item || []).forEach((item: any) => {
        meta[item.Name] = item.Value;
      });

      await Order.findOneAndUpdate(
        { 'payment.mpesaCheckoutId': CheckoutRequestID },
        {
          $set: {
            'payment.status':      'paid',
            'payment.mpesaRef':    meta.MpesaReceiptNumber || '',
            'payment.paidAt':      new Date(),
            status:                'confirmed',
          },
          $push: {
            statusHistory: {
              status:    'confirmed',
              updatedAt: new Date(),
              note:      `M-Pesa payment received. Ref: ${meta.MpesaReceiptNumber || 'N/A'}`,
            },
          },
        }
      );
    } else {
      /* Payment failed or cancelled */
      await Order.findOneAndUpdate(
        { 'payment.mpesaCheckoutId': CheckoutRequestID },
        {
          $set: {
            'payment.status':        'failed',
            'payment.failureReason': ResultDesc,
          },
        }
      );
    }

    /* Always return 200 to Safaricom or they will retry */
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('[POST /api/payment/mpesa/callback]', err);
    /* Still 200 to prevent Safaricom retries */
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
