import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  return { title };
}
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const title = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  return (
    <div className="page-enter">
      <div className="max-w-[740px] mx-auto px-6 py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase text-stone/40 hover:text-wine-600 transition-colors mb-12">
          <ArrowLeft size={13} /> The Journal
        </Link>
        <div className="eyebrow mb-5">Article</div>
        <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] mb-6 leading-tight">{title}</h1>
        <div className="flex items-center gap-5 mb-10 pb-10 border-b border-stone/10 text-sm text-stone/40">
          <span className="flex items-center gap-1.5"><Calendar size={13} /> July 2026</span>
          <span className="flex items-center gap-1.5"><Clock size={13} /> 5 min read</span>
        </div>
        <div>
          <p className="font-serif text-xl text-stone/65 leading-relaxed italic mb-8">
            This article is coming soon. Subscribe to The Journal to be notified when it is published.
          </p>
          <p className="text-stone/55 leading-relaxed">
            We are constantly adding new fragrance guides, brand stories and lifestyle content.
          </p>
        </div>
        <div className="mt-14 flex flex-wrap gap-4">
          <Link href="/blog" className="btn-primary">More Articles</Link>
          <Link href="/shop" className="btn-outline">Shop the Collection</Link>
        </div>
      </div>
    </div>
  );
}
