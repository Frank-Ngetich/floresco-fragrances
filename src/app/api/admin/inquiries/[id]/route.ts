import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { inquiries } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canReplyInquiry } from '@/lib/permissions';
import { sendEmail } from '@/lib/notifications';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canReplyInquiry(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reply, status } = await req.json();
    const db = await getDb();
    const inquiry = await db.query.inquiries.findFirst({ where: eq(inquiries.id, params.id) });
    if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (status) update.status = status;
    if (reply?.trim()) {
      update.reply = reply.trim();
      update.repliedAt = new Date();
      update.status = 'replied';
    }

    await db.update(inquiries).set(update).where(eq(inquiries.id, params.id));

    if (reply?.trim()) {
      const html = `<p>Dear ${inquiry.name},</p><p>${reply.trim().replace(/\n/g, '<br>')}</p><p>Warmly,<br>The Floresco Team</p>`;
      await sendEmail(inquiry.email, `Re: ${inquiry.subject}`, html).catch(() => {});
    }

    const updated = await db.query.inquiries.findFirst({ where: eq(inquiries.id, params.id) });
    return NextResponse.json({ ...updated, _id: updated?.id });
  } catch (err: any) {
    console.error('[PATCH /api/admin/inquiries/:id]', err);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
