import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { products, productSizes, productImages } from '@/db/schema';
import { toIProduct } from '@/lib/products';
import { auth } from '@/lib/auth';
import { canDeleteProduct, canAccessSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const row = await db.query.products.findFirst({ where: eq(products.id, params.id), with: { sizes: true, images: true } })
      || await db.query.products.findFirst({ where: eq(products.slug, params.id), with: { sizes: true, images: true } });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toIProduct(row));
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

    const body = await req.json();
    const db = await getDb();
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, params.id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const fields: Record<string, unknown> = { updatedAt: new Date() };
    if (body.slug !== undefined)        fields.slug = body.slug;
    if (body.name !== undefined)        fields.name = body.name;
    if (body.brand !== undefined)       fields.brand = body.brand;
    if (body.category !== undefined)    fields.category = body.category;
    if (body.tagline !== undefined)     fields.tagline = body.tagline;
    if (body.description !== undefined) fields.description = body.description;
    if (body.scentNotes !== undefined) {
      fields.scentNotesTop = body.scentNotes.top || [];
      fields.scentNotesHeart = body.scentNotes.heart || [];
      fields.scentNotesBase = body.scentNotes.base || [];
    }
    if (body.color1 !== undefined)      fields.color1 = body.color1;
    if (body.color2 !== undefined)      fields.color2 = body.color2;
    if (body.featured !== undefined)    fields.featured = !!body.featured;
    if (body.badge !== undefined)       fields.badge = body.badge || null;
    if (body.rating !== undefined)      fields.rating = body.rating;
    if (body.reviewCount !== undefined) fields.reviewCount = body.reviewCount;
    if (body.status !== undefined)      fields.status = body.status;
    if (body.seo !== undefined) {
      fields.metaTitle = body.seo.metaTitle || null;
      fields.metaDescription = body.seo.metaDescription || null;
    }

    const statements: any[] = [db.update(products).set(fields).where(eq(products.id, params.id))];
    if (body.sizes !== undefined) {
      statements.push(db.delete(productSizes).where(eq(productSizes.productId, params.id)));
      for (const s of body.sizes as any[]) {
        statements.push(db.insert(productSizes).values({
          productId: params.id, size: s.size || null, price: s.price ?? null, stock: s.stock ?? 0, sku: s.sku || null,
        }));
      }
    }
    if (body.images !== undefined) {
      statements.push(db.delete(productImages).where(eq(productImages.productId, params.id)));
      for (const img of body.images as any[]) {
        statements.push(db.insert(productImages).values({
          productId: params.id, url: img.url || null, alt: img.alt || null, isPrimary: !!img.isPrimary,
        }));
      }
    }
    await db.batch(statements as any);

    const updated = await db.query.products.findFirst({ where: eq(products.id, params.id), with: { sizes: true, images: true } });
    return NextResponse.json(toIProduct(updated));
  } catch (err: any) {
    console.error('[PATCH /api/products/[id]]', err.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canDeleteProduct(role)) {
      return NextResponse.json({ error: 'Forbidden — only managers and owners can delete products.' }, { status: 403 });
    }
    const db = await getDb();
    // Explicit child-row deletes rather than relying on ON DELETE CASCADE —
    // D1's foreign-key enforcement default isn't worth depending on here.
    await db.batch([
      db.delete(productSizes).where(eq(productSizes.productId, params.id)),
      db.delete(productImages).where(eq(productImages.productId, params.id)),
      db.delete(products).where(eq(products.id, params.id)),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/products/[id]]', err.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
