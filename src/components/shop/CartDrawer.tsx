'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { formatKES } from '@/lib/utils';
import { BottleSVG } from '@/components/ui/BottleSVG';

export function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, total } = useCart();
  const subtotal = total();
  const shipping = subtotal >= 10000 || subtotal === 0 ? 0 : 500;
  const orderTotal = subtotal + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-stone/40 z-50"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[440px] bg-[rgb(var(--cream-warm))] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} strokeWidth={1.5} className="text-burgundy-700" />
                <h2 className="font-display text-xl">Your Bag</h2>
                {items.length > 0 && (
                  <span className="text-[0.7rem] tracking-wide text-cream-600">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-stone/50 hover:text-stone transition-colors" aria-label="Close cart">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
                  <ShoppingBag size={40} strokeWidth={1} className="text-cream-500 mb-6" />
                  <h3 className="font-display text-2xl mb-3">Your bag is empty</h3>
                  <p className="text-stone/55 text-sm mb-8 leading-relaxed">Discover fragrances made to tell your story.</p>
                  <button onClick={() => setOpen(false)} className="btn-primary">
                    <Link href="/shop">Shop the Collection</Link>
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-[rgb(var(--border))]">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.size}`} className="flex gap-4 p-5">
                      {/* Image */}
                      <div className="w-16 h-20 bg-cream-200 flex items-center justify-center flex-shrink-0">
                        <BottleSVG
                          color1={item.color1}
                          color2={item.color2}
                          id={`cart-${item.productId}-${item.size}`}
                          className="h-14 w-auto"
                          showLabel={false}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.62rem] tracking-[0.18em] uppercase text-cream-700 mb-0.5">{item.brand}</div>
                        <div className="font-display text-base leading-snug mb-0.5">{item.name}</div>
                        <div className="font-serif italic text-xs text-stone/50 mb-3">{item.size} Eau de Parfum</div>

                        <div className="flex items-center justify-between">
                          {/* Qty */}
                          <div className="flex items-center border border-[rgb(var(--border-strong))]">
                            <button
                              onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone/60 hover:text-stone hover:bg-cream-200 transition-colors"
                            >
                              <Minus size={11} strokeWidth={1.5} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone/60 hover:text-stone hover:bg-cream-200 transition-colors"
                            >
                              <Plus size={11} strokeWidth={1.5} />
                            </button>
                          </div>
                          <span className="font-display text-sm">{formatKES(item.price * item.quantity)}</span>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.productId, item.size)}
                        className="text-cream-500 hover:text-burgundy-700 transition-colors self-start mt-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[rgb(var(--border))] p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-stone/65">
                    <span>Subtotal</span>
                    <span>{formatKES(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone/65">
                    <span>Delivery</span>
                    <span>{shipping === 0 ? 'Free' : formatKES(shipping)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[0.72rem] text-burgundy-600">Free delivery on orders above KES 10,000</p>
                  )}
                  <div className="flex justify-between font-display text-lg pt-2 border-t border-[rgb(var(--border))]">
                    <span>Total</span>
                    <span>{formatKES(orderTotal)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full justify-center"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full justify-center text-center"
                >
                  View Full Bag
                </Link>

                <p className="text-center text-[0.68rem] text-stone/45 tracking-wide">
                  🔒 Secure checkout · M-Pesa · Card · Cash on delivery
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
