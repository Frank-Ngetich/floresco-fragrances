import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { auth } from '@/lib/auth';
import { canDeleteProduct, canAccessSection } from '@/lib/permissions';
import { invalidateProductsCache } from '@/lib/products-cache';
import { withTimeout } from '@/lib/with-timeout';
import type { UserRole } from '@/types';
export const runtime = 'nodejs';
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const p = await withTimeout((async () => {
      await connectDB();
      return await Product.findById(params.id).lean() || await Product.findOne({ slug: params.id }).lean();
    })(), 8000, 'product lookup');
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err: any) {
    console.error('[GET /api/products/[id]]', err.message);
    return NextResponse.json({ error: err.message || 'Failed to load product' }, { status: 503 });
  }
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'products')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const p = await Product.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    invalidateProductsCache();
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
    invalidateProductsCache();
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
