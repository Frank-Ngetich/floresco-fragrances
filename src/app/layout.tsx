import type { Metadata } from 'next';
import { Inter, Fraunces, Cormorant_Garamond } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Floresco — Luxury Fragrances & Lifestyle | Eldoret, Kenya',
    template: '%s | Floresco Fragrances',
  },
  description:
    'Floresco is a luxury fragrance and lifestyle house based in Eldoret, Kenya. Discover original designer perfumes, curated accessories, and the art of living beautifully. Shop online with countrywide delivery or visit us at Kapsoya Business Park.',
  keywords: [
    'luxury perfume Eldoret', 'original fragrances Kenya', 'designer perfume shop Eldoret',
    'Arabian oud Kenya', 'luxury lifestyle Kenya', 'buy perfume Eldoret',
    'countrywide perfume delivery Kenya', 'Floresco Fragrances',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'Floresco Fragrances',
    title: 'Floresco — Luxury Fragrances & Lifestyle | Eldoret, Kenya',
    description: 'Original luxury perfumes and lifestyle accessories. Based in Eldoret, delivering across Kenya.',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
