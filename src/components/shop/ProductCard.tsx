'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, Zap } from 'lucide-react';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart } from '@/lib/cart-store';
import { formatKES, cn } from '@/lib/utils';
import type { IProduct } from '@/types';

const VISIBLE = { opacity: 1, y: 0 };
const HIDDEN  = { opacity: 0, y: 28 };

interface Props {
  product: IProduct;
  index?: number;
  inView?: boolean;
  onQuickView?: (p: IProduct) => void;
}

export function ProductCard({ product, index = 0, inView = true, onQuickView }: Props) {
  const [loved,     setLoved]     = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [selSize,   setSelSize]   = useState(product.sizes[0]);
  const [showSizes, setShowSizes] = useState(false);
  const cardRef  = useRef<HTMLDivElement>(null);
  const addItem  = useCart(s => s.addItem);
  const setOpen  = useCart(s => s.setOpen);

  /* 3D tilt */
  const x  = useMotionValue(0);
  const y  = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 140, damping: 20 });
  const sy = useSpring(y, { stiffness: 140, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-4, 4]);

  function onMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width  - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  }
  function onMouseLeave() { x.set(0); y.set(0); }

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setAdding(true);
    addItem({
      productId: product._id, slug: product.slug,
      name: product.name, brand: product.brand,
      size: selSize.size, price: selSize.price,
      quantity: 1, image: product.images?.[0]?.url || '',
      color1: product.color1, color2: product.color2,
    });
    await new Promise(r => setTimeout(r, 500));
    setAdding(false);
    setOpen(true);
  }

  const primaryImage = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || null;
  const lowestPrice  = Math.min(...product.sizes.map(s => s.price));
  const highestPrice = Math.max(...product.sizes.map(s => s.price));

  return (
    <motion.div
      initial={HIDDEN} animate={inView ? VISIBLE : HIDDEN}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: (index % 3) * 0.07 }}
      style={{ perspective: 800 }}>
      <motion.div ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        className="group relative bg-[#F8F8F6] hover:bg-[#F2F0EC] transition-colors duration-400 cursor-pointer">

        {/* Image area */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
          <Link href={`/product/${product.slug}`}>
            <div className="relative w-full h-full">
              <ProductImage
                src={primaryImage}
                alt={product.name}
                color1={product.color1}
                color2={product.color2}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
          </Link>

          {/* Badge */}
          {product.badge && (
            <div className={cn(
              'absolute top-4 left-4 text-[0.58rem] tracking-[0.18em] uppercase font-medium px-2.5 py-1 z-20',
              product.badge === 'New'        ? 'bg-stone text-white' :
              product.badge === 'Bestseller' ? 'bg-wine-600 text-white' :
                                               'bg-white text-wine-600 border border-wine-200'
            )}>
              {product.badge}
            </div>
          )}

          {/* Wishlist */}
          <button onClick={e => { e.preventDefault(); setLoved(!loved); }}
            className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-sm">
            <Heart size={15} strokeWidth={1.5}
              className={cn('transition-all', loved ? 'fill-wine-600 text-wine-600' : 'text-stone/60')} />
          </button>

          {/* Quick view */}
          <button onClick={e => { e.preventDefault(); onQuickView?.(product); }}
            className="absolute bottom-16 right-4 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-sm delay-75">
            <Eye size={15} strokeWidth={1.5} className="text-stone/60" />
          </button>

          {/* Quick add */}
          <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {showSizes ? (
              <div className="bg-white border-t border-stone/10 p-3 flex items-center gap-2 flex-wrap">
                {product.sizes.map(sz => (
                  <button key={sz.size}
                    onClick={e => { e.preventDefault(); setSelSize(sz); setShowSizes(false); handleAddToCart(e); }}
                    className="flex-1 min-w-[60px] py-2 text-xs font-medium border border-stone/15 hover:border-wine-600 hover:text-wine-600 hover:bg-wine-50 transition-all">
                    {sz.size}
                    <div className="text-[0.6rem] text-stone/40 mt-0.5">{formatKES(sz.price)}</div>
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); product.sizes.length > 1 ? setShowSizes(true) : handleAddToCart(e); }}
                disabled={adding}
                className="w-full bg-stone text-white text-[0.65rem] tracking-[0.22em] uppercase font-medium py-3.5 flex items-center justify-center gap-2 hover:bg-wine-600 transition-colors duration-200 disabled:opacity-60">
                {adding ? <><Zap size={12} className="animate-bounce" /> Added</>
                  : product.sizes.length > 1 ? <><ShoppingBag size={12} strokeWidth={1.5} /> Select Size</>
                  : <><ShoppingBag size={12} strokeWidth={1.5} /> Add to Bag</>}
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <Link href={`/product/${product.slug}`} className="block px-4 pb-4 pt-3">
          <div className="text-[0.6rem] tracking-[0.22em] uppercase text-stone/45 mb-1.5">{product.brand}</div>
          <h3 className="font-display text-[1.05rem] leading-snug mb-1.5 group-hover:text-wine-700 transition-colors">{product.name}</h3>
          <p className="font-serif italic text-[0.8rem] text-stone/50 mb-3 line-clamp-1">{product.tagline}</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-[1rem] text-stone">
                {lowestPrice === highestPrice ? formatKES(lowestPrice) : `${formatKES(lowestPrice)} – ${formatKES(highestPrice)}`}
              </div>
              {product.sizes.length > 1 && <div className="text-[0.62rem] text-stone/35 mt-0.5">{product.sizes.length} sizes</div>}
            </div>
            {product.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={11} className="fill-gold text-gold" />
                <span className="text-[0.7rem] text-stone/50 font-medium">{product.rating}</span>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
