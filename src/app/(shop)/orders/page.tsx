'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle } from 'lucide-react';

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim().toUpperCase();
    if (!trimmed) { setError('Please enter your order number.'); return; }
    router.push(`/orders/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="page-enter max-w-[560px] mx-auto px-6 py-20">
      <div className="eyebrow mb-4">Order Status</div>
      <h1 className="font-display text-[clamp(2rem,4vw,3rem)] mb-3">Track Your Order</h1>
      <p className="text-stone/50 text-sm mb-10 leading-relaxed">
        Enter the order number from your confirmation email — you&apos;ll be asked to confirm your email address next.
      </p>
      <form onSubmit={submit} className="border border-stone/10 p-8 space-y-4">
        <div>
          <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Order Number *</label>
          <input
            value={orderNumber}
            onChange={e => { setOrderNumber(e.target.value); setError(''); }}
            className="input-luxury font-mono" placeholder="FL-260101-A1B2" />
        </div>
        {error && (
          <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary w-full justify-center">
          <Search size={14} /> Find My Order
        </button>
      </form>
    </div>
  );
}
