'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, Check, Clock, AlertCircle, Search } from 'lucide-react';
import { formatKES } from '@/lib/utils';

const T = { ease: [0.16, 1, 0.3, 1] as const };

const STATUS_STEPS = [
  { key: 'pending',   label: 'Order Placed',       icon: Clock },
  { key: 'confirmed', label: 'Payment Confirmed',  icon: Check },
  { key: 'packed',    label: 'Being Prepared',     icon: Package },
  { key: 'shipped',   label: 'Out for Delivery',   icon: Truck },
  { key: 'delivered', label: 'Delivered',          icon: Check },
];

const STATUS_ORDER = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

interface OrderData {
  orderNumber: string;
  status: string;
  createdAt: string;
  customer: { name: string; email: string; phone: string };
  items: { name: string; brand: string; size: string; quantity: number; price: number }[];
  delivery: { method: string; fee: number; address?: { street: string; city: string; county: string } };
  payment: { method: string; status: string; amount: number };
  subtotal: number;
  total: number;
  statusHistory: { status: string; updatedAt: string; note?: string }[];
  trackingNumber?: string;
}

export default function OrderTrackingPage({ params }: { params: { orderNumber: string } }) {
  const [order,    setOrder]    = useState<OrderData | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [verified, setVerified] = useState(false);
  const [email,    setEmail]    = useState('');

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(
        `/api/orders/lookup?orderNumber=${params.orderNumber}&email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Order not found. Check your order number and email.');
      } else {
        setOrder(data);
        setVerified(true);
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  const stepIdx = order ? STATUS_ORDER.indexOf(order.status) : -1;

  return (
    <div className="page-enter max-w-[720px] mx-auto px-6 py-16">
      <Link href="/account"
        className="inline-flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase text-stone/40 hover:text-wine-600 transition-colors mb-12">
        <ArrowLeft size={13} /> My Account
      </Link>

      <div className="eyebrow mb-4">Order Status</div>
      <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mb-2">{params.orderNumber}</h1>

      {/* Email verification gate */}
      {!verified && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, duration: 0.6 }}
          className="mt-10 border border-stone/10 p-8">
          <p className="text-stone/55 mb-8 text-sm leading-relaxed">
            To protect your privacy, please confirm the email address used when placing this order.
          </p>
          <form onSubmit={verify} className="space-y-4">
            <div>
              <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Email Address *</label>
              <input
                type="email" required value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                className="input-luxury" placeholder="you@example.com" />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking…</>
              ) : (
                <><Search size={14} /> View Order Status</>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* Order detail */}
      <AnimatePresence>
        {verified && order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...T, duration: 0.7 }} className="mt-10 space-y-8">

            {/* Status progress */}
            <div className="border border-stone/10 p-7">
              <div className="text-[0.62rem] tracking-[0.2em] uppercase text-stone/35 mb-6">Delivery Progress</div>
              <div className="space-y-5">
                {STATUS_STEPS.map((s, i) => {
                  const done    = i <= stepIdx;
                  const current = i === stepIdx;
                  return (
                    <div key={s.key} className={`flex items-center gap-4 ${!done ? 'opacity-30' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                        ${current ? 'bg-wine-600 text-white shadow-[0_4px_12px_rgba(176,40,55,0.35)]'
                        : done    ? 'bg-stone text-white'
                                  : 'border-2 border-stone/20 text-stone/30'}`}>
                        <s.icon size={14} strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${current ? 'text-wine-700' : done ? 'text-stone' : 'text-stone/40'}`}>
                          {s.label}
                        </div>
                        {/* Show timestamp from statusHistory */}
                        {done && order.statusHistory && (() => {
                          const hist = order.statusHistory.find(h => h.status === s.key);
                          if (!hist) return null;
                          return (
                            <div className="text-xs text-stone/35 mt-0.5">
                              {new Date(hist.updatedAt).toLocaleString('en-KE', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                              {hist.note && <span className="ml-2 text-stone/50">· {hist.note}</span>}
                            </div>
                          );
                        })()}
                      </div>
                      {current && (
                        <span className="text-[0.6rem] tracking-[0.18em] uppercase text-wine-600 border border-wine-200 bg-wine-50 px-2.5 py-1 flex-shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {order.trackingNumber && (
                <div className="mt-6 pt-6 border-t border-stone/8 text-sm">
                  <span className="text-stone/40">Tracking number: </span>
                  <span className="font-mono text-stone font-medium">{order.trackingNumber}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border border-stone/10 p-7">
              <div className="text-[0.62rem] tracking-[0.2em] uppercase text-stone/35 mb-5">Items Ordered</div>
              <div className="space-y-4 mb-5 pb-5 border-b border-stone/8">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-stone/40 mt-0.5">{item.brand} · {item.size} · Qty {item.quantity}</div>
                    </div>
                    <div className="font-display text-sm flex-shrink-0">{formatKES(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-stone/50">
                  <span>Subtotal</span><span>{formatKES(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone/50">
                  <span>Delivery</span>
                  <span>{order.delivery.fee === 0 ? 'Free' : formatKES(order.delivery.fee)}</span>
                </div>
                <div className="flex justify-between font-display text-base pt-2 border-t border-stone/8 mt-2">
                  <span>Total</span><span>{formatKES(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div className="border border-stone/10 p-7">
              <div className="text-[0.62rem] tracking-[0.2em] uppercase text-stone/35 mb-5">Delivery Details</div>
              <div className="text-sm space-y-2 text-stone/65">
                <div>
                  <span className="text-stone/35 text-xs uppercase tracking-wide">Method </span>
                  {order.delivery.method === 'pickup' ? 'Pickup · Kapsoya Business Park, Eldoret' : 'Courier delivery'}
                </div>
                {order.delivery.address && (
                  <div>
                    <span className="text-stone/35 text-xs uppercase tracking-wide">Address </span>
                    {order.delivery.address.street}, {order.delivery.address.city}, {order.delivery.address.county}
                  </div>
                )}
                <div>
                  <span className="text-stone/35 text-xs uppercase tracking-wide">Payment </span>
                  <span className="capitalize">{order.payment.method}</span>
                  {' · '}
                  <span className={order.payment.status === 'paid' ? 'text-green-700' : 'text-amber-700'}>
                    {order.payment.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="text-center text-sm text-stone/45">
              Need help with this order?{' '}
              <Link href="/contact" className="text-wine-600 hover:opacity-70 transition-opacity">Contact us</Link>
              {' '}or WhatsApp us directly.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
