import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';

export const runtime = 'nodejs';

function formatPhone(raw: string): string {
  /* Normalise to 254XXXXXXXXX */
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0'))   return '254' + digits.slice(1);
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('7') || digits.startsWith('1')) return '254' + digits;
  return digits;
}

async function getMpesaToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY    || '';
  const secret = process.env.MPESA_CONSUMER_SECRET || '';
  const creds  = Buffer.from(`${key}:${secret}`).toString('base64');

  const env = process.env.MPESA_ENVIRONMENT === 'production' ? 'api' : 'sandbox';
  const res = await fetch(`https://${env}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  if (!res.ok) throw new Error(`M-Pesa token error: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderNumber } = await req.json();

    if (!phone || !amount || !orderNumber) {
      return NextResponse.json({ error: 'phone, amount and orderNumber are required' }, { status: 400 });
    }

    /* Validate env config */
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey   = process.env.MPESA_PASSKEY;
    const callback  = process.env.MPESA_CALLBACK_URL;

    if (!shortcode || !passkey || !callback) {
      console.warn('[M-Pesa] Missing env vars — MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL');
      return NextResponse.json(
        { error: 'M-Pesa not configured. Set MPESA_SHORTCODE, MPESA_PASSKEY and MPESA_CALLBACK_URL in .env.local' },
        { status: 503 }
      );
    }

    const token     = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const env       = process.env.MPESA_ENVIRONMENT === 'production' ? 'api' : 'sandbox';

    const stkRes = await fetch(`https://${env}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password:          password,
        Timestamp:         timestamp,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            Math.ceil(Number(amount)),
        PartyA:            formatPhone(phone),
        PartyB:            shortcode,
        PhoneNumber:       formatPhone(phone),
        CallBackURL:       callback,
        AccountReference:  orderNumber,
        TransactionDesc:   `Floresco Order ${orderNumber}`,
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      /* Store checkout request ID for callback matching */
      await connectDB();
      await Order.findOneAndUpdate(
        { orderNumber },
        { $set: { 'payment.mpesaCheckoutId': stkData.CheckoutRequestID } }
      );
      return NextResponse.json({ success: true, checkoutRequestId: stkData.CheckoutRequestID });
    }

    return NextResponse.json(
      { error: stkData.errorMessage || stkData.ResponseDescription || 'STK push failed' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[POST /api/payment/mpesa/initiate]', err);
    return NextResponse.json({ error: err.message || 'M-Pesa request failed' }, { status: 500 });
  }
}
