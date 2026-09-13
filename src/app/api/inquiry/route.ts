import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { inquiries } from '@/db/schema';
import { newId } from '@/lib/id';
import { notifyInquiryReceived, notifyAdminNewInquiry } from '@/lib/notifications';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  name:    z.string().min(2),
  email:   z.string().email(),
  phone:   z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const db = await getDb();
    const id = newId();
    const now = new Date();
    await db.insert(inquiries).values({
      id, name: data.name, email: data.email, phone: data.phone || null,
      subject: data.subject, message: data.message, createdAt: now, updatedAt: now,
    });

    notifyInquiryReceived(data.email, data.name).catch(console.error);
    notifyAdminNewInquiry(data.name, data.email, data.subject, data.message).catch(console.error);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
