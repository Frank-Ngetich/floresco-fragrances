'use client';
import {
  motion, useScroll, useTransform, useMotionValue,
  useSpring, useReducedMotion,
} from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
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
  const reduceMotion = useReducedMotion();

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
      {/* ── Full-bleed background photo ──────────────── */}
      <motion.div style={{ scale: bgScale, willChange: 'transform' }} className="absolute inset-0">
        {data.heroBackgroundUrl ? (
          <Image
            src={data.heroBackgroundUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(165deg, ${data.bgFrom} 0%, ${data.bgMid} 50%, ${data.bgTo} 100%)` }}
          />
        )}
        {/* Scrim — dark on the left where text sits, easing off toward the
            product card so the photo still reads through on the right */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(100deg, rgba(8,7,6,0.92) 0%, rgba(8,7,6,0.72) 32%, rgba(8,7,6,0.38) 58%, rgba(8,7,6,0.12) 78%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 25%)' }} />
      </motion.div>

      {/* ── Decorative letter — one quiet signature touch ── */}
      <div
        className="absolute right-[-2rem] top-[-3rem] font-display leading-none select-none pointer-events-none hidden lg:block"
        style={{ fontSize: 'clamp(16rem, 24vw, 38rem)', color: 'rgba(255,255,255,0.05)' }}
      >F</div>

      {/* ── Main grid ────────────────────────────────── */}
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 w-full
                      grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-0
                      items-center pt-20 pb-16 lg:pt-28 lg:pb-24">

        {/* ── LEFT: Content ────────────────────────── */}
        <motion.div
          style={{ y: textY, willChange: 'transform' }}
          variants={STAGGER} initial="hidden" animate="show"
          className="relative z-10 max-w-[560px]"
        >
          {/* Live badge */}
          <motion.div variants={RISE} className="mb-8">
            <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md
                            shadow-sm pl-3 pr-4 py-2">
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
            className="font-display leading-[0.97] tracking-[-0.03em] mb-8 text-white"
            style={{ fontSize: 'clamp(3.2rem, 8vw, 7.2rem)' }}>
            {data.heading1}
            <br />
            <span className="relative inline-block">
              <em className="italic font-light not-italic"
                style={{ color: 'rgb(201,164,85)' }}>
                {data.heading2}
              </em>
              {/* Underline shimmer */}
              <motion.span
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-2 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, rgba(201,164,85,0.8), rgba(201,164,85,0.6), transparent)',
                }}
              />
            </span>
          </motion.h1>

          {/* Body */}
          <motion.p variants={RISE}
            className="font-serif text-[clamp(1rem,1.6vw,1.25rem)] text-white/75
                       leading-[1.75] italic font-light mb-12 max-w-[30rem]">
            {data.subtext}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={RISE} className="flex flex-wrap items-center gap-4">
            <Link href={data.cta1Link}
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2
                         bg-[#C9A455] text-[#17140F] text-[0.7rem] tracking-[0.22em] uppercase font-medium
                         px-8 py-4 transition-all duration-300
                         shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                         hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
              {/* Fill sweep — gold button reveals white on hover */}
              <motion.span
                className="absolute inset-0 bg-white origin-left pointer-events-none"
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
                         tracking-[0.2em] uppercase font-medium text-white/70
                         hover:text-white transition-colors duration-200">
              <span className="w-8 h-px bg-white/40 group-hover:w-12 group-hover:bg-white/80 transition-all duration-300" />
              {data.cta2Label}
            </Link>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Bottle stage ───────────────────── */}
        <motion.div
          style={{ y: bottleY, opacity: heroOp, x: springX, willChange: 'transform, opacity' }}
          className="relative flex items-center justify-center
                     h-[480px] lg:h-[680px] w-full"
        >
          {/* Glow pool under bottle — grounds the product, doesn't compete for attention */}
          <motion.div
            animate={reduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute pointer-events-none"
            style={{
              width: 200, height: 44,
              bottom: '12%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(23,20,15,0.16)',
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
                background: 'radial-gradient(ellipse at center, rgba(138,109,46,0.08) 0%, transparent 70%)',
                filter: 'blur(24px)',
              }}
            />

            {isVideo ? (
              <div className="relative w-[280px] h-[360px] lg:w-[380px] lg:h-[480px] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(23,20,15,0.22)] border border-white/60 bg-black">
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
                animate={reduceMotion ? undefined : { y: [-10, 10, -10] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-[280px] h-[380px] lg:w-[400px] lg:h-[520px] rounded-2xl overflow-hidden shadow-[0_40px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/10 border-4 border-white"
              >
                <Image
                  src={data.heroImageUrl}
                  alt="Floresco"
                  fill
                  priority
                  sizes="(max-width: 1024px) 280px, 400px"
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <motion.div
                animate={reduceMotion ? undefined : { y: [-14, 14, -14], rotate: [-1.2, 1.2, -1.2] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                <HeroBottle />
              </motion.div>
            )}
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
        <span className="text-[0.55rem] tracking-[0.42em] uppercase text-white/50">Discover</span>
        <div className="relative h-14 w-px overflow-hidden">
          <motion.div
            animate={reduceMotion ? undefined : { y: ['-100%', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-0 top-0 h-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(201,164,85,0.85), transparent)',
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Hero Bottle SVG — black bottle, gold trim ──────── */
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
          <stop offset="0%"   stopColor="#2A2620" />
          <stop offset="50%"  stopColor="#17140F" />
          <stop offset="100%" stopColor="#000000" />
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
          <stop offset="0%"   stopColor="#8A6D2E" />
          <stop offset="50%"  stopColor="#AD8640" />
          <stop offset="100%" stopColor="#8A6D2E" />
        </linearGradient>
        <filter id="hb-glow">
          <feDropShadow dx="0" dy="12" stdDeviation="20"
            floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Cap */}
      <rect x="58" y="8"  width="44" height="40" rx="4" fill="url(#hb-cap)" />
      <rect x="62" y="11" width="12" height="34" rx="3" fill="rgba(255,255,255,0.06)" />
      <circle cx="80" cy="28" r="4.5" fill="rgba(138,109,46,0.5)" />
      <circle cx="80" cy="28" r="2.5" fill="rgba(138,109,46,0.85)" />

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
        fill="none" stroke="rgba(23,20,15,0.15)" strokeWidth="0.5" />
      <rect x="52" y="148" width="56" height="58"
        fill="none" stroke="rgba(138,109,46,0.3)" strokeWidth="0.5" />

      <text x="80" y="168" textAnchor="middle"
        fontFamily="Georgia,serif" fontStyle="italic"
        fontSize="13" fill="#17140F" letterSpacing="0.5">
        Floresco
      </text>
      <line x1="54" y1="174" x2="106" y2="174"
        stroke="rgba(23,20,15,0.18)" strokeWidth="0.5" />
      <text x="80" y="184" textAnchor="middle"
        fontFamily="Arial,sans-serif" fontSize="5.5"
        fill="#6B5423" letterSpacing="2">
        PARFUM
      </text>
      <text x="80" y="194" textAnchor="middle"
        fontFamily="Arial,sans-serif" fontSize="4"
        fill="#9A8A5C" letterSpacing="1.5">
        ELDORET · KENYA
      </text>
      <line x1="54" y1="200" x2="106" y2="200"
        stroke="rgba(23,20,15,0.1)" strokeWidth="0.5" />
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
