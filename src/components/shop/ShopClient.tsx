'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Search, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { QuickViewModal } from '@/components/shop/QuickViewModal';
import { cn } from '@/lib/utils';
import type { IProduct } from '@/types';

const CATS = [
  { id: '',            label: 'All Fragrances' },
  { id: 'women',       label: 'Women' },
  { id: 'men',         label: 'Men' },
  { id: 'arabian-oud', label: 'Arabian & Oud' },
  { id: 'unisex',      label: 'Unisex' },
  { id: 'gift-sets',   label: 'Gift Sets' },
];

const SORTS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'featured',   label: 'Featured' },
  { value: 'price-low',  label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
  { value: 'name',       label: 'Name A–Z' },
];

const EDITORIAL_PANELS = [
  {
    at: 4,
    node: (
      <div className="bg-stone h-full min-h-[300px] flex flex-col justify-end p-8">
        <div className="text-[0.58rem] tracking-[0.3em] uppercase text-wine-300 mb-4">The Floresco Promise</div>
        <h3 className="font-display text-2xl lg:text-3xl text-white leading-snug mb-4">
          100% Authentic.<br />Every single bottle.
        </h3>
        <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
          Every fragrance traceable to its origin. Our personal guarantee, every time.
        </p>
        <a href="/about"
          className="text-[0.68rem] tracking-[0.2em] uppercase text-wine-300 border-b border-wine-300 pb-0.5 self-start hover:opacity-70 transition-opacity">
          Our Promise →
        </a>
      </div>
    ),
  },
  {
    at: 9,
    node: (
      <div className="relative h-full min-h-[300px] flex flex-col justify-end p-8 overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#F5EDE6 0%,#E8D5BC 100%)' }}>
        <div className="text-[0.58rem] tracking-[0.3em] uppercase text-wine-600 mb-4">Eldoret · Kenya</div>
        <h3 className="font-display text-2xl lg:text-3xl text-stone leading-snug mb-4">
          Born here.<br />Worn everywhere.
        </h3>
        <a href="/contact"
          className="text-[0.68rem] tracking-[0.2em] uppercase text-wine-600 border-b border-wine-500 pb-0.5 self-start hover:opacity-70 transition-opacity">
          Visit the Shop →
        </a>
      </div>
    ),
  },
];

