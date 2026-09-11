import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    const posts = await BlogPost.find({ published: true })
      .sort({ publishedAt: -1 })
      .select('slug title excerpt coverImage category author publishedAt')
      .lean();
    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error('[GET /api/blog]', err);
    return NextResponse.json({ posts: [] });
  }
}
