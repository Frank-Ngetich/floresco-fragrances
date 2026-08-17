import type { Metadata } from 'next';
import { CheckoutClient } from '@/components/shop/CheckoutClient';
export const metadata: Metadata = { title: 'Checkout' };
export default function CheckoutPage() { return <CheckoutClient />; }
