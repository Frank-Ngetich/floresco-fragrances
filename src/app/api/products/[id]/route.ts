import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { auth } from '@/lib/auth';
import { canDeleteProduct } from '@/lib/permissions';
import type { UserRole } from '@/types';
export const runtime = 'nodejs';
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const p = await Product.findById(params.id).lean() || await Product.findOne({ slug: params.id }).lean();
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const p = await Product.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canDeleteProduct(role)) {
      return NextResponse.json({ error: 'Forbidden — only managers and owners can delete products.' }, { status: 403 });
    }
    await connectDB();
    await Product.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
