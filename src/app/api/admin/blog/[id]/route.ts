import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
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

    await connectDB();
    const post = await BlogPost.findById(params.id).lean();
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
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
    await connectDB();

    const existing = await BlogPost.findById(params.id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: any = {
      title:      body.title?.trim() ?? existing.title,
      excerpt:    body.excerpt?.trim() ?? existing.excerpt,
      content:    body.content?.trim() ?? existing.content,
      coverImage: body.coverImage ?? existing.coverImage,
      category:   body.category ?? existing.category,
      author:     body.author ?? existing.author,
      seo: {
        metaTitle:       body.seo?.metaTitle ?? existing.seo?.metaTitle,
        metaDescription: body.seo?.metaDescription ?? existing.seo?.metaDescription,
      },
    };
    if (typeof body.slug === 'string' && body.slug.trim()) update.slug = body.slug.trim().toLowerCase();
    if (typeof body.published === 'boolean') {
      update.published = body.published;
      if (body.published && !existing.published) update.publishedAt = new Date();
    }

    const post = await BlogPost.findByIdAndUpdate(params.id, { $set: update }, { new: true });
    return NextResponse.json(post);
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

    await connectDB();
    await BlogPost.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
