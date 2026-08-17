import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';
export const metadata: Metadata = {
  title: 'Shop All Fragrances',
  description: 'Browse 100% authentic luxury perfumes. Delivered across all 47 counties.',
};
export default function ShopPage({ searchParams }: { searchParams: { cat?: string; q?: string } }) {
  return <ShopClient initialCat={searchParams.cat || ''} initialQ={searchParams.q || ''} />;
}
