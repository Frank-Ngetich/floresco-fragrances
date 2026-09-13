import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { blogPosts } from '@/db/schema';
import { toIBlogPost } from '@/lib/blog';

export const revalidate = 300;

interface Post {
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const db = await getDb();
    const row = await db.query.blogPosts.findFirst({ where: and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)) });
    if (!row) return null;
    return toIBlogPost(row);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Article not found' };
  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <div className="page-enter">
      <div className="max-w-[740px] mx-auto px-6 py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase text-stone/40 hover:text-wine-600 transition-colors mb-12">
          <ArrowLeft size={13} /> The Journal
        </Link>

        {post.category && <div className="eyebrow mb-5">{post.category}</div>}
        <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] mb-6 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-5 mb-10 pb-10 border-b border-stone/10 text-sm text-stone/40">
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {new Date(post.publishedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          {post.author && <span>By {post.author}</span>}
        </div>

        {post.coverImage && (
          <div className="relative aspect-[16/9] mb-10 overflow-hidden">
            <Image src={post.coverImage} alt={post.title} fill sizes="740px" className="object-cover" priority />
          </div>
        )}

        <div className="space-y-6">
          {post.content.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="text-stone/75 leading-relaxed text-lg font-serif">{para}</p>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link href="/blog" className="btn-primary">More Articles</Link>
          <Link href="/shop" className="btn-outline">Shop the Collection</Link>
        </div>
      </div>
    </div>
  );
}