export function ShopClient({ initialCat = '', initialQ = '' }: { initialCat?: string; initialQ?: string }) {
  const [products,  setProducts]  = useState<IProduct[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [cat,       setCat]       = useState(initialCat);
  const [sort,      setSort]      = useState('newest');
  const [query,     setQuery]     = useState(initialQ);
  const [drawer,    setDrawer]    = useState(false);
  const [sortOpen,  setSortOpen]  = useState(false);
  const [quickView, setQuickView] = useState<IProduct | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (cat)   params.set('category', cat);
      if (query) params.set('q', query);
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, [cat, query]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* Client-side sort (data already filtered by server) */
  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === 'price-low')  list.sort((a, b) => a.sizes[0].price - b.sizes[0].price);
    if (sort === 'price-high') list.sort((a, b) => b.sizes[0].price - a.sizes[0].price);
    if (sort === 'name')       list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'featured')   list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [products, sort]);

  /* Inject editorial panels */
  type GridItem = { type: 'product'; p: IProduct } | { type: 'panel'; node: React.ReactNode; key: string };
  const gridItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = sorted.map(p => ({ type: 'product', p }));
    EDITORIAL_PANELS.forEach(panel => {
      const pos = Math.min(panel.at, items.length);
      items.splice(pos, 0, { type: 'panel', node: panel.node, key: `panel-${panel.at}` });
    });
    return items;
  }, [sorted]);

  function clearAll() { setCat(''); setQuery(''); setSort('newest'); }

  return (
    <>
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />

      {/* Page header */}
      <div className="border-b border-stone/8 bg-white">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-12 pt-14 pb-8">
          <div className="eyebrow mb-4">Explore</div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h1 className="font-display text-[clamp(2.5rem,5.5vw,5rem)]">The Collection</h1>
            <p className="text-stone/45 text-sm max-w-xs leading-relaxed">
              Every bottle sourced, verified and guaranteed authentic.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex gap-0 mt-10 overflow-x-auto scrollbar-none border-b border-stone/8">
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={cn(
                  'flex-shrink-0 pb-4 pr-7 text-[0.82rem] font-medium border-b-2 -mb-px transition-all duration-200',
                  cat === c.id
                    ? 'border-wine-600 text-wine-600'
                    : 'border-transparent text-stone/45 hover:text-stone'
                )}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 lg:top-[4.5rem] z-20 bg-white/95 backdrop-blur-md border-b border-stone/8">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-12 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)}
              className="flex items-center gap-2 text-[0.72rem] tracking-[0.16em] uppercase font-medium text-stone/60 hover:text-stone transition-colors">
              <SlidersHorizontal size={13} />
              Filter
            </button>
            {query && (
              <button onClick={() => setQuery('')}
                className="flex items-center gap-1 text-xs bg-wine-50 text-wine-600 border border-wine-200 px-2.5 py-1 hover:bg-wine-100 transition-colors">
                &quot;{query}&quot; <X size={10} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[0.72rem] text-stone/40 hidden sm:block">
              {loading ? '…' : `${sorted.length} ${sorted.length === 1 ? 'fragrance' : 'fragrances'}`}
            </span>
            {/* Sort */}
            <div className="relative">
              <button onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 text-[0.72rem] tracking-[0.14em] uppercase font-medium text-stone/60 hover:text-stone transition-colors">
                {SORTS.find(s => s.value === sort)?.label}
                <ChevronDown size={12} className={cn('transition-transform', sortOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full right-0 mt-2 bg-white border border-stone/10 shadow-xl w-52 py-2 z-30">
                    {SORTS.map(s => (
                      <button key={s.value} onClick={() => { setSort(s.value); setSortOpen(false); }}
                        className={cn('w-full text-left px-4 py-2.5 text-sm hover:bg-stone/[0.03] transition-colors',
                          sort === s.value && 'text-wine-600 font-medium')}>
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-5 lg:px-12 py-10">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-stone/[0.04] animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <Sparkles size={40} strokeWidth={1} className="mx-auto text-stone/20 mb-5" />
            <h3 className="font-display text-2xl mb-3">No fragrances found</h3>
            <p className="text-stone/45 mb-8 text-sm">Try different filters or browse the full collection.</p>
            <button onClick={clearAll} className="btn-primary">Clear All Filters</button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${cat}-${sort}-${query}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {gridItems.map((item, i) =>
                item.type === 'product' ? (
                  <ProductCard key={item.p._id} product={item.p} index={i} inView onQuickView={setQuickView} />
                ) : (
                  <motion.div key={item.key}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: (i % 3) * 0.07 }}>
                    {item.node}
                  </motion.div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Mobile search drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone/40 z-50 lg:hidden" onClick={() => setDrawer(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-white lg:hidden p-6 overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <span className="font-display text-xl">Refine</span>
                <button onClick={() => setDrawer(false)} className="p-2 text-stone/40 hover:text-stone">
                  <X size={18} />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-[0.62rem] tracking-[0.22em] uppercase text-stone/40 mb-3 font-medium">Search</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/35" />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Scent, note, brand…"
                    className="w-full border border-stone/15 text-stone text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-wine-500 transition-colors" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[0.62rem] tracking-[0.22em] uppercase text-stone/40 mb-3 font-medium">Category</label>
                <div className="space-y-2">
                  {CATS.map(c => (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      className={cn('w-full text-left py-2.5 text-sm border-b border-stone/6 last:border-0 transition-colors',
                        cat === c.id ? 'text-wine-600 font-medium' : 'text-stone/65 hover:text-stone')}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setDrawer(false); }} className="btn-primary w-full justify-center">
                Show {sorted.length} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {sortOpen && <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />}
    </>
  );
}
