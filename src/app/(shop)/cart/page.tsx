import type { Metadata } from 'next';
import { CartClient } from '@/components/shop/CartClient';
export const metadata: Metadata = { title: 'Your Bag' };
export default function CartPage() { return <CartClient />; }
