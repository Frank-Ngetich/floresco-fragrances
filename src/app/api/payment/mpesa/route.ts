import { NextRequest, NextResponse } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa';
import { normalizePhone } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderNumber } = await req.json();
    if (!phone || !amount || !orderNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    const result = await initiateSTKPush({
      phone: normalizedPhone,
      amount: Math.round(amount),
      orderNumber,
      description: `Floresco Order ${orderNumber}`,
    });

    return NextResponse.json({ success: true, checkoutRequestId: result.CheckoutRequestID });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'M-Pesa request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
