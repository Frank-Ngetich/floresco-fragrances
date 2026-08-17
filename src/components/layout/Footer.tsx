import Link from 'next/link';
import { Instagram, Facebook } from 'lucide-react';

const SHOP_LINKS = [
  { href: '/shop?cat=women',      label: 'Women' },
  { href: '/shop?cat=men',        label: 'Men' },
  { href: '/shop?cat=arabian-oud',label: 'Arabian & Oud' },
  { href: '/shop?cat=unisex',     label: 'Unisex' },
  { href: '/shop?cat=gift-sets',  label: 'Gift Sets' },
];

const COMPANY_LINKS = [
  { href: '/about',   label: 'Our Story' },
  { href: '/blog',    label: 'The Journal' },
  { href: '/contact', label: 'Visit the Shop' },
  { href: '/contact', label: 'Contact Us' },
];

const CUSTOMER_LINKS = [
  { href: '/account',       label: 'My Account' },
  { href: '/cart',          label: 'Shopping Bag' },
  { href: '/contact#faq',   label: 'FAQ' },
  { href: '/contact#ship',  label: 'Shipping & Returns' },
  { href: '/contact#track', label: 'Track Your Order' },
];

export function Footer() {
  return (
    <footer className="bg-stone text-cream-200 mt-24">
      {/* Newsletter bar */}
      <div className="border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="eyebrow text-burgundy-300 mb-3">The Journal</p>
            <h3 className="font-display text-2xl text-cream-100 mb-2">First to know, first to have.</h3>
            <p className="text-cream-500 text-sm">New arrivals, private previews and fragrance stories — occasionally.</p>
          </div>
          <form className="flex gap-0 border-b border-cream-600 pb-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-transparent text-cream-200 placeholder:text-cream-600 text-sm focus:outline-none py-1"
            />
            <button type="submit" className="text-[0.68rem] tracking-[0.2em] uppercase text-burgundy-300 hover:text-burgundy-200 transition-colors font-medium whitespace-nowrap">
              Subscribe →
            </button>
          </form>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-2xl tracking-[0.3em] text-cream-100 mb-6">
              FLORES<span className="text-burgundy-400">CO</span>
            </div>
            <p className="text-cream-500 text-sm leading-relaxed mb-6">
              A luxury fragrance and lifestyle house based in Eldoret, Kenya. 
              Original perfumes, honest prices, beautiful living.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/florescofragrances" target="_blank" rel="noopener noreferrer" className="text-cream-500 hover:text-cream-200 transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="https://facebook.com/florescofragrances" target="_blank" rel="noopener noreferrer" className="text-cream-500 hover:text-cream-200 transition-colors">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h5 className="text-[0.68rem] tracking-[0.25em] uppercase text-burgundy-400 mb-5 font-medium">Shop</h5>
            <ul className="space-y-3">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-cream-500 text-sm hover:text-cream-100 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-[0.68rem] tracking-[0.25em] uppercase text-burgundy-400 mb-5 font-medium">House</h5>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-cream-500 text-sm hover:text-cream-100 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h5 className="text-[0.68rem] tracking-[0.25em] uppercase text-burgundy-400 mb-5 font-medium">Support</h5>
            <ul className="space-y-3">
              {CUSTOMER_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-cream-500 text-sm hover:text-cream-100 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Base */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream-600 text-xs tracking-wide">
            © 2026 Floresco Fragrances & Accessories · Kapsoya Business Park, Eldoret, Kenya
          </p>
          <div className="flex items-center gap-3">
            {['M-Pesa', 'Visa', 'Mastercard', 'Cash on Delivery'].map((p) => (
              <span key={p} className="border border-white/15 text-cream-600 text-[0.6rem] tracking-wider uppercase px-2.5 py-1">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
