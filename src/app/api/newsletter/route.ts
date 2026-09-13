import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { subscribers } from '@/db/schema';
import { newId } from '@/lib/id';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    await db.insert(subscribers)
      .values({ id: newId(), email: email.trim().toLowerCase(), createdAt: now, updatedAt: now })
      .onConflictDoNothing({ target: subscribers.email });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/newsletter]', err);
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
  }
}
