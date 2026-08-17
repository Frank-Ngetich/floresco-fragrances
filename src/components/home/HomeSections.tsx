'use client';
import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import NextImage from 'next/image';
import { BottleSVG } from '@/components/ui/BottleSVG';
import { ProductCard } from '@/components/shop/ProductCard';
import { QuickViewModal } from '@/components/shop/QuickViewModal';
import { PRODUCTS_DATA } from '@/lib/products-data';
import type { IProduct } from '@/types';

const T = { ease: [0.16, 1, 0.3, 1] as const };

function FadeUp({ children, className='', delay=0 }: { children:React.ReactNode; className?:string; delay?:number }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:'-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity:0, y:28 }} animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ ...T, duration:0.8, delay }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Marquee ── */
const MARQUEE_ITEMS = [
  '100% Authentic',  'Same-Day Delivery in Eldoret',  'Countrywide Kenya',
  'M-Pesa & Card',   'Free Gift Wrapping',            'Personal Consultation',
  'Free Delivery over KES 10,000',                    'Kapsoya Business Park',
];

export function HomeMarquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="border-y border-stone/8 overflow-hidden py-4 bg-white">
      <div className="marquee-track flex gap-14 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="font-serif italic text-[1.1rem] text-stone/45 inline-flex items-center gap-14 flex-shrink-0">
            {item}
            <span className="text-wine-600 text-xs not-italic">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Categories ── */
const CATS = [
  { id:'women',       label:'Women',         sub:'Radiant & Feminine',       from:'#C77B95', to:'#8E2C48' },
  { id:'men',         label:'Men',           sub:'Refined & Structured',     from:'#4A4B58', to:'#1A1B25' },
  { id:'arabian-oud', label:'Arabian & Oud', sub:'Ancient Craft, New Depth', from:'#8B6038', to:'#3D2211' },
  { id:'unisex',      label:'Unisex',        sub:'Universal & Singular',     from:'#B08D3C', to:'#6B5220' },
];

export function HomeCategories({ images = {} }: { images?: Record<string, string | null> }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:'-80px' });
  return (
    <section className="py-20 max-w-[1400px] mx-auto px-5 lg:px-12">
      <FadeUp className="text-center mb-12">
        <div className="eyebrow mb-4">Collections</div>
        <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)]">Every story, its own scent.</h2>
      </FadeUp>
      <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {CATS.map((cat, i) => {
          const image = images[cat.id];
          return (
          <motion.div key={cat.id}
            initial={{ opacity:0, y:28 }}
            animate={inView ? { opacity:1, y:0 } : {}}
            transition={{ ...T, duration:0.7, delay:i*0.09 }}>
            <Link href={`/shop?cat=${cat.id}`} className="group block relative overflow-hidden aspect-[3/4] lg:aspect-[2/3]">
              {image ? (
                <NextImage
                  src={image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
              ) : (
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  style={{ background: `linear-gradient(145deg, ${cat.from} 0%, ${cat.to} 100%)` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              {/* Floating bottle silhouette — only when no real image is available */}
              {!image && (
                <div className="absolute inset-0 flex items-center justify-center opacity-15">
                  <svg viewBox="0 0 80 140" className="h-2/3 w-auto" aria-hidden="true">
                    <path d="M16 30 L15 128 Q15 135 40 135 Q65 135 65 128 L65 30 Z" fill="white"/>
                    <rect x="28" y="5" width="24" height="28" rx="2" fill="white"/>
                  </svg>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="text-[0.58rem] tracking-[0.26em] uppercase opacity-70 mb-1.5">{cat.sub}</div>
                <div className="font-display text-2xl">{cat.label}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[0.65rem] tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  Shop <ArrowRight size={10} />
                </div>
              </div>
            </Link>
          </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Featured Products ── */
function toProduct(p: typeof PRODUCTS_DATA[0], i: number): IProduct {
  return {
    ...p, _id:`f-${i}`, status:'active',
    sizes: p.sizes.map(s=>({...s})),
    images: p.images.map(img=>({...img})),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function HomeFeatured() {
  const [quickView, setQuickView] = useState<IProduct | null>(null);
  const products = PRODUCTS_DATA.filter(p => p.featured).slice(0, 4).map(toProduct);

  return (
    <section className="py-20 bg-stone/[0.025]">
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
      <div className="max-w-[1400px] mx-auto px-5 lg:px-12">
        <FadeUp className="flex items-end justify-between mb-12">
          <div>
            <div className="eyebrow mb-3">House Favourites</div>
            <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)]">Loved by our community.</h2>
          </div>
          <Link href="/shop" className="hidden md:flex items-center gap-2 btn-link text-stone/50 hover:text-wine-600 transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </FadeUp>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} index={i} inView onQuickView={setQuickView} />
          ))}
        </div>
        <div className="text-center mt-10 md:hidden">
          <Link href="/shop" className="btn-primary">View All Fragrances</Link>
        </div>
      </div>
    </section>
  );
}

/* ── Lifestyle ── */
const LIFESTYLE = [
  { label:'The Morning Ritual',  headline:'Begin with intention.',            body:'How you start the day shapes everything that follows. Your fragrance is the first signature you wear.', href:'/shop?cat=unisex',  category:'unisex',     cta:'Shop Fresh Scents',    bg:'from-[#F6EEE3] to-[#EDD8BE]',   dark:false, accent:'#8B3A44' },
  { label:'Evening Luxury',      headline:'The night has its own language.', body:'For those evenings when every detail matters — choose a fragrance that commands the room before you speak.', href:'/shop?cat=arabian-oud', category:'arabian-oud', cta:'Shop Arabian & Oud', bg:'from-[#1A1218] to-[#2D1E24]', dark:true,  accent:'#D9A84E' },
  { label:'The Gift of Scent',   headline:'The most personal gift.',         body:'Choosing a fragrance for someone tells them you know who they truly are — or who they aspire to be.', href:'/shop?cat=gift-sets', category:'gift-sets', cta:'Shop Gift Sets',      bg:'from-[#EEE5D9] to-[#DACCBA]',   dark:false, accent:'#722F37' },
];

export function LifestyleSection({ images = {} }: { images?: Record<string, string | null> }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:'-80px' });

  return (
    <section className="py-24">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-12">
        <FadeUp className="text-center mb-16">
          <div className="eyebrow mb-4">A Way of Living</div>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)]">
            Luxury is not a product.<br />
            <em className="italic text-wine-600 font-light">It is a feeling.</em>
          </h2>
        </FadeUp>

        <div ref={ref} className="grid lg:grid-cols-3 gap-4">
          {LIFESTYLE.map((panel, i) => (
            <motion.div key={panel.label}
              initial={{ opacity:0, y:36 }}
              animate={inView ? { opacity:1, y:0 } : {}}
              transition={{ ...T, duration:0.85, delay:i*0.1 }}
              className="group lifestyle-card"
            >
              <Link href={panel.href} className="block">
                <div className={`relative h-[420px] lg:h-[520px] bg-gradient-to-br ${panel.bg} overflow-hidden flex items-end`}>
                  {images[panel.category] ? (
                    <>
                      <NextImage
                        src={images[panel.category] as string}
                        alt={panel.label}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <div className={`absolute inset-0 ${panel.dark ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent' : 'bg-gradient-to-t from-black/60 via-black/5 to-transparent'}`} />
                    </>
                  ) : (
                    /* Bottle silhouette placeholder */
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
                      <svg viewBox="0 0 120 200" className="h-3/4 w-auto" aria-hidden="true">
                        <path d="M28 52 Q26 52 26 54 L26 182 Q26 192 60 192 Q94 192 94 182 L94 54 Q94 52 92 52 Z"
                          fill={panel.dark ? 'white' : '#1a1a1a'} />
                        <rect x="44" y="7" width="32" height="30" rx="3" fill={panel.dark ? 'white' : '#1a1a1a'} />
                      </svg>
                    </div>
                  )}
                  {/* Label */}
                  <div className="absolute top-7 left-7">
                    <span style={{ color: panel.accent }}
                      className="text-[0.62rem] tracking-[0.3em] uppercase font-medium">{panel.label}</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="overlay absolute inset-0" />
                  {/* Content */}
                  <div className="relative z-10 p-8 w-full">
                    <h3 className={`font-display text-[1.5rem] mb-3 leading-tight ${panel.dark ? 'text-white' : 'text-stone'}`}>
                      {panel.headline}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-350 ${panel.dark ? 'text-white/75' : 'text-stone/65'}`}>
                      {panel.body}
                    </p>
                    <span
                      style={{ color: panel.dark ? '#fff' : panel.accent }}
                      className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.22em] uppercase font-medium border-b border-current pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-350"
                    >
                      {panel.cta} <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Story banner */}
        <FadeUp className="mt-4">
          <div className="bg-stone grid md:grid-cols-2 items-stretch">
            <div className="p-10 lg:p-16 flex flex-col justify-between">
              <div>
                <div className="eyebrow text-wine-400 mb-6">From Eldoret, to the world</div>
                <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] text-white leading-[1.05] mb-8">
                  Born in the{' '}
                  <em className="italic text-wine-300 font-light">Rift Valley.</em>{' '}
                  Worn across Kenya.
                </h2>
                <p className="font-serif text-lg text-white/50 italic leading-relaxed max-w-sm">
                  We opened Floresco in Eldoret because we believed our city deserved a world-class
                  fragrance house — not a branch, not a franchise, but a house of its own.
                </p>
              </div>
              <Link href="/about" className="btn-link text-white/60 mt-10 self-start hover:text-wine-300 transition-colors">
                Discover our story →
              </Link>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-white/10 p-10 lg:p-16 grid grid-cols-2 gap-8 content-center">
              {[
                { n:'100%', label:'Authentic, every bottle' },
                { n:'12+',  label:'Curated fragrance houses' },
                { n:'47',   label:'Counties served' },
                { n:'2026', label:"Eldoret's luxury house" },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-display text-4xl text-white mb-2">{s.n}</div>
                  <div className="text-white/40 text-xs tracking-[0.14em] uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Visit section ── */
export function HomeVisit() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:'-80px' });

  return (
    <section className="py-24 bg-stone/[0.025]" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-5 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity:0, x:-32 }}
            animate={inView ? { opacity:1, x:0 } : {}}
            transition={{ ...T, duration:0.9 }}
          >
            <div className="eyebrow mb-6">The Physical Shop</div>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] mb-6">
              Come smell<br />
              <em className="italic text-wine-600 font-light">before you buy.</em>
            </h2>
            <p className="font-serif text-lg text-stone/60 italic leading-relaxed mb-10 max-w-md">
              Nothing replaces experiencing a fragrance on your own skin. Our team in Eldoret
              will guide you through scent families and help you find the one that truly feels like you.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { label:'Location', value:'Kapsoya Business Park, Eldoret, Uasin Gishu County' },
                { label:'Hours',    value:'Mon–Sat 9 AM – 7 PM · Sun 11 AM – 5 PM' },
                { label:'Contact',  value:'+254 7XX XXX XXX · hello@florescofragrances.co.ke' },
              ].map(i => (
                <div key={i.label} className="flex gap-4">
                  <div className="text-[0.62rem] tracking-[0.2em] uppercase text-stone/35 w-20 flex-shrink-0 pt-0.5">{i.label}</div>
                  <div className="text-sm text-stone/70 leading-relaxed">{i.value}</div>
                </div>
              ))}
            </div>
            <Link href="/contact" className="btn-primary">Plan Your Visit</Link>
          </motion.div>

          <motion.div
            initial={{ opacity:0, x:32 }}
            animate={inView ? { opacity:1, x:0 } : {}}
            transition={{ ...T, duration:0.9, delay:0.14 }}
            className="relative h-[400px] lg:h-[500px] bg-gradient-to-br from-cream-200 to-cream-300 flex items-center justify-center overflow-hidden"
          >
            <div className="text-center z-10">
              <div className="text-5xl mb-5">📍</div>
              <div className="font-display text-2xl text-stone mb-2">Kapsoya Business Park</div>
              <div className="text-stone/40 text-sm mb-8">Eldoret · Uasin Gishu · Kenya</div>
              <a
                href="https://maps.google.com/?q=Kapsoya+Business+Park+Eldoret"
                target="_blank" rel="noopener noreferrer"
                className="btn-outline text-xs"
              >
                Open in Google Maps
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
