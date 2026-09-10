import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/models';
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

    await connectDB();
    const { reply, status } = await req.json();

    const inquiry = await Inquiry.findById(params.id);
    if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: any = {};
    if (status) update.status = status;
    if (reply?.trim()) {
      update.reply = reply.trim();
      update.repliedAt = new Date();
      update.status = 'replied';
    }

    const updated = await Inquiry.findByIdAndUpdate(params.id, { $set: update }, { new: true });

    if (reply?.trim()) {
      const html = `<p>Dear ${inquiry.name},</p><p>${reply.trim().replace(/\n/g, '<br>')}</p><p>Warmly,<br>The Floresco Team</p>`;
      await sendEmail(inquiry.email, `Re: ${inquiry.subject}`, html).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PATCH /api/admin/inquiries/:id]', err);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
