import type { Metadata } from 'next';
import { BlogClient } from '@/components/blog/BlogClient';
export const metadata: Metadata = { title: 'The Journal', description: 'Fragrance stories and guides from the Floresco house.' };
export default function BlogPage() { return <BlogClient />; }
