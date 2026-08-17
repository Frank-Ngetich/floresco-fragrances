'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const T = { ease: [0.16, 1, 0.3, 1] as const };

const POSTS = [
  { slug: 'how-to-spot-fake-perfume',  category: 'Guide',         title: 'How to Spot a Fake Perfume: 7 Checks Before You Buy in Kenya',   excerpt: 'The counterfeit fragrance market in Kenya is larger than most people realise. Here is how to protect yourself every time.', date: 'Jul 18, 2026', readTime: '5 min', featured: true,  color: '#B02837', bg: 'from-[#2A0608] to-[#6B1015]' },
  { slug: 'best-oud-perfumes-kenya',   category: 'The Oud Edit',  title: "The Beginner's Guide to Arabian & Oud Perfumes",                   excerpt: 'Oud is one of the most misunderstood — and magnificent — fragrance materials in the world. A guide to appreciating your first oud.', date: 'Jul 12, 2026', readTime: '7 min', featured: false, color: '#8B6038', bg: 'from-[#1A0E06] to-[#4A2D12]' },
  { slug: 'edp-vs-edt-explained',      category: 'Education',     title: 'EDP vs EDT vs Parfum: What Is the Difference?',                   excerpt: 'Concentration determines longevity, projection, and price. Understanding the difference transforms how you shop.', date: 'Jul 5, 2026',  readTime: '4 min', featured: false, color: '#1B2B45', bg: 'from-[#060A10] to-[#1B3560]' },
  { slug: 'perfume-gift-guide',        category: 'Gift Guide',    title: 'How to Choose a Perfume Gift That Actually Fits the Person',      excerpt: 'Fragrance is the most intimate gift you can give. It says: I know you. Here is how to get it right, every time.', date: 'Jun 28, 2026', readTime: '6 min', featured: false, color: '#8E2C48', bg: 'from-[#190811] to-[#5A1825]' },
  { slug: 'make-perfume-last-longer',  category: 'Tips',          title: '7 Ways to Make Your Perfume Last All Day in the Kenyan Heat',    excerpt: 'Humidity and heat are fragrance killers — unless you know how to work with them. Techniques that apply universally.', date: 'Jun 20, 2026', readTime: '4 min', featured: false, color: '#2E5D3A', bg: 'from-[#081509] to-[#1A4020]' },
  { slug: 'best-mens-perfumes-kenya',  category: 'The Edit',      title: '10 Best Long-Lasting Perfumes for Men in Kenya (2026)',          excerpt: 'Longevity is king when you need a fragrance to carry you from office to evening. Our curated pick of the most tenacious scents.', date: 'Jun 14, 2026', readTime: '8 min', featured: false, color: '#222226', bg: 'from-[#0A0A0C] to-[#252528]' },
];

function BottleBg({ bg }: { bg: string }) {
  return (
    <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <svg viewBox="0 0 80 140" className="h-28 w-auto opacity-30" aria-hidden="true">
        <rect x="28" y="4" width="24" height="22" rx="2" fill="white" />
        <rect x="24" y="24" width="32" height="4" fill="white" opacity="0.6" />
        <rect x="32" y="28" width="16" height="8" fill="white" opacity="0.4" />
        <path d="M16 36 L15 128 Q15 136 40 136 Q65 136 65 128 L65 36 Z" fill="white" opacity="0.25" />
        <path d="M18 40 L18 126 Q18 130 28 131 L30 131 L30 40 Z" fill="white" opacity="0.2" />
      </svg>
    </div>
  );
}

export function BlogClient() {
  const featured = POSTS[0];
  const rest     = POSTS.slice(1);
  const heroRef  = useRef<HTMLDivElement>(null);
  const heroIn   = useInView(heroRef, { once: true });
  const gridRef  = useRef<HTMLDivElement>(null);
  const gridIn   = useInView(gridRef, { once: true, margin: '-80px' });

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-stone/[0.025] border-b border-stone/8 py-16 text-center">
        <motion.div ref={heroRef} initial={{ opacity: 0, y: 24 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ ...T, duration: 0.8 }}>
          <div className="eyebrow mb-4">Floresco</div>
          <h1 className="font-display text-[clamp(2.8rem,6vw,5rem)] mb-4">The Journal</h1>
          <p className="text-stone/45 text-sm max-w-xs mx-auto">Fragrance stories, education and the art of living beautifully.</p>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        {/* Featured */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, duration: 0.8 }} className="mb-16">
          <Link href={`/blog/${featured.slug}`} className="group grid lg:grid-cols-2 border border-stone/10 overflow-hidden hover:border-wine-200 transition-colors">
            <div className="aspect-[16/9] lg:aspect-auto lg:min-h-[420px] overflow-hidden">
              <BottleBg bg={featured.bg} />
            </div>
            <div className="p-10 lg:p-14 flex flex-col justify-center bg-white">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-[0.6rem] tracking-[0.28em] uppercase text-wine-600 border border-wine-200 px-3 py-1">{featured.category}</span>
                <span className="text-stone/35 text-xs flex items-center gap-1.5"><Calendar size={11} />{featured.date}</span>
                <span className="text-stone/35 text-xs flex items-center gap-1.5"><Clock size={11} />{featured.readTime}</span>
              </div>
              <h2 className="font-display text-[clamp(1.8rem,2.5vw,2.6rem)] mb-5 group-hover:text-wine-700 transition-colors leading-tight">{featured.title}</h2>
              <p className="text-stone/55 leading-relaxed mb-8 text-sm max-w-md">{featured.excerpt}</p>
              <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase font-medium text-wine-600 border-b border-wine-400 pb-0.5 self-start group-hover:gap-3 transition-all">
                Read Article <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Grid heading */}
        <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-stone/8">
          <h2 className="font-display text-2xl">Latest Articles</h2>
          <span className="text-[0.68rem] tracking-[0.18em] uppercase text-stone/35">{POSTS.length} articles</span>
        </div>

        {/* Articles grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post, i) => (
            <motion.div key={post.slug}
              initial={{ opacity: 0, y: 24 }} animate={gridIn ? { opacity: 1, y: 0 } : {}}
              transition={{ ...T, duration: 0.65, delay: i * 0.08 }}>
              <Link href={`/blog/${post.slug}`} className="group block border border-stone/10 hover:border-wine-200 transition-colors bg-white">
                <div className="aspect-[16/10] overflow-hidden">
                  <BottleBg bg={post.bg} />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[0.58rem] tracking-[0.28em] uppercase text-wine-600 font-medium">{post.category}</span>
                    <span className="text-stone/35 text-xs flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
                  </div>
                  <h3 className="font-display text-[1.15rem] leading-snug mb-3 group-hover:text-wine-700 transition-colors">{post.title}</h3>
                  <p className="text-stone/50 text-[0.82rem] leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase font-medium text-wine-600 border-b border-wine-300 pb-0.5">Read More →</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
