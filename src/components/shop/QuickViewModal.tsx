'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, ArrowRight, Star, Check } from 'lucide-react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart } from '@/lib/cart-store';
import { formatKES, cn } from '@/lib/utils';
import type { IProduct } from '@/types';

interface Props { product: IProduct | null; onClose: () => void; }

export function QuickViewModal({ product, onClose }: Props) {
  const [selSize, setSelSize] = useState<IProduct['sizes'][0] | null>(null);
  const [adding,  setAdding]  = useState(false);
  const [loved,   setLoved]   = useState(false);
  const addItem = useCart(s => s.addItem);
  const setOpen = useCart(s => s.setOpen);
  const currentSize = selSize || product?.sizes[0];

  async function handleAdd() {
    if (!product || !currentSize) return;
    setAdding(true);
    addItem({
      productId: product._id, slug: product.slug,
      name: product.name, brand: product.brand,
      size: currentSize.size, price: currentSize.price,
      quantity: 1, image: product.images?.[0]?.url || '',
      color1: product.color1, color2: product.color2,
    });
    await new Promise(r => setTimeout(r, 500));
    setAdding(false);
    setOpen(true);
    onClose();
  }

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-stone/50 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity:0, y:60, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:60, scale:0.97 }}
            transition={{ type:'spring', damping:28, stiffness:260 }}
            className="fixed bottom-0 left-0 right-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white w-full sm:max-w-[820px] sm:max-h-[90vh] overflow-hidden">
            <button onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur flex items-center justify-center hover:bg-stone hover:text-white transition-all">
              <X size={16} strokeWidth={1.5} />
            </button>
            <div className="grid sm:grid-cols-[1fr_1.1fr] max-h-[90vh] overflow-y-auto">
              {/* Image / placeholder */}
              <div className="relative min-h-[300px] sm:min-h-[420px]"
                style={{ background: `linear-gradient(145deg,${product.color2}22 0%,${product.color1}18 100%)` }}>
                <ProductImage
                  src={product.images?.find(i=>i.isPrimary)?.url || product.images?.[0]?.url || null}
                  alt={product.name}
                  color1={product.color1}
                  color2={product.color2}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 820px) 100vw, 410px"
                />
              </div>
              {/* Info */}
              <div className="p-7 sm:p-9 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[0.62rem] tracking-[0.22em] uppercase text-stone/45">{product.brand}</div>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={11} className="fill-gold text-gold" />
                      <span className="text-xs text-stone/55">{product.rating} ({product.reviewCount})</span>
                    </div>
                  )}
                </div>
                <h2 className="font-display text-[1.9rem] leading-tight mb-2">{product.name}</h2>
                <p className="font-serif italic text-stone/60 mb-4">{product.tagline}</p>
                <div className="font-display text-2xl text-stone mb-5">
                  {formatKES(currentSize?.price || product.sizes[0].price)}
                  <span className="font-sans text-sm text-stone/40 ml-2 font-normal">{currentSize?.size || product.sizes[0].size}</span>
                </div>
                {product.sizes.length > 1 && (
                  <div className="mb-5">
                    <div className="text-[0.65rem] tracking-[0.2em] uppercase text-stone/45 mb-3">Size</div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(sz => (
                        <button key={sz.size} onClick={() => setSelSize(sz)} disabled={sz.stock === 0}
                          className={cn('flex flex-col items-center px-4 py-2.5 border text-sm transition-all min-w-[80px]',
                            currentSize?.size === sz.size ? 'border-wine-600 bg-wine-50 text-wine-700'
                            : sz.stock === 0 ? 'border-stone/15 text-stone/25 line-through cursor-not-allowed'
                            : 'border-stone/15 hover:border-stone/40 text-stone/70')}>
                          <span className="font-medium">{sz.size}</span>
                          <span className="text-[0.65rem] mt-0.5 opacity-70">{formatKES(sz.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {product.scentNotes?.top?.length > 0 && (
                  <div className="mb-5">
                    <div className="text-[0.65rem] tracking-[0.2em] uppercase text-stone/45 mb-2">Key Notes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...product.scentNotes.top.slice(0,2),...product.scentNotes.heart.slice(0,1),...product.scentNotes.base.slice(0,1)].map(note=>(
                        <span key={note} className="text-[0.68rem] tracking-wide border border-stone/12 text-stone/60 px-2.5 py-1">{note}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 mt-auto">
                  <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary justify-center disabled:opacity-60">
                    {adding ? <><Check size={14} /> Added</> : <><ShoppingBag size={14} strokeWidth={1.5} /> Add to Bag</>}
                  </button>
                  <button onClick={() => setLoved(!loved)}
                    className={cn('w-12 border flex items-center justify-center transition-all',
                      loved ? 'border-wine-600 bg-wine-50 text-wine-600' : 'border-stone/15 hover:border-stone/35')}>
                    <Heart size={16} strokeWidth={1.5} className={loved ? 'fill-wine-600' : ''} />
                  </button>
                </div>
                <Link href={`/product/${product.slug}`} onClick={onClose}
                  className="mt-4 flex items-center justify-center gap-1.5 text-[0.68rem] tracking-[0.18em] uppercase text-stone/45 hover:text-wine-600 transition-colors">
                  Full details <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
