import type { Metadata } from 'next';
import { AboutClient } from '@/components/about/AboutClient';
export const metadata: Metadata = { title: 'Our Story', description: "Floresco Fragrances - Our story, values and promise." };
export default function AboutPage() { return <AboutClient />; }
