'use client';
import {
  motion, useScroll, useTransform, useMotionValue,
  useSpring,
} from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, MapPin, Sparkles } from 'lucide-react';
import { DEFAULT_HERO, type HeroData } from '@/lib/hero-defaults';

/* ─── Animation variants ─────────────────────────────── */
const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.3 } },
};
const RISE = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Floating particles (fixed decorative field) ────── */
const PARTICLES = [
  { size: 4,  left: '8%',  top: '18%', dur: 8,   delay: 0,   wine: true  },
  { size: 3,  left: '88%', top: '22%', dur: 10,  delay: 1.5, wine: false },
  { size: 6,  left: '78%', top: '72%', dur: 12,  delay: 0.8, wine: true  },
  { size: 3,  left: '15%', top: '70%', dur: 9,   delay: 2.2, wine: false },
  { size: 5,  left: '92%', top: '48%', dur: 11,  delay: 0.4, wine: true  },
  { size: 4,  left: '5%',  top: '42%', dur: 13,  delay: 3.1, wine: false },
  { size: 3,  left: '50%', top: '8%',  dur: 7.5, delay: 1.8, wine: true  },
  { size: 5,  left: '38%', top: '88%', dur: 9.5, delay: 4.0, wine: false },
  { size: 2,  left: '65%', top: '15%', dur: 6,   delay: 2.6, wine: true  },
  { size: 4,  left: '22%', top: '92%', dur: 11,  delay: 1.2, wine: false },
];

/* Spread N scent pills evenly around the bottle stage */
function pillLayout(i: number, total: number) {
  const angle = (i / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.round(Math.cos(angle) * 185),
    y: Math.round(Math.sin(angle) * 130),
    delay: 1.1 + i * 0.2,
    dur: 6 + (i % 4) * 0.6,
  };
}

