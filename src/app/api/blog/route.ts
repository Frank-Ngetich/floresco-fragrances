import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getDb, isTrue } from '@/db/client';
import { blogPosts } from '@/db/schema';
import { toIBlogPost } from '@/lib/blog';

export const runtime = 'nodejs';
// This GET reads no request-dependent API (no searchParams/cookies/headers),
// so Next.js's static-optimization heuristic silently prerenders it at
// build time — when the D1 binding isn't available (only exists at Workers
// runtime), permanently baking in an empty-fallback response that never
// re-executes. Force it dynamic so every request actually hits D1.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select({
      id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title, excerpt: blogPosts.excerpt,
      coverImage: blogPosts.coverImage, category: blogPosts.category, author: blogPosts.author,
      publishedAt: blogPosts.publishedAt,
    }).from(blogPosts).where(isTrue(blogPosts.published)).orderBy(desc(blogPosts.publishedAt));
    const posts = rows.map((r) => ({
      slug: r.slug, title: r.title, excerpt: r.excerpt, coverImage: r.coverImage || '',
      category: r.category || '', author: r.author || '', publishedAt: r.publishedAt,
    }));
    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error('[GET /api/blog]', err);
    return NextResponse.json({ posts: [] });
  }
}
