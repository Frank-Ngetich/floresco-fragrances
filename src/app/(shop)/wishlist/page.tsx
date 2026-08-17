import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';
export const metadata: Metadata = { title: 'Wishlist' };
export default function WishlistPage() {
  return (
    <div className="page-enter min-h-[60vh] flex flex-col items-center justify-center px-6 py-24 text-center">
      <Heart size={48} strokeWidth={1} className="text-stone/15 mb-8" />
      <div className="eyebrow mb-4">Your Wishlist</div>
      <h1 className="font-display text-3xl mb-4">Nothing saved yet</h1>
      <p className="text-stone/50 mb-10 max-w-xs leading-relaxed">Heart any product while browsing and it appears here.</p>
      <Link href="/shop" className="btn-primary">Explore the Collection</Link>
    </div>
  );
}
