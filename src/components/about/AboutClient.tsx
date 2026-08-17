'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Shield, Star, Heart, Truck } from 'lucide-react';

const T = { ease: [0.16, 1, 0.3, 1] as const };

function FadeUp({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...T, duration: 0.85, delay }} className={className}>
      {children}
    </motion.div>
  );
}

const VALUES = [
  { icon: Shield, label: 'Authenticity',  body: 'Every bottle we sell is genuine. Sourced through authorised channels, traceable, and backed by our personal guarantee.' },
  { icon: Star,   label: 'Expertise',     body: 'We know our fragrances deeply — their notes, their longevity, their personality. We guide, not just sell.' },
  { icon: Heart,  label: 'Care',          body: 'Luxury is a feeling, not a price tag. From packaging to delivery, every detail is considered.' },
  { icon: Truck,  label: 'Accessibility', body: 'We bring world-class fragrance to Eldoret — and from here, to all 47 counties across Kenya.' },
];

const TIMELINE = [
  { n: '01', title: 'The frustration',  body: 'Tired of counterfeit perfume flooding the Kenyan market, we set out to build the shop we wished existed — where every bottle is genuine.' },
  { n: '02', title: 'The sourcing',     body: 'Months building relationships with authorised distributors across Europe and the Gulf. Every fragrance on our shelves is traceable.' },
  { n: '03', title: 'Kapsoya opens',    body: 'We opened in Eldoret at Kapsoya Business Park — a considered space where scent is experienced, not rushed.' },
  { n: '04', title: 'Kenya-wide',       body: 'From the Rift Valley we now serve fragrance lovers across Kenya. Same standards, same authenticity, delivered to your door.' },
];

export function AboutClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroIn  = useInView(heroRef, { once: true });

  return (
    <div className="page-enter">
      {/* Hero */}
      <section ref={heroRef}
        className="relative min-h-[65vh] flex items-center justify-center text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#FDFBF8 0%,#F5EDE8 50%,#EDE3DB 100%)' }}>
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[600px] h-[600px] rounded-full border border-wine-200/20 pointer-events-none" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[400px] h-[400px] rounded-full border border-gold/15 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 28 }} animate={heroIn ? { opacity: 1, y: 0 } : {}}
          transition={{ ...T, duration: 0.9, delay: 0.2 }}
          className="relative px-6 max-w-3xl mx-auto py-32">
          <div className="eyebrow mb-8">Our Story</div>
          <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] leading-[1.02] mb-8">
            To begin <em className="italic font-light" style={{ color: 'rgb(176,40,55)' }}>to bloom.</em>
          </h1>
          <p className="font-serif text-[clamp(1.1rem,2vw,1.4rem)] leading-relaxed text-stone/60 italic max-w-xl mx-auto">
            Floresco began with a simple belief: that Eldoret deserved a world-class fragrance house of its own.
          </p>
        </motion.div>
      </section>

      {/* Story */}
      <section className="py-24 max-w-2xl mx-auto px-6 text-center">
        <FadeUp>
          <p className="font-serif text-[1.3rem] text-stone/70 leading-[1.8] mb-6">
            So we built the shop we wished existed. One where every bottle is authentic, every price is honest, and every customer gets real guidance — not just a sale.
          </p>
          <p className="font-serif text-[1.3rem] text-stone/70 leading-[1.8]">
            Our name comes from the Latin <em className="italic text-wine-600">floresco</em> — to begin to bloom. It captures what we believe the right fragrance does: it brings out something in you that was always there, waiting.
          </p>
        </FadeUp>
        <FadeUp className="mt-12" delay={0.15}>
          <blockquote className="font-display text-2xl italic text-wine-600">
            &ldquo;Every fragrance we sell is one we would wear ourselves.&rdquo;
          </blockquote>
        </FadeUp>
      </section>

      <div className="h-px bg-stone/8 max-w-[1400px] mx-auto" />

      {/* Values */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <FadeUp className="text-center mb-16">
            <div className="eyebrow mb-4">What We Stand For</div>
            <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)]">Our promises to you</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {VALUES.map((v, i) => {
              const ref = useRef<HTMLDivElement>(null);
              const inView = useInView(ref, { once: true, margin: '-60px' });
              return (
                <motion.div key={v.label} ref={ref}
                  initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...T, duration: 0.7, delay: i * 0.1 }} className="text-center">
                  <div className="w-14 h-14 border border-wine-200 flex items-center justify-center mx-auto mb-6 text-wine-600">
                    <v.icon size={22} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl mb-3">{v.label}</h3>
                  <p className="text-stone/55 text-sm leading-relaxed">{v.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-stone text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-16">
            <div className="text-wine-300 text-[0.65rem] tracking-[0.3em] uppercase mb-4">Our Journey</div>
            <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] text-white">A young house, an old craft.</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {TIMELINE.map((t, i) => {
              const ref = useRef<HTMLDivElement>(null);
              const inView = useInView(ref, { once: true, margin: '-60px' });
              return (
                <motion.div key={t.n} ref={ref}
                  initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...T, duration: 0.7, delay: i * 0.1 }}>
                  <div className="font-display text-5xl text-wine-600/35 mb-4">{t.n}</div>
                  <h4 className="font-display text-xl text-white mb-3">{t.title}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">{t.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { n: '100%',   label: 'Authentic',        sub: 'Every single bottle' },
              { n: '12+',    label: 'Fragrance Houses',  sub: 'Curated globally' },
              { n: '47',     label: 'Counties Served',   sub: 'All of Kenya' },
              { n: '2,400+', label: 'Happy Customers',   sub: 'And growing' },
            ].map((s, i) => {
              const ref = useRef<HTMLDivElement>(null);
              const inView = useInView(ref, { once: true, margin: '-60px' });
              return (
                <motion.div key={s.label} ref={ref}
                  initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...T, duration: 0.7, delay: i * 0.1 }}>
                  <div className="font-display text-[clamp(2.5rem,5vw,4rem)] text-wine-600 mb-2">{s.n}</div>
                  <div className="font-medium text-stone mb-1">{s.label}</div>
                  <div className="text-stone/40 text-xs tracking-wide">{s.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-stone/[0.025] text-center">
        <div className="max-w-xl mx-auto px-6">
          <FadeUp>
            <div className="eyebrow mb-6">Visit Us</div>
            <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)] mb-6">Come find your scent.</h2>
            <p className="text-stone/55 mb-10 leading-relaxed">Walk in. Tell us an occasion, a mood, a memory. We&apos;ll find the fragrance that fits.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/shop" className="btn-primary">Shop Online</Link>
              <Link href="/contact" className="btn-outline">Visit Kapsoya</Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
