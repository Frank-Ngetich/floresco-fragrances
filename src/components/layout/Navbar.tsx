'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, User, Heart, Menu, X,
  ChevronRight, Sparkles, Star, ArrowRight
} from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { cn } from '@/lib/utils';

const COLLECTIONS = [
  { href:'/shop?cat=women',        label:'Women',          desc:'Radiant & Feminine',       color:'#C77B95' },
  { href:'/shop?cat=men',          label:'Men',            desc:'Refined & Structured',     color:'#4A4B58' },
  { href:'/shop?cat=arabian-oud',  label:'Arabian & Oud',  desc:'Ancient Craft, New Depth', color:'#8B6038' },
  { href:'/shop?cat=unisex',       label:'Unisex',         desc:'Universal & Singular',     color:'#B08D3C' },
  { href:'/shop?cat=gift-sets',    label:'Gift Sets',      desc:'The Art of Giving',        color:'#B02837' },
];

const FEATURED_QUICK = [
  { href:'/product/velvet-oud-intense',   name:'Velvet Oud Intense',  price:'KES 8,500',  badge:'Bestseller' },
  { href:'/product/bloom-de-nuit',        name:'Bloom de Nuit',       price:'KES 12,800', badge:'New' },
  { href:'/product/rose-damascena',       name:'Rose Damascena',      price:'KES 7,200',  badge:'' },
];

