import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SiteSettings } from '@/models';
import { auth } from '@/lib/auth';
import { canWriteSettings, canWriteHero } from '@/lib/permissions';
import type { UserRole } from '@/types';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const key = req.nextUrl.searchParams.get('key');
    if (!key) { const all = await SiteSettings.find({}).lean(); return NextResponse.json(all); }
    const s = await SiteSettings.findOne({ key }).lean();
    return NextResponse.json(s || { key, value: null });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    const allowed = key === 'settings' ? canWriteSettings(role) : key === 'hero' ? canWriteHero(role) : role != null;
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden — your role cannot change this.' }, { status: 403 });
    }

    await connectDB();
    const s = await SiteSettings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
    return NextResponse.json(s);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
