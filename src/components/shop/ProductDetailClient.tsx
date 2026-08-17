'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Share2, ChevronDown, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductCard } from './ProductCard';
import { useCart } from '@/lib/cart-store';
import { formatKES, cn } from '@/lib/utils';
import type { IProduct } from '@/types';

interface Props { product: IProduct; related: IProduct[] }

export function ProductDetailClient({ product, related }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity,     setQuantity]     = useState(1);
  const [activeTab,    setActiveTab]    = useState('desc');
  const [wishlist,     setWishlist]     = useState(false);
  const [adding,       setAdding]       = useState(false);
  const [activeImage,  setActiveImage]  = useState(() => {
    const primaryIdx = product.images?.findIndex((i) => i.isPrimary);
    return primaryIdx && primaryIdx > -1 ? primaryIdx : 0;
  });
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  async function handleAddToCart() {
    setAdding(true);
    addItem({
      productId: product._id,
      slug:      product.slug,
      name:      product.name,
      brand:     product.brand,
      size:      selectedSize.size,
      price:     selectedSize.price,
      quantity,
      image:     product.images[0]?.url || '',
      color1:    product.color1,
      color2:    product.color2,
    });
    await new Promise((r) => setTimeout(r, 500));
    setAdding(false);
    setOpen(true);
  }

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-5">
        <nav className="text-[0.65rem] tracking-[0.16em] uppercase text-cream-600 flex items-center gap-2">
          <Link href="/" className="hover:text-burgundy-700 transition-colors">Home</Link>
          <span className="opacity-40">/</span>
          <Link href="/shop" className="hover:text-burgundy-700 transition-colors">Shop</Link>
          <span className="opacity-40">/</span>
          <Link href={`/shop?cat=${product.category}`} className="hover:text-burgundy-700 transition-colors capitalize">
            {product.category.replace('-', ' & ')}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-stone">{product.name}</span>
        </nav>
      </div>

      {/* PDP */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-24">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-16">
          {/* Left: Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-cream-100 aspect-[4/5] flex items-center justify-center mb-4 overflow-hidden group"
            >
              <ProductImage
                src={product.images?.[activeImage]?.url}
                alt={product.images?.[activeImage]?.alt || product.name}
                color1={product.color1}
                color2={product.color2}
                brandName={product.brand}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {product.badge && (
                <span className="absolute top-6 left-6 bg-stone text-cream-100 text-[0.6rem] tracking-[0.18em] uppercase px-3 py-1.5">
                  {product.badge}
                </span>
              )}
            </motion.div>

            {/* Thumbnail row */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn('relative aspect-square bg-cream-200 flex items-center justify-center cursor-pointer border-2 transition-colors overflow-hidden', i === activeImage ? 'border-burgundy-700' : 'border-transparent hover:border-cream-500')}
                  >
                    <ProductImage
                      src={img.url}
                      alt={img.alt || `${product.name} ${i + 1}`}
                      color1={product.color1}
                      color2={product.color2}
                      fill
                      sizes="120px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <div className="eyebrow mb-3">{product.brand}</div>
            <h1 className="font-display text-[clamp(2rem,3.5vw,3rem)] mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < Math.floor(product.rating) ? 'fill-burgundy-600 text-burgundy-600' : 'text-cream-400'}
                    strokeWidth={1}
                  />
                ))}
              </div>
              <span className="text-sm text-stone/55">{product.rating} · {product.reviewCount} reviews</span>
            </div>

            <p className="font-serif text-xl italic text-stone/65 mb-6 leading-relaxed">{product.tagline}</p>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-display text-3xl">{formatKES(selectedSize.price)}</span>
              <span className="text-sm text-stone/40">{selectedSize.size} Eau de Parfum</span>
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <h5 className="text-[0.68rem] tracking-[0.2em] uppercase font-medium mb-3">Size</h5>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size.size}
                    onClick={() => setSelectedSize(size)}
                    disabled={size.stock === 0}
                    className={cn(
                      'border px-4 py-3 text-sm transition-all duration-200 min-w-[90px] text-center',
                      selectedSize.size === size.size
                        ? 'border-burgundy-700 bg-burgundy-50 text-burgundy-700'
                        : size.stock === 0
                          ? 'border-cream-400 text-cream-500 line-through cursor-not-allowed'
                          : 'border-[rgb(var(--border-strong))] hover:border-stone'
                    )}
                  >
                    <div className="font-medium">{size.size}</div>
                    <div className="text-[0.75rem] mt-0.5 opacity-70">{formatKES(size.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-5 mb-8">
              <h5 className="text-[0.68rem] tracking-[0.2em] uppercase font-medium">Qty</h5>
              <div className="flex items-center border border-[rgb(var(--border-strong))]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-stone/60 hover:text-stone hover:bg-cream-200 transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center text-stone/60 hover:text-stone hover:bg-cream-200 transition-colors text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-primary flex-1 justify-center py-4 disabled:opacity-70"
              >
                <ShoppingBag size={15} strokeWidth={1.5} />
                {adding ? 'Added ✓' : `Add to Bag — ${formatKES(selectedSize.price * quantity)}`}
              </button>
              <button
                onClick={() => setWishlist(!wishlist)}
                className={cn('w-14 border flex items-center justify-center transition-all duration-200', wishlist ? 'border-burgundy-700 bg-burgundy-50 text-burgundy-700' : 'border-[rgb(var(--border-strong))] hover:border-stone')}
                aria-label="Wishlist"
              >
                <Heart size={16} strokeWidth={1.5} className={wishlist ? 'fill-burgundy-700' : ''} />
              </button>
              <button className="w-14 border border-[rgb(var(--border-strong))] hover:border-stone flex items-center justify-center transition-colors" aria-label="Share">
                <Share2 size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Trust row */}
            <div className="grid grid-cols-2 gap-4 p-5 bg-cream-100 mb-8">
              {[
                { icon: Shield, label: '100% Authentic', sub: 'Guaranteed original' },
                { icon: Truck, label: 'Free delivery', sub: 'On orders over KES 10,000' },
                { icon: RefreshCw, label: 'Easy returns', sub: 'Unopened within 7 days' },
                { icon: Star, label: 'Gift wrap', sub: 'Complimentary' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={15} strokeWidth={1.5} className="text-burgundy-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-[0.72rem] text-stone/50">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-t border-[rgb(var(--border))]">
              <div className="flex gap-8 border-b border-[rgb(var(--border))] mb-6">
                {[
                  { id: 'desc', label: 'Description' },
                  { id: 'notes', label: 'Fragrance Notes' },
                  { id: 'ship', label: 'Shipping' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'py-4 text-[0.72rem] tracking-[0.18em] uppercase font-medium border-b-2 -mb-px transition-colors',
                      activeTab === tab.id ? 'border-burgundy-700 text-burgundy-700' : 'border-transparent text-stone/50 hover:text-stone'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'desc' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <p className="text-stone/75 leading-relaxed">{product.description}</p>
                  <p className="text-stone/55 text-sm leading-relaxed">Presented in a hand-finished flacon with weighted cap. Comes in signature Floresco gift packaging.</p>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Top Notes', notes: product.scentNotes.top },
                    { label: 'Heart Notes', notes: product.scentNotes.heart },
                    { label: 'Base Notes', notes: product.scentNotes.base },
                  ].map(({ label, notes }) => (
                    <div key={label}>
                      <div className="eyebrow mb-3">{label}</div>
                      <p className="font-serif italic text-stone/70 leading-relaxed text-sm">{notes.join(', ')}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'ship' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-sm text-stone/70 leading-relaxed">
                  <p><strong className="text-stone font-medium">Same-day delivery</strong> in Eldoret for orders placed before 3 PM.</p>
                  <p><strong className="text-stone font-medium">Nationwide delivery</strong> in 1–3 business days via G4S, Fargo, or Sendy.</p>
                  <p><strong className="text-stone font-medium">Free delivery</strong> on orders above KES 10,000. Otherwise from KES 300.</p>
                  <p><strong className="text-stone font-medium">Free store pickup</strong> at Kapsoya Business Park, Eldoret.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24 pt-16 border-t border-[rgb(var(--border))]">
            <div className="text-center mb-12">
              <div className="eyebrow mb-3">You May Also Love</div>
              <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)]">From the same collection</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} inView />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
