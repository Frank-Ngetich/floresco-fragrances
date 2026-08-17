'use client';
import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Phone, Mail, Plus, Minus, Send, CheckCircle } from 'lucide-react';

const T = { ease: [0.16, 1, 0.3, 1] as const };

const FAQS = [
  { q: 'Are all your fragrances 100% authentic?', a: 'Yes, unequivocally. Every bottle is sourced through authorised distributors and comes with its original packaging, batch code, and quality seal. We stake our reputation on it.' },
  { q: 'How does delivery work in Eldoret?', a: 'Orders placed before 3 PM are delivered the same day within Eldoret town. Delivery within Eldoret is free on orders above KES 10,000, otherwise KES 300.' },
  { q: 'Do you deliver countrywide?', a: 'Yes — to all 47 counties via G4S, Fargo Courier, or Sendy. Standard delivery arrives in 1–3 business days. Free on orders above KES 10,000.' },
  { q: 'What payment methods do you accept?', a: 'M-Pesa STK Push (recommended), Visa, Mastercard, cash on delivery within Eldoret, and bank transfer for larger orders.' },
  { q: 'Can I return a fragrance I don\'t like?', a: 'Unopened, unused bottles can be returned within 7 days for a full refund. Once unsealed, returns are not possible for hygiene reasons — which is why we encourage in-store sampling.' },
  { q: 'Can I book a personal consultation?', a: 'Walk in during opening hours or call ahead. Our team will guide you through scent families and help you find your signature scent.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone/8">
      <button onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4 group">
        <span className="font-display text-lg group-hover:text-wine-600 transition-colors pr-4">{q}</span>
        <span className="flex-shrink-0 w-7 h-7 border border-stone/15 flex items-center justify-center text-stone/50 group-hover:border-wine-400 group-hover:text-wine-600 transition-all">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden">
            <p className="pb-5 text-stone/60 leading-relaxed pr-12">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContactClient() {
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroIn  = useInView(heroRef, { once: true });
  const formRef = useRef<HTMLDivElement>(null);
  const formIn  = useInView(formRef, { once: true, margin: '-80px' });
  const faqRef  = useRef<HTMLDivElement>(null);
  const faqIn   = useInView(faqRef, { once: true, margin: '-80px' });
  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } catch {}
    await new Promise(r => setTimeout(r, 700));
    setSending(false);
    setSent(true);
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <section ref={heroRef} className="bg-stone/[0.025] border-b border-stone/8 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ ...T, duration: 0.8 }}>
          <div className="eyebrow mb-4">Get in Touch</div>
          <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] mb-4">Visit &amp; Contact</h1>
          <p className="text-stone/45 max-w-sm mx-auto text-sm">Come smell before you buy, or reach us online.</p>
        </motion.div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-20">
          {/* Info */}
          <motion.div ref={formRef} initial={{ opacity: 0, x: -32 }} animate={formIn ? { opacity: 1, x: 0 } : {}} transition={{ ...T, duration: 0.9 }}>
            <h2 className="font-display text-3xl mb-10">The Shop</h2>
            <div className="space-y-6 mb-12">
              {[
                { icon: MapPin, label: 'Location', value: 'Kapsoya Business Park\nEldoret, Uasin Gishu County, Kenya' },
                { icon: Clock,  label: 'Opening Hours', value: 'Mon–Sat: 9:00 AM – 7:00 PM\nSunday: 11:00 AM – 5:00 PM' },
                { icon: Phone,  label: 'Phone & WhatsApp', value: '+254 7XX XXX XXX' },
                { icon: Mail,   label: 'Email', value: 'hello@florescofragrances.co.ke' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 border border-wine-200 flex items-center justify-center text-wine-600 flex-shrink-0 mt-0.5">
                    <Icon size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[0.62rem] tracking-[0.2em] uppercase text-stone/35 mb-1">{label}</div>
                    <div className="text-stone/75 text-sm leading-relaxed whitespace-pre-line">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Map placeholder */}
            <div className="bg-stone/[0.04] border border-stone/10 h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">📍</div>
                <div className="font-display text-xl mb-1 text-stone">Kapsoya Business Park</div>
                <div className="text-stone/40 text-sm mb-6">Eldoret · Uasin Gishu · Kenya</div>
                <a href="https://maps.google.com/?q=Kapsoya+Business+Park+Eldoret" target="_blank" rel="noopener noreferrer"
                  className="text-[0.65rem] tracking-[0.2em] uppercase text-wine-600 border-b border-wine-400 pb-0.5 hover:opacity-70 transition-opacity">
                  Open in Google Maps
                </a>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 32 }} animate={formIn ? { opacity: 1, x: 0 } : {}} transition={{ ...T, duration: 0.9, delay: 0.15 }}>
            <h2 className="font-display text-3xl mb-10">Send a Message</h2>
            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-stone/[0.03] border border-stone/10 p-12 text-center">
                <CheckCircle size={48} strokeWidth={1} className="mx-auto mb-6 text-wine-600" />
                <h3 className="font-display text-2xl mb-3">Thank you, {form.name.split(' ')[0]}.</h3>
                <p className="text-stone/55 leading-relaxed">
                  We&apos;ve received your message and will reply within 24 hours.<br />
                  For urgent queries, WhatsApp us directly.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Name *</label>
                    <input required value={form.name} onChange={e => up('name', e.target.value)} className="input-luxury" placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Email *</label>
                    <input required type="email" value={form.email} onChange={e => up('email', e.target.value)} className="input-luxury" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Phone</label>
                  <input value={form.phone} onChange={e => up('phone', e.target.value)} className="input-luxury" placeholder="+254 7XX XXX XXX" />
                </div>
                <div>
                  <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Subject *</label>
                  <input required value={form.subject} onChange={e => up('subject', e.target.value)} className="input-luxury" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => up('message', e.target.value)} className="input-luxury resize-none" placeholder="Tell us more…" />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full justify-center disabled:opacity-60">
                  <Send size={14} strokeWidth={1.5} />
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* FAQ */}
      <section className="bg-stone/[0.025] py-24">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div ref={faqRef} initial={{ opacity: 0, y: 24 }} animate={faqIn ? { opacity: 1, y: 0 } : {}} transition={{ ...T, duration: 0.8 }}
            className="text-center mb-14">
            <div className="eyebrow mb-4">Frequently Asked</div>
            <h2 className="font-display text-[clamp(2rem,3.5vw,3rem)]">Answers to common questions</h2>
          </motion.div>
          <div>{FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}</div>
        </div>
      </section>
    </div>
  );
}
