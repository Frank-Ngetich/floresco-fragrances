import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { siteSettings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canAccessSection, canWriteSettings } from '@/lib/permissions';
import type { UserRole } from '@/types';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const key = req.nextUrl.searchParams.get('key');
    if (!key) {
      const all = await db.select().from(siteSettings);
      return NextResponse.json(all);
    }
    const [s] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return NextResponse.json(s || { key, value: null });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canWriteSettings(role)) {
      return NextResponse.json({ error: 'Forbidden — your role cannot change this.' }, { status: 403 });
    }

    const db = await getDb();
    const now = new Date();
    await db.insert(siteSettings).values({ key, value, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: now } });
    const [s] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return NextResponse.json(s);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
