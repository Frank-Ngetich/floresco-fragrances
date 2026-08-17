'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Check, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { BottleSVG } from '@/components/ui/BottleSVG';
import { formatKES } from '@/lib/utils';

const T = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

const COUNTIES = [
  'Uasin Gishu', 'Nairobi', 'Nakuru', 'Kisumu', 'Mombasa', 'Kiambu',
  'Meru', 'Nyeri', 'Kakamega', 'Machakos', 'Eldoret Town', 'Other',
];

function calcShipping(county: string, method: 'pickup' | 'courier'): number {
  if (method === 'pickup') return 0;
  if (county === 'Uasin Gishu' || county === 'Eldoret Town') return 0;
  if (county === 'Nairobi' || county === 'Kiambu') return 500;
  return 600;
}

type Step = 'details' | 'payment' | 'processing' | 'success';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  instructions: string;
}

export function CheckoutClient() {
  const { items, total, clearCart } = useCart();
  const [mounted,  setMounted]  = useState(false);
  const [step,     setStep]     = useState<Step>('details');
  const [delivery, setDelivery] = useState<'pickup' | 'courier'>('courier');
  const [payment,  setPayment]  = useState<'mpesa' | 'card' | 'cod' | 'bank'>('mpesa');
  const [county,   setCounty]   = useState('Uasin Gishu');
  const [error,    setError]    = useState('');
  const [orderRef, setOrderRef] = useState('');       // from server
  const [mpesaMsg, setMpesaMsg] = useState('');
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', county: 'Uasin Gishu', instructions: '',
  });

  useEffect(() => { setMounted(true); }, []);

  const up = (k: keyof CheckoutForm, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (k === 'county') setCounty(v);
    setError('');
  };

  const subtotal   = total();
  const shipping   = calcShipping(county, delivery);
  const orderTotal = subtotal + shipping;

  /* ── Validation ─────────────────────────────────── */
  function validateDetails(): string {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 9) return 'Valid phone number is required.';
    if (delivery === 'courier' && !form.street.trim()) return 'Street address is required for courier delivery.';
    if (delivery === 'courier' && !form.city.trim()) return 'Town is required for courier delivery.';
    return '';
  }

  function validatePayment(): string {
    if (payment === 'mpesa' && form.phone.replace(/\D/g, '').length < 9) return 'Valid M-Pesa phone number required.';
    if (payment === 'cod' && delivery === 'courier' && county !== 'Uasin Gishu' && county !== 'Eldoret Town') {
      return 'Cash on Delivery is only available within Eldoret.';
    }
    return '';
  }

  /* ── Place order ────────────────────────────────── */
  async function placeOrder() {
    const err = validatePayment();
    if (err) { setError(err); return; }
    setError('');
    setStep('processing');

    const orderPayload = {
      customer: {
        name:  `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      },
      items: items.map(i => ({
        productId: i.productId,
        name:      i.name,
        brand:     i.brand,
        size:      i.size,
        price:     i.price,
        quantity:  i.quantity,
        image:     i.image,
      })),
      delivery: {
        method:  delivery,
        fee:     shipping,
        address: delivery === 'courier' ? {
          street:       form.street.trim(),
          city:         form.city.trim(),
          county:       county,
          instructions: form.instructions.trim(),
        } : null,
      },
      payment: {
        method: payment,
        amount: orderTotal,
        status: 'pending',
      },
      subtotal,
      total: orderTotal,
    };

    try {
      /* 1 — Create order in DB */
      const orderRes = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${orderRes.status}`);
      }

      const { orderNumber } = await orderRes.json();
      if (!orderNumber) throw new Error('Order created but no reference received.');
      setOrderRef(orderNumber);

      /* 2 — Initiate payment */
      if (payment === 'mpesa') {
        const mpesaRes = await fetch('/api/payment/mpesa/initiate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            phone:       form.phone.trim(),
            amount:      orderTotal,
            orderNumber,
          }),
        });
        const mpesaData = await mpesaRes.json().catch(() => ({}));
        if (mpesaRes.ok) {
          setMpesaMsg(`M-Pesa prompt sent to ${form.phone}. Enter your PIN to complete payment.`);
        } else {
          /* STK push failed — order still exists, user can pay manually */
          setMpesaMsg(`Order placed. M-Pesa prompt failed — please call us on +254 7XX XXX XXX to complete payment for order ${orderNumber}.`);
        }
      }

      /* 3 — Clear cart and show success */
      clearCart();
      setStep('success');

    } catch (e: any) {
      setStep('payment');
      setError(e.message || 'Something went wrong. Please try again.');
    }
  }

  if (!mounted) return null;

  if (items.length === 0 && step !== 'success' && step !== 'processing') {
    return (
      <div className="page-enter min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <h2 className="font-display text-3xl mb-4">Your bag is empty</h2>
        <Link href="/shop" className="btn-primary">Browse Collection</Link>
      </div>
    );
  }

  const STEPS = [
    { id: 'details',  label: 'Details' },
    { id: 'payment',  label: 'Payment' },
    { id: 'success',  label: 'Done' },
  ] as const;

  const stepIdx = step === 'processing' ? 1 : STEPS.findIndex(s => s.id === step);

  return (
    <div className="page-enter">
      {/* Progress bar */}
      <div className="border-b border-stone/8 bg-stone/[0.02]">
        <div className="max-w-[900px] mx-auto px-6 py-5 flex items-center justify-center gap-2 sm:gap-6">
          {STEPS.map((s, i) => {
            const done   = stepIdx > i;
            const active = stepIdx === i;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.7rem] font-medium transition-all
                  ${done   ? 'bg-stone text-white'
                  : active ? 'bg-wine-600 text-white'
                           : 'border border-stone/20 text-stone/30'}`}>
                  {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-[0.7rem] tracking-[0.14em] uppercase font-medium hidden sm:block
                  ${active ? 'text-stone' : 'text-stone/35'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <ChevronRight size={14} className="text-stone/20 ml-2" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-14">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Details ── */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={T}>
              <div className="grid lg:grid-cols-[1fr_340px] gap-14">
                <div>
                  {error && <ErrorBanner message={error} />}

                  <h2 className="font-display text-2xl mb-7">Contact Details</h2>
                  <div className="space-y-4 mb-10">
                    <div className="grid grid-cols-2 gap-4">
                      <CField label="First Name *">
                        <input required value={form.firstName} onChange={e => up('firstName', e.target.value)}
                          className="input-luxury" placeholder="Amina" />
                      </CField>
                      <CField label="Last Name">
                        <input value={form.lastName} onChange={e => up('lastName', e.target.value)}
                          className="input-luxury" placeholder="Kiptoo" />
                      </CField>
                    </div>
                    <CField label="Email *">
                      <input required type="email" value={form.email} onChange={e => up('email', e.target.value)}
                        className="input-luxury" placeholder="you@example.com" />
                    </CField>
                    <CField label="Phone * (used for M-Pesa & delivery updates)">
                      <input required value={form.phone} onChange={e => up('phone', e.target.value)}
                        className="input-luxury" placeholder="0712 345 678" />
                    </CField>
                  </div>

                  <h2 className="font-display text-2xl mb-5">Delivery Method</h2>
                  <div className="space-y-3 mb-8">
                    {([
                      ['pickup',  'Pickup at Kapsoya',    'Kapsoya Business Park, Eldoret · Free',     'Free'],
                      ['courier', 'Courier Delivery',     'Nationwide · 1–3 business days · From KES 0', 'KES 0–600'],
                    ] as const).map(([id, label, desc, badge]) => (
                      <label key={id} className={`flex items-start sm:items-center gap-4 p-4 border cursor-pointer transition-all
                        ${delivery === id ? 'border-wine-500 bg-wine-50' : 'border-stone/15 hover:border-stone/30'}`}>
                        <input type="radio" name="delivery" value={id} checked={delivery === id}
                          onChange={() => setDelivery(id)} className="mt-1 sm:mt-0 accent-wine-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{label}</div>
                          <div className="text-stone/45 text-xs mt-0.5">{desc}</div>
                        </div>
                        <span className="text-[0.65rem] tracking-wide text-wine-600 font-medium flex-shrink-0">{badge}</span>
                      </label>
                    ))}
                  </div>

                  {delivery === 'courier' && (
                    <div className="space-y-4 mb-8">
                      <CField label="Street Address *">
                        <input value={form.street} onChange={e => up('street', e.target.value)}
                          className="input-luxury" placeholder="Estate, road, building, house number" />
                      </CField>
                      <div className="grid grid-cols-2 gap-4">
                        <CField label="Town / City *">
                          <input value={form.city} onChange={e => up('city', e.target.value)}
                            className="input-luxury" placeholder="Nairobi" />
                        </CField>
                        <CField label="County *">
                          <select value={county} onChange={e => { up('county', e.target.value); }}
                            className="input-luxury">
                            {COUNTIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </CField>
                      </div>
                      <CField label="Delivery Instructions">
                        <input value={form.instructions} onChange={e => up('instructions', e.target.value)}
                          className="input-luxury" placeholder="Gate colour, nearest landmark…" />
                      </CField>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const err = validateDetails();
                      if (err) { setError(err); return; }
                      setError('');
                      setStep('payment');
                    }}
                    className="btn-primary w-full justify-center">
                    Continue to Payment
                  </button>
                </div>
                <OrderSummary items={items} subtotal={subtotal} shipping={shipping} total={orderTotal} />
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={T}>
              <div className="grid lg:grid-cols-[1fr_340px] gap-14">
                <div>
                  <button onClick={() => { setStep('details'); setError(''); }}
                    className="text-[0.7rem] tracking-wide uppercase text-stone/40 hover:text-stone mb-6 flex items-center gap-1">
                    ← Back to Details
                  </button>

                  {error && <ErrorBanner message={error} />}

                  <h2 className="font-display text-2xl mb-7">Payment Method</h2>
                  <div className="space-y-3 mb-8">
                    {([
                      ['mpesa', 'M-Pesa STK Push',   'A prompt is sent to your phone. Enter your PIN.', 'Recommended'],
                      ['card',  'Card Payment',       'Visa or Mastercard — secured by Flutterwave.',    ''],
                      ['cod',   'Cash on Delivery',   'Pay on arrival. Eldoret only.',                   'Eldoret only'],
                      ['bank',  'Bank Transfer',      'Equity Bank. Ref code provided after ordering.',  ''],
                    ] as const).map(([id, label, desc, badge]) => (
                      <label key={id} className={`flex items-start sm:items-center gap-4 p-4 border cursor-pointer transition-all
                        ${payment === id ? 'border-wine-500 bg-wine-50' : 'border-stone/15 hover:border-stone/30'}`}>
                        <input type="radio" name="payment" value={id} checked={payment === id}
                          onChange={() => setPayment(id)} className="mt-1 sm:mt-0 accent-wine-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{label}</div>
                          <div className="text-stone/45 text-xs mt-0.5">{desc}</div>
                        </div>
                        {badge && (
                          <span className="text-[0.6rem] tracking-wide text-wine-600 border border-wine-200 px-2 py-0.5 flex-shrink-0">{badge}</span>
                        )}
                      </label>
                    ))}
                  </div>

                  {payment === 'card' && (
                    <div className="space-y-4 mb-8 p-5 bg-stone/[0.02] border border-stone/10">
                      <CField label="Card Number">
                        <input className="input-luxury font-mono" placeholder="1234 5678 9012 3456" maxLength={19} />
                      </CField>
                      <div className="grid grid-cols-2 gap-4">
                        <CField label="Expiry"><input className="input-luxury" placeholder="MM / YY" /></CField>
                        <CField label="CVV"><input className="input-luxury" placeholder="•••" type="password" maxLength={4} /></CField>
                      </div>
                      <p className="text-xs text-stone/40">Card processing via Flutterwave — configure your API keys in .env.local</p>
                    </div>
                  )}

                  {payment === 'bank' && (
                    <div className="p-5 bg-stone/[0.02] border border-stone/10 mb-8 space-y-2 text-sm text-stone/60">
                      <div><strong className="text-stone">Bank:</strong> Equity Bank</div>
                      <div><strong className="text-stone">Account:</strong> 0123456789</div>
                      <div><strong className="text-stone">Branch:</strong> Eldoret</div>
                      <p className="text-xs text-stone/40 mt-3">Your order reference will be shown after placing the order. Use it as the transfer reference.</p>
                    </div>
                  )}

                  <button onClick={placeOrder} className="btn-primary w-full justify-center shadow-[0_8px_24px_rgba(176,40,55,0.3)]">
                    Complete Order · {formatKES(orderTotal)}
                  </button>
                  <p className="text-center text-[0.68rem] text-stone/35 mt-4">🔒 Encrypted and secure</p>
                </div>
                <OrderSummary items={items} subtotal={subtotal} shipping={shipping} total={orderTotal} />
              </div>
            </motion.div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-20">
              <Loader2 size={48} className="text-wine-600 animate-spin mb-8" strokeWidth={1.5} />
              <h2 className="font-display text-3xl mb-3">Placing your order…</h2>
              <p className="text-stone/45 text-sm">Please wait — do not close this page.</p>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={T} className="max-w-[500px] mx-auto text-center py-16">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 bg-wine-600 flex items-center justify-center mx-auto mb-8">
                <Check size={32} strokeWidth={2.5} className="text-white" />
              </motion.div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] mb-4">Order Placed.</h2>

              {mpesaMsg && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-5 py-4 mb-6 text-left leading-relaxed">
                  {mpesaMsg}
                </div>
              )}

              {payment === 'bank' && (
                <div className="bg-stone/[0.04] border border-stone/10 text-sm px-5 py-4 mb-6 text-left leading-relaxed text-stone/60">
                  Transfer <strong className="text-stone">{formatKES(orderTotal)}</strong> to Equity Bank account 0123456789.
                  Use order reference <strong className="text-stone font-mono">{orderRef}</strong> as the transfer description.
                </div>
              )}

              <div className="bg-stone/[0.03] border border-stone/10 px-8 py-5 inline-block mb-6">
                <div className="text-[0.6rem] tracking-[0.2em] uppercase text-stone/35 mb-1">Order Reference</div>
                <div className="font-display text-2xl font-mono">{orderRef}</div>
              </div>
              <p className="text-sm text-stone/45 mb-10 leading-relaxed">
                A confirmation has been sent to <strong className="text-stone">{form.email}</strong>.<br />
                We will also send WhatsApp updates to {form.phone}.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/shop" className="btn-primary">Continue Shopping</Link>
                <Link href={`/orders/${orderRef}`} className="btn-outline">Track Order</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────── */
function OrderSummary({ items, subtotal, shipping, total }: {
  items: any[]; subtotal: number; shipping: number; total: number;
}) {
  return (
    <div className="bg-stone/[0.025] border border-stone/10 p-7 sticky top-28 self-start">
      <h3 className="font-display text-xl mb-6 pb-4 border-b border-stone/10">Order Summary</h3>
      <div className="space-y-4 mb-6 pb-6 border-b border-stone/10">
        {items.map(item => (
          <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
            <div className="w-11 h-14 bg-white flex items-center justify-center flex-shrink-0">
              <BottleSVG color1={item.color1} color2={item.color2}
                id={`co-${item.productId}`} className="h-10 w-auto" showLabel={false} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-stone/40">{item.size} · Qty {item.quantity}</div>
            </div>
            <div className="font-display text-sm flex-shrink-0">{formatKES(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm mb-5">
        <div className="flex justify-between"><span className="text-stone/50">Subtotal</span><span>{formatKES(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-stone/50">Delivery</span><span>{shipping === 0 ? 'Free' : formatKES(shipping)}</span></div>
      </div>
      <div className="flex justify-between font-display text-lg pt-4 border-t border-stone/10">
        <span>Total</span><span>{formatKES(total)}</span>
      </div>
    </div>
  );
}

function CField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-stone/40 mb-2 font-medium">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      {message}
    </motion.div>
  );
}