export function Navbar() {
  const pathname  = usePathname();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [shopHover,   setShopHover]   = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLink,  setActiveLink]  = useState('');
  const shopRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const count      = useCart(s => s.count());
  const setOpen    = useCart(s => s.setOpen);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setActiveLink(pathname);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else            document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setShopHover(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleShopEnter() {
    clearTimeout(hoverTimer.current);
    setShopHover(true);
  }
  function handleShopLeave() {
    hoverTimer.current = setTimeout(() => setShopHover(false), 200);
  }

  const isHome = pathname === '/';

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-stone text-cream-100 overflow-hidden relative">
        <div className="flex items-center justify-center py-2.5 px-4">
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 6, repeat: Infinity, times: [0, 0.45, 0.55] }}
            className="text-[0.62rem] tracking-[0.22em] uppercase text-center"
          >
            <span className="text-wine-300">✦</span>
            {' '}Complimentary same-day delivery within Eldoret{' '}
            <span className="text-wine-300">✦</span>
            {' '}Pay via M-Pesa · Card · Cash on Delivery{' '}
            <span className="text-wine-300">✦</span>
          </motion.div>
        </div>
      </div>

      {/* Main nav */}
      <header className={cn(
        'sticky top-0 z-40 transition-all duration-500',
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]'
          : 'bg-white/98'
      )}>
        <div className="max-w-[1400px] mx-auto px-5 lg:px-12">
          <div className="flex items-center h-16 lg:h-18 gap-4">

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-stone/60 hover:text-wine-600 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

            {/* Left nav — desktop */}
            <nav className="hidden lg:flex items-center gap-7 flex-1">
              <Link href="/" className={cn('nav-link', isHome && 'nav-link-active')}>Home</Link>

              {/* Shop with mega menu */}
              <div
                ref={shopRef}
                onMouseEnter={handleShopEnter}
                onMouseLeave={handleShopLeave}
                className="relative"
              >
                <button className={cn(
                  'nav-link flex items-center gap-1',
                  (activeLink.startsWith('/shop') || activeLink.startsWith('/product')) && 'nav-link-active'
                )}>
                  Shop
                  <motion.span animate={{ rotate: shopHover ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={11} className="rotate-90" />
                  </motion.span>
                </button>
              </div>

              <Link href="/about"   className={cn('nav-link', activeLink === '/about'   && 'nav-link-active')}>Story</Link>
              <Link href="/blog"    className={cn('nav-link', activeLink === '/blog'    && 'nav-link-active')}>Journal</Link>
              <Link href="/contact" className={cn('nav-link', activeLink === '/contact' && 'nav-link-active')}>Visit</Link>
            </nav>

            {/* Logo — centered */}
            <Link
              href="/"
              className="flex-1 lg:flex-none text-center lg:absolute lg:left-1/2 lg:-translate-x-1/2"
            >
              <span className="font-display text-[1.5rem] lg:text-[1.65rem] tracking-[0.3em] font-normal text-stone pl-[0.3em]">
                FLORES<span className="text-wine-600">CO</span>
              </span>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 lg:gap-1 flex-1 justify-end">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-stone/60 hover:text-wine-600 transition-colors"
                aria-label="Search"
              >
                <Search size={19} strokeWidth={1.5} />
              </button>

              {/* Account */}
              <Link href="/account" className="hidden sm:flex p-2.5 text-stone/60 hover:text-wine-600 transition-colors" aria-label="Account">
                <User size={19} strokeWidth={1.5} />
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="hidden md:flex p-2.5 text-stone/60 hover:text-wine-600 transition-colors" aria-label="Wishlist">
                <Heart size={19} strokeWidth={1.5} />
              </Link>

              {/* Cart */}
              <button
                onClick={() => setOpen(true)}
                className="relative p-2.5 text-stone/60 hover:text-wine-600 transition-colors"
                aria-label={`Cart (${count} items)`}
              >
                <ShoppingBag size={19} strokeWidth={1.5} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 bg-wine-600 text-white text-[0.58rem] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold leading-none px-0.5"
                    >
                      {count > 9 ? '9+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mega menu ── */}
        <AnimatePresence>
          {shopHover && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={handleShopEnter}
              onMouseLeave={handleShopLeave}
              className="absolute top-full left-0 right-0 bg-white border-b border-stone/8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-50"
            >
              <div className="max-w-[1400px] mx-auto px-12 py-10 grid grid-cols-[1fr_320px] gap-12">
                {/* Collections */}
                <div>
                  <div className="text-[0.6rem] tracking-[0.3em] uppercase text-stone/40 mb-6 font-medium">Collections</div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {COLLECTIONS.map(col => (
                      <Link
                        key={col.href}
                        href={col.href}
                        onClick={() => setShopHover(false)}
                        className="group flex items-center gap-4 p-4 hover:bg-stone/[0.03] rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: col.color }}>
                          {col.label.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-stone group-hover:text-wine-600 transition-colors">{col.label}</div>
                          <div className="text-xs text-stone/45 mt-0.5">{col.desc}</div>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href="/shop"
                      onClick={() => setShopHover(false)}
                      className="group flex items-center gap-4 p-4 hover:bg-wine-50 rounded-lg transition-colors border border-wine-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-wine-600 flex-shrink-0 flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-wine-700">All Fragrances</div>
                        <div className="text-xs text-stone/45 mt-0.5">Browse 12+ scents</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Featured */}
                <div>
                  <div className="text-[0.6rem] tracking-[0.3em] uppercase text-stone/40 mb-6 font-medium">Featured Right Now</div>
                  <div className="space-y-3">
                    {FEATURED_QUICK.map(p => (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={() => setShopHover(false)}
                        className="group flex items-center justify-between py-3 border-b border-stone/8 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-medium group-hover:text-wine-600 transition-colors">{p.name}</div>
                          <div className="text-xs text-stone/45 mt-0.5">{p.price}</div>
                        </div>
                        {p.badge && (
                          <span className="text-[0.58rem] tracking-[0.16em] uppercase text-wine-600 border border-wine-200 px-2 py-0.5">{p.badge}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link href="/shop" onClick={() => setShopHover(false)}
                    className="mt-5 flex items-center gap-2 text-[0.7rem] tracking-[0.18em] uppercase font-medium text-wine-600 hover:text-wine-800 transition-colors">
                    View full collection <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone/50 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
            onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-[640px] shadow-2xl"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-stone/10">
                <Search size={18} className="text-stone/40 flex-shrink-0" strokeWidth={1.5} />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/shop?q=${encodeURIComponent(searchQuery)}`;
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search fragrances, brands, notes…"
                  className="flex-1 text-lg text-stone outline-none placeholder:text-stone/35 font-serif"
                />
                <button onClick={() => setSearchOpen(false)} className="text-stone/40 hover:text-stone transition-colors">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Quick links */}
              <div className="p-5">
                <div className="text-[0.6rem] tracking-[0.26em] uppercase text-stone/35 mb-4">Popular searches</div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {['Oud','Rose','Amber','Woody','Fresh','Citrus','Gift Sets'].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        window.location.href = `/shop?q=${encodeURIComponent(term)}`;
                        setSearchOpen(false);
                      }}
                      className="text-xs tracking-wide border border-stone/15 text-stone/60 px-3 py-1.5 hover:border-wine-400 hover:text-wine-600 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <div className="text-[0.6rem] tracking-[0.26em] uppercase text-stone/35 mb-4">Collections</div>
                <div className="grid grid-cols-2 gap-2">
                  {COLLECTIONS.slice(0,4).map(col => (
                    <Link
                      key={col.href}
                      href={col.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 p-3 hover:bg-stone/[0.03] transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: col.color }} />
                      <span className="text-sm text-stone/70 group-hover:text-wine-600 transition-colors">{col.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 bg-stone/[0.02] border-t border-stone/8 text-center">
                <span className="text-[0.65rem] text-stone/30 tracking-wide">Press Enter to search · Esc to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone/50 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-white flex flex-col shadow-2xl lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone/8">
                <span className="font-display text-xl tracking-[0.3em]">FLORES<span className="text-wine-600">CO</span></span>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-stone/40 hover:text-stone transition-colors">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Drawer nav */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-1">
                  <MobileNavSection label="Shop">
                    {COLLECTIONS.map(col => (
                      <Link key={col.href} href={col.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 py-3 border-b border-stone/6 group">
                        <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: col.color }} />
                        <span className="text-sm text-stone/70 group-hover:text-wine-600 transition-colors">{col.label}</span>
                      </Link>
                    ))}
                  </MobileNavSection>

                  {[
                    { href:'/',        label:'Home' },
                    { href:'/shop',    label:'All Fragrances' },
                    { href:'/about',   label:'Our Story' },
                    { href:'/blog',    label:'The Journal' },
                    { href:'/contact', label:'Visit the Shop' },
                    { href:'/account', label:'My Account' },
                  ].map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between py-4 border-b border-stone/6 font-display text-xl hover:text-wine-600 transition-colors">
                      {l.label}
                      <ChevronRight size={16} className="text-stone/25" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Drawer footer */}
              <div className="px-6 py-6 bg-stone/[0.02] border-t border-stone/8">
                <div className="text-[0.65rem] tracking-[0.22em] uppercase text-stone/40 mb-2">Visit us</div>
                <div className="text-sm text-stone/60 leading-relaxed">
                  Kapsoya Business Park<br />Eldoret, Kenya<br />
                  <a href="tel:+254700000000" className="text-wine-600 hover:text-wine-800 transition-colors">+254 7XX XXX XXX</a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNavSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 border-b border-stone/6 font-display text-xl hover:text-wine-600 transition-colors">
        {label}
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-stone/25" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
