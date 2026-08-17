import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/models';
import { notifyInquiryReceived } from '@/lib/notifications';
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

    await connectDB();
    const inquiry = await Inquiry.create(data);

    await notifyInquiryReceived(data.email, data.name).catch(console.error);

    return NextResponse.json({ success: true, id: inquiry._id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
