// ============================================================
// M-PESA DARAJA API
// Docs: developer.safaricom.co.ke
// ============================================================

const BASE_URL =
  process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

export async function getMpesaToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const auth   = Buffer.from(`${key}:${secret}`).toString('base64');

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`M-Pesa token error: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function initiateSTKPush({
  phone, amount, orderNumber, description,
}: {
  phone: string;
  amount: number;
  orderNumber: string;
  description: string;
}) {
  const token     = await getMpesaToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey   = process.env.MPESA_PASSKEY!;
  const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: orderNumber,
      TransactionDesc: description,
    }),
  });

  const data = await res.json();
  if (data.ResponseCode !== '0') {
    throw new Error(data.ResponseDescription || 'STK push failed');
  }
  return data;
}

export function parseMpesaCallback(body: Record<string, unknown>): {
  success: boolean;
  orderNumber: string;
  receipt?: string;
  amount?: number;
  phone?: string;
} {
  const cb = (body as { Body: { stkCallback: {
    ResultCode: number;
    CallbackMetadata?: { Item: { Name: string; Value: unknown }[] };
  } } }).Body.stkCallback;

  const success = cb.ResultCode === 0;
  const items   = cb.CallbackMetadata?.Item ?? [];

  const get = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    success,
    orderNumber:  String(get('AccountReference') ?? ''),
    receipt:      String(get('MpesaReceiptNumber') ?? ''),
    amount:       Number(get('Amount') ?? 0),
    phone:        String(get('PhoneNumber') ?? ''),
  };
}
