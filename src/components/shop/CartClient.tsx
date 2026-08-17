'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { BottleSVG } from '@/components/ui/BottleSVG';
import { formatKES } from '@/lib/utils';

export function CartClient() {
  const { items, removeItem, updateQuantity, total, setOpen } = useCart();
  const [mounted, setMounted] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(false);
  const [couponErr, setCouponErr] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const subtotal = total();
  const shipping = subtotal >= 10000 || subtotal === 0 ? 0 : 500;
  const discount = applied ? Math.round(subtotal * 0.1) : 0;
  const orderTotal = subtotal + shipping - discount;

  function applyCoupon() {
    if (coupon.toUpperCase() === 'FLORESCO10') { setApplied(true); setCouponErr(false); }
    else { setCouponErr(true); }
  }

  if (items.length === 0) {
    return (
      <div className="page-enter min-h-[70vh] flex flex-col items-center justify-center px-6 py-24 text-center">
        <ShoppingBag size={52} strokeWidth={1} className="text-stone/15 mb-8" />
        <div className="eyebrow mb-4">Your Bag</div>
        <h2 className="font-display text-3xl mb-3">Your bag is empty</h2>
        <p className="text-stone/50 mb-10 max-w-xs leading-relaxed">Discover fragrances made to tell your story.</p>
        <Link href="/shop" className="btn-primary">Shop the Collection</Link>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
      <div className="flex items-baseline justify-between mb-12 pb-6 border-b border-stone/10">
        <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)]">
          Your Bag <span className="text-stone/30 font-light text-2xl ml-3">({items.length})</span>
        </h1>
        <Link href="/shop" className="btn-link text-stone/40 hover:text-wine-600 transition-colors">Continue shopping</Link>
      </div>
      <div className="grid lg:grid-cols-[1fr_360px] gap-16">
        <div>
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 pb-4 border-b border-stone/8 text-[0.6rem] tracking-[0.2em] uppercase text-stone/35 font-medium mb-2">
            <span>Product</span><span>Price</span><span>Quantity</span><span>Total</span><span/>
          </div>
          <AnimatePresence>
            {items.map(item => (
              <motion.div key={`${item.productId}-${item.size}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-[auto_1fr] md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center py-7 border-b border-stone/8">
                <div className="col-span-2 md:col-span-1 flex items-center gap-5">
                  <div className="w-20 h-24 bg-stone/[0.04] flex items-center justify-center flex-shrink-0">
                    <BottleSVG color1={item.color1} color2={item.color2} id={`cart-${item.productId}`} className="h-16 w-auto" showLabel={false} />
                  </div>
                  <div>
                    <div className="text-[0.6rem] tracking-[0.2em] uppercase text-stone/35 mb-1">{item.brand}</div>
                    <div className="font-display text-lg leading-snug mb-1">{item.name}</div>
                    <div className="font-serif italic text-sm text-stone/45">{item.size} Eau de Parfum</div>
                  </div>
                </div>
                <div className="hidden md:block font-display">{formatKES(item.price)}</div>
                <div className="flex items-center border border-stone/15">
                  <button onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center text-stone/40 hover:text-stone hover:bg-stone/[0.04] transition-colors"><Minus size={11}/></button>
                  <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center text-stone/40 hover:text-stone hover:bg-stone/[0.04] transition-colors"><Plus size={11}/></button>
                </div>
                <div className="hidden md:block font-display">{formatKES(item.price * item.quantity)}</div>
                <button onClick={() => removeItem(item.productId, item.size)} className="text-stone/20 hover:text-wine-600 transition-colors" aria-label="Remove"><Trash2 size={15} strokeWidth={1.5}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="space-y-4">
          <div className="bg-stone/[0.025] border border-stone/10 p-7">
            <h3 className="font-display text-2xl mb-7">Order Summary</h3>
            <div className="flex gap-2 mb-6 pb-6 border-b border-stone/10">
              <div className="relative flex-1">
                <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/35"/>
                <input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponErr(false); }}
                  placeholder="Discount code" className="input-luxury pl-8 text-sm py-3" />
              </div>
              <button onClick={applyCoupon} className="btn-ghost px-5 py-3 text-xs">Apply</button>
            </div>
            {applied && <div className="text-green-700 text-xs mb-4 flex items-center gap-2"><Check size={12}/>FLORESCO10 — 10% off applied</div>}
            {couponErr && <div className="text-red-600 text-xs mb-4">Invalid code. Try FLORESCO10.</div>}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between"><span className="text-stone/50">Subtotal</span><span>{formatKES(subtotal)}</span></div>
              {applied && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatKES(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-stone/50">Delivery</span><span>{shipping === 0 ? 'Free' : formatKES(shipping)}</span></div>
              {shipping > 0 && <p className="text-[0.7rem] text-wine-600">Free delivery on orders above KES 10,000</p>}
            </div>
            <div className="flex justify-between font-display text-xl py-5 border-t border-stone/10 mb-6"><span>Total</span><span>{formatKES(orderTotal)}</span></div>
            <Link href="/checkout" className="btn-primary w-full justify-center group mb-3">
              Checkout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <div className="text-center text-[0.65rem] text-stone/35 mt-3">🔒 M-Pesa · Card · Cash on Delivery</div>
          </div>
          <div className="border border-stone/10 p-5 space-y-3">
            {[{ i:'✓', t:'100% authentic, every bottle'},{ i:'↩', t:'Returns within 7 days (unopened)'},{ i:'🎁', t:'Gift wrapping at checkout'}].map(r=>(
              <div key={r.t} className="flex items-center gap-3 text-sm text-stone/50"><span className="text-wine-600 font-bold text-xs w-4">{r.i}</span>{r.t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
