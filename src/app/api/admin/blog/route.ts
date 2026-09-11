import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
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

    await connectDB();
    const posts = await BlogPost.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ posts });
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

    await connectDB();
    const slug = (body.slug?.trim() || slugify(body.title)).toLowerCase();
    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
    }

    const post = await BlogPost.create({
      slug,
      title:       body.title.trim(),
      excerpt:     body.excerpt.trim(),
      content:     body.content.trim(),
      coverImage:  body.coverImage || '',
      category:    body.category || '',
      author:      body.author || session?.user?.name || 'Floresco Team',
      published:   !!body.published,
      publishedAt: body.published ? new Date() : undefined,
      seo: {
        metaTitle:       body.seo?.metaTitle || '',
        metaDescription: body.seo?.metaDescription || '',
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/blog]', err);
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}
