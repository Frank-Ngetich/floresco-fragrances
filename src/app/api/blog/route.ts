import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { blogPosts } from '@/db/schema';
import { toIBlogPost } from '@/lib/blog';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select({
      id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title, excerpt: blogPosts.excerpt,
      coverImage: blogPosts.coverImage, category: blogPosts.category, author: blogPosts.author,
      publishedAt: blogPosts.publishedAt,
    }).from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt));
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