/* Normalise a YouTube watch/share URL into an embeddable one */
function toEmbedUrl(url: string) {
  const watch = url.match(/[?&]v=([\w-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([\w-]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

export function Hero({ hero }: { hero?: Partial<HeroData> }) {
  const data = { ...DEFAULT_HERO, ...hero };
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  /* Scroll parallax */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const bottleY   = useTransform(scrollYProgress, [0, 1], ['0%',  '30%']);
  const textY     = useTransform(scrollYProgress, [0, 1], ['0%',  '15%']);
  const heroOp    = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const bgScale   = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  /* Cursor magnetic tracking */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 55, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 55, damping: 20 });

  useEffect(() => { setMounted(true); }, []);

  function onMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left - rect.width  / 2) * 0.035);
    rawY.set((e.clientY - rect.top  - rect.height / 2) * 0.035);
  }
  function onMouseLeave() { rawX.set(0); rawY.set(0); }

  const isVideo = data.useVideo && data.videoUrl.trim();
  const isYouTube = isVideo && /youtube\.com|youtu\.be/.test(data.videoUrl);

  return (
    <section
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative min-h-[96vh] flex items-center overflow-hidden"
    >
      {/* ── Background ───────────────────────────────── */}
      <motion.div style={{ scale: bgScale }} className="absolute inset-0">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 70% at 65% 40%, rgba(176,40,55,0.07) 0%, transparent 65%),
              radial-gradient(ellipse 60% 60% at 20% 70%, rgba(181,146,76,0.06) 0%, transparent 60%),
              linear-gradient(165deg, ${data.bgFrom} 0%, ${data.bgMid} 50%, ${data.bgTo} 100%)
            `,
          }}
        />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '128px',
          }}
        />
      </motion.div>

      {/* ── Ambient orbs ─────────────────────────────── */}
      {mounted && (
        <>
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 700, height: 700, top: '-15%', right: '-5%',
              background: 'radial-gradient(circle, rgba(176,40,55,0.07) 0%, transparent 70%)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 500, height: 500, bottom: '-10%', left: '5%',
              background: 'radial-gradient(circle, rgba(181,146,76,0.09) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* ── Decorative letter ────────────────────────── */}
      <div
        className="absolute right-[-2rem] top-[-3rem] font-display leading-none select-none pointer-events-none hidden lg:block"
        style={{ fontSize: 'clamp(16rem, 24vw, 38rem)', color: 'rgba(176,40,55,0.032)' }}
      >F</div>

      {/* ── Floating particles ───────────────────────── */}
      {mounted && data.showParticles && PARTICLES.map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            left: p.left, top: p.top,
            background: p.wine
              ? 'rgba(176,40,55,0.3)'
              : 'rgba(181,146,76,0.35)',
          }}
          animate={{
            y: [0, -20, 10, 0],
            x: [0,  8,  -5, 0],
            opacity: [0.3, 0.8, 0.2, 0.3],
            scale:   [1, 1.4, 0.7, 1],
          }}
          transition={{
            duration: p.dur, delay: p.delay,
            repeat: Infinity, ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Main grid ────────────────────────────────── */}
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 w-full
                      grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-0
                      items-center pt-20 pb-16 lg:pt-28 lg:pb-24">

        {/* ── LEFT: Content ────────────────────────── */}
        <motion.div
          style={{ y: textY }}
          variants={STAGGER} initial="hidden" animate="show"
          className="relative z-10 max-w-[560px]"
        >
          {/* Live badge */}
          <motion.div variants={RISE} className="mb-8">
            <div className="inline-flex items-center gap-2.5 bg-white/75 backdrop-blur-md
                            border border-stone/10 shadow-sm pl-3 pr-4 py-2">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wine-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-wine-600" />
              </span>
              <span className="text-[0.62rem] tracking-[0.25em] uppercase font-medium text-stone/70">
                {data.badge}
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={RISE}
            className="font-display leading-[0.97] tracking-[-0.03em] mb-8"
            style={{ fontSize: 'clamp(3.2rem, 8vw, 7.2rem)' }}>
            {data.heading1}
            <br />
            <span className="relative inline-block">
              <em className="italic font-light not-italic"
                style={{ color: 'rgb(176,40,55)' }}>
                {data.heading2}
              </em>
              {/* Underline shimmer */}
              <motion.span
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-2 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, rgba(176,40,55,0.7), rgba(181,146,76,0.6), transparent)',
                }}
              />
            </span>
          </motion.h1>

          {/* Body */}
          <motion.p variants={RISE}
            className="font-serif text-[clamp(1rem,1.6vw,1.25rem)] text-stone/60
                       leading-[1.75] italic font-light mb-3 max-w-[30rem]">
            {data.subtext}
          </motion.p>

          <motion.div variants={RISE}
            className="flex items-center gap-1.5 mb-10 text-[0.75rem] text-stone/40">
            <MapPin size={11} className="text-wine-500 flex-shrink-0" />
            {data.tagline}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={RISE} className="flex flex-wrap items-center gap-4 mb-14">
            <Link href={data.cta1Link}
              className="group relative overflow-hidden btn-primary
                         shadow-[0_8px_32px_rgba(176,40,55,0.32)]
                         hover:shadow-[0_12px_40px_rgba(176,40,55,0.44)]
                         transition-shadow duration-300">
              {/* Fill sweep */}
              <motion.span
                className="absolute inset-0 bg-wine-800 origin-left pointer-events-none"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="relative flex items-center gap-2.5">
                {data.cta1Label}
                <ArrowRight size={14}
                  className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Link>

            <Link href={data.cta2Link}
              className="group relative flex items-center gap-2 text-[0.72rem]
                         tracking-[0.2em] uppercase font-medium text-stone/60
                         hover:text-stone transition-colors duration-200">
              <span className="w-8 h-px bg-stone/30 group-hover:w-12 group-hover:bg-stone/60 transition-all duration-300" />
              {data.cta2Label}
            </Link>
          </motion.div>

          {/* Trust row */}
          <motion.div variants={RISE}
            className="flex flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-stone/10">
            {data.trustItems.map(t => (
              <div key={t.label}>
                <div className="text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-stone mb-0.5">{t.label}</div>
                <div className="text-[0.72rem] text-stone/45">{t.sub}</div>
              </div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div variants={RISE}
            className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-2.5">
              {['#B02837','#8B3A44','#D24650','#6B1A22','#C04050'].map((c, i) => (
                <div key={i}
                  className="w-8 h-8 rounded-full border-2 border-white
                             flex items-center justify-center text-white
                             text-[0.62rem] font-bold shadow-sm"
                  style={{ background: c }}>
                  {['A','W','J','S','G'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-[0.7rem] text-stone/50">
                <strong className="text-stone font-semibold">2,400+</strong> customers across Kenya
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Bottle stage ───────────────────── */}
        <motion.div
          style={{ y: bottleY, opacity: heroOp, x: springX }}
          className="relative flex items-center justify-center
                     h-[480px] lg:h-[680px] w-full"
        >
          {/* Orbit rings */}
          {data.showOrbitRings && [
            { size: 280, dur: 75,  op: 0.28, rev: false },
            { size: 400, dur: 110, op: 0.16, rev: true  },
            { size: 520, dur: 150, op: 0.10, rev: false },
            { size: 640, dur: 200, op: 0.06, rev: true  },
          ].map((ring, i) => (
            <motion.div key={i}
              animate={{ rotate: ring.rev ? -360 : 360 }}
              transition={{ duration: ring.dur, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: ring.size, height: ring.size,
                border: `1px dashed rgba(176,40,55,${ring.op})`,
              }}
            />
          ))}

          {/* Orbiting dots */}
          {data.showOrbitRings && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
                className="absolute pointer-events-none"
                style={{ width: 280, height: 280 }}>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2
                                w-3 h-3 rounded-full bg-wine-500/70
                                shadow-[0_0_10px_rgba(176,40,55,0.6)]" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
                className="absolute pointer-events-none"
                style={{ width: 400, height: 400 }}>
                <div className="absolute top-0 right-1/4
                                w-2 h-2 rounded-full bg-amber-400/50
                                shadow-[0_0_8px_rgba(181,146,76,0.5)]" />
              </motion.div>
            </>
          )}

          {/* Glow pool under bottle */}
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute pointer-events-none"
            style={{
              width: 200, height: 44,
              bottom: '12%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(176,40,55,0.22)',
              filter: 'blur(22px)',
              borderRadius: '50%',
            }}
          />

          {/* ── Bottle / Photo / Video ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 40 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            style={{ x: springX, y: springY }}
            className="relative z-10"
          >
            {/* Refraction halo */}
            <div className="absolute -inset-12 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(176,40,55,0.06) 0%, transparent 70%)',
                filter: 'blur(24px)',
              }}
            />

            {isVideo ? (
              <div className="relative w-[280px] h-[360px] lg:w-[380px] lg:h-[480px] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(176,40,55,0.25)] border border-white/60 bg-black">
                {isYouTube ? (
                  <iframe
                    src={toEmbedUrl(data.videoUrl)}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={data.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay loop muted playsInline
                  />
                )}
              </div>
            ) : data.heroImageUrl ? (
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-[260px] h-[340px] lg:w-[340px] lg:h-[440px] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(176,40,55,0.25)] border border-white/60"
              >
                <Image
                  src={data.heroImageUrl}
                  alt="Floresco"
                  fill
                  priority
                  sizes="(max-width: 1024px) 260px, 340px"
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <motion.div
                animate={{ y: [-14, 14, -14], rotate: [-1.2, 1.2, -1.2] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                <HeroBottle />
              </motion.div>
            )}
          </motion.div>

          {/* ── Scent pills ── */}
          {mounted && data.pills.map((label, i) => {
            const pos = pillLayout(i, data.pills.length);
            return (
              <motion.div key={label + i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: pos.delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ x: pos.x, y: pos.y }}
                className="absolute z-20 pointer-events-none"
              >
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: pos.dur, repeat: Infinity, ease: 'easeInOut',
                                delay: Math.random() * 2 }}
                  className="bg-white/90 backdrop-blur-md border border-stone/10
                             shadow-[0_4px_20px_rgba(0,0,0,0.06)]
                             px-4 py-2 flex items-center gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-wine-500/80 flex-shrink-0" />
                  <span className="text-[0.6rem] tracking-[0.28em] uppercase font-medium text-stone/65 whitespace-nowrap">
                    {label}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}

          {/* ── Floating badges ── */}
          {/* Rating */}
          {data.showRatingBadge && (
            <motion.div
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0,  y: 0 }}
              transition={{ delay: 2.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-[18%] right-0 lg:right-[-1rem] z-20
                         bg-white/95 backdrop-blur-md border border-stone/10
                         shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-5 py-3.5"
            >
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-[0.78rem] font-bold text-stone">4.9 / 5.0</div>
              <div className="text-[0.62rem] text-stone/40 tracking-wide mt-0.5">2,400+ Reviews</div>
            </motion.div>
          )}

          {/* Delivery */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: -10 }}
            animate={{ opacity: 1, x: 0,   y: 0 }}
            transition={{ delay: 2.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[16%] left-0 lg:left-[-1rem] z-20
                       bg-stone/95 backdrop-blur-md text-white
                       shadow-[0_8px_32px_rgba(0,0,0,0.18)] px-5 py-3.5"
          >
            <div className="text-[0.62rem] tracking-[0.22em] uppercase text-wine-300 mb-1">Eldoret</div>
            <div className="text-[0.82rem] font-medium">Same-Day Delivery</div>
            <div className="text-[0.62rem] text-white/40 mt-0.5">Order before 3 PM</div>
          </motion.div>

          {/* Authenticity badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[8%] right-[5%] z-20
                       bg-white/90 backdrop-blur-sm border border-stone/10
                       shadow-[0_4px_16px_rgba(0,0,0,0.07)] px-3.5 py-2.5
                       flex items-center gap-2.5"
          >
            <div className="w-7 h-7 rounded-full bg-wine-50 border border-wine-200
                            flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-wine-600" />
            </div>
            <div>
              <div className="text-[0.65rem] font-semibold text-stone">100% Original</div>
              <div className="text-[0.58rem] text-stone/40">Authenticated</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2
                   flex flex-col items-center gap-3"
      >
        <span className="text-[0.55rem] tracking-[0.42em] uppercase text-stone/30">Discover</span>
        <div className="relative h-14 w-px overflow-hidden">
          <motion.div
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-0 top-0 h-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(176,40,55,0.7), transparent)',
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Hero Bottle SVG — unchanged ────────────────────── */
function HeroBottle() {
  return (
    <svg
      viewBox="0 0 160 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-44 lg:w-56 h-auto drop-shadow-2xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hb-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#8B3A44" />
          <stop offset="50%"  stopColor="#722F37" />
          <stop offset="100%" stopColor="#4E1F25" />
        </linearGradient>
        <linearGradient id="hb-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.5)" />
          <stop offset="40%"  stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="hb-cap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        <linearGradient id="hb-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#B5924C" />
          <stop offset="50%"  stopColor="#D9BB6A" />
          <stop offset="100%" stopColor="#B5924C" />
        </linearGradient>
        <filter id="hb-glow">
          <feDropShadow dx="0" dy="12" stdDeviation="20"
            floodColor="#722F37" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Cap */}
      <rect x="58" y="8"  width="44" height="40" rx="4" fill="url(#hb-cap)" />
      <rect x="62" y="11" width="12" height="34" rx="3" fill="rgba(255,255,255,0.06)" />
      <circle cx="80" cy="28" r="4.5" fill="rgba(114,47,55,0.6)" />
      <circle cx="80" cy="28" r="2.5" fill="rgba(114,47,55,0.9)" />

      {/* Gold collar */}
      <rect x="54" y="46" width="52" height="6" rx="1" fill="url(#hb-gold)" />

      {/* Neck */}
      <rect x="68" y="52" width="24" height="18" fill="url(#hb-g)" />
      <rect x="68" y="52" width="9"  height="18" fill="url(#hb-shine)" opacity="0.5" />

      {/* Body */}
      <path
        d="M 36 70 Q 36 68 38 68 L 122 68 Q 124 68 124 70 L 126 252 Q 126 265 112 265 L 48 265 Q 34 265 34 252 Z"
        fill="url(#hb-g)"
        filter="url(#hb-glow)"
      />

      {/* Shine */}
      <path
        d="M 40 75 Q 40 73 42 73 L 66 73 Q 68 73 68 75 L 68 248 Q 68 252 66 252 L 42 252 Q 40 252 40 248 Z"
        fill="url(#hb-shine)"
        opacity="0.65"
      />

      {/* Right reflection */}
      <path d="M 112 80 L 116 80 L 116 245 L 112 245 Z"
        fill="rgba(255,255,255,0.07)" />

      {/* Top gold band */}
      <rect x="34" y="68" width="92" height="5"
        fill="url(#hb-gold)" opacity="0.65" />

      {/* Label */}
      <rect x="46" y="142" width="68" height="70" fill="rgba(255,255,255,0.97)" />
      <rect x="49" y="145" width="62" height="64"
        fill="none" stroke="rgba(114,47,55,0.15)" strokeWidth="0.5" />
      <rect x="52" y="148" width="56" height="58"
        fill="none" stroke="rgba(181,146,76,0.25)" strokeWidth="0.5" />

      <text x="80" y="168" textAnchor="middle"
        fontFamily="Georgia,serif" fontStyle="italic"
        fontSize="13" fill="#1a1a1a" letterSpacing="0.5">
        Floresco
      </text>
      <line x1="54" y1="174" x2="106" y2="174"
        stroke="rgba(114,47,55,0.18)" strokeWidth="0.5" />
      <text x="80" y="184" textAnchor="middle"
        fontFamily="Arial,sans-serif" fontSize="5.5"
        fill="#722F37" letterSpacing="2">
        PARFUM
      </text>
      <text x="80" y="194" textAnchor="middle"
        fontFamily="Arial,sans-serif" fontSize="4"
        fill="#9A8A5C" letterSpacing="1.5">
        ELDORET · KENYA
      </text>
      <line x1="54" y1="200" x2="106" y2="200"
        stroke="rgba(114,47,55,0.10)" strokeWidth="0.5" />
      <text x="80" y="208" textAnchor="middle"
        fontFamily="Arial,sans-serif" fontSize="4"
        fill="#999" letterSpacing="0.8">
        Eau de Parfum
      </text>

      {/* Bottom band */}
      <rect x="34" y="257" width="92" height="4" rx="1"
        fill="url(#hb-gold)" opacity="0.45" />
    </svg>
  );
}
