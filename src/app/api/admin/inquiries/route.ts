import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/models';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'inquiries')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const status = req.nextUrl.searchParams.get('status');
    const query: any = {};
    if (status && status !== 'all') query.status = status;

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 }).limit(200).lean();
    const newCount = await Inquiry.countDocuments({ status: 'new' });

    return NextResponse.json({ inquiries, newCount });
  } catch (err: any) {
    console.error('[GET /api/admin/inquiries]', err);
    return NextResponse.json({ error: 'Failed to load inquiries' }, { status: 500 });
  }
}
