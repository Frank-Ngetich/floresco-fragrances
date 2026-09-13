import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { inquiries } from '@/db/schema';
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

    const db = await getDb();
    const status = req.nextUrl.searchParams.get('status');
    const where = status && status !== 'all' ? eq(inquiries.status, status as any) : undefined;

    const [rows, [{ value: newCount }]] = await Promise.all([
      db.select().from(inquiries).where(where).orderBy(desc(inquiries.createdAt)).limit(200),
      db.select({ value: count() }).from(inquiries).where(eq(inquiries.status, 'new')),
    ]);

    const list = rows.map((r) => ({ ...r, _id: r.id }));
    return NextResponse.json({ inquiries: list, newCount });
  } catch (err: any) {
    console.error('[GET /api/admin/inquiries]', err);
    return NextResponse.json({ error: 'Failed to load inquiries' }, { status: 500 });
  }
}
