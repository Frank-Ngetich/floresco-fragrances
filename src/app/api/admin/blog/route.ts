import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { blogPosts } from '@/db/schema';
import { toIBlogPost } from '@/lib/blog';
import { newId } from '@/lib/id';
import { auth } from '@/lib/auth';
import { canAccessSection, canWriteBlog } from '@/lib/permissions';
import { slugify } from '@/lib/utils';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'blog')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    return NextResponse.json({ posts: rows.map(toIBlogPost) });
  } catch (err: any) {
    console.error('[GET /api/admin/blog]', err);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canWriteBlog(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title?.trim() || !body.excerpt?.trim() || !body.content?.trim()) {
      return NextResponse.json({ error: 'Title, excerpt and content are required.' }, { status: 400 });
    }

    const db = await getDb();
    const slug = (body.slug?.trim() || slugify(body.title)).toLowerCase();
    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
    }

    const id = newId();
    const now = new Date();
    const published = !!body.published;
    await db.insert(blogPosts).values({
      id, slug,
      title: body.title.trim(),
      excerpt: body.excerpt.trim(),
      content: body.content.trim(),
      coverImage: body.coverImage || null,
      category: body.category || null,
      author: body.author || session?.user?.name || 'Floresco Team',
      published,
      publishedAt: published ? now : null,
      metaTitle: body.seo?.metaTitle || null,
      metaDescription: body.seo?.metaDescription || null,
      createdAt: now,
      updatedAt: now,
    });

    const created = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, id) });
    return NextResponse.json(toIBlogPost(created), { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/blog]', err);
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}
