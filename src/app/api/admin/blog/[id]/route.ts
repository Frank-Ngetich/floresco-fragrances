import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { blogPosts } from '@/db/schema';
import { toIBlogPost } from '@/lib/blog';
import { auth } from '@/lib/auth';
import { canAccessSection, canWriteBlog } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'blog')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const row = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, params.id) });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toIBlogPost(row));
  } catch {
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canWriteBlog(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const db = await getDb();
    const existing = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, params.id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: Record<string, unknown> = {
      title:      body.title?.trim() ?? existing.title,
      excerpt:    body.excerpt?.trim() ?? existing.excerpt,
      content:    body.content?.trim() ?? existing.content,
      coverImage: body.coverImage ?? existing.coverImage,
      category:   body.category ?? existing.category,
      author:     body.author ?? existing.author,
      metaTitle:       body.seo?.metaTitle ?? existing.metaTitle,
      metaDescription: body.seo?.metaDescription ?? existing.metaDescription,
      updatedAt: new Date(),
    };
    if (typeof body.slug === 'string' && body.slug.trim()) update.slug = body.slug.trim().toLowerCase();
    if (typeof body.published === 'boolean') {
      update.published = body.published;
      if (body.published && !existing.published) update.publishedAt = new Date();
    }

    await db.update(blogPosts).set(update).where(eq(blogPosts.id, params.id));
    const updated = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, params.id) });
    return NextResponse.json(toIBlogPost(updated));
  } catch (err: any) {
    console.error('[PATCH /api/admin/blog/:id]', err);
    return NextResponse.json({ error: err.message || 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canWriteBlog(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    await db.delete(blogPosts).where(eq(blogPosts.id, params.id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
