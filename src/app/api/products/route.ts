import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { products, productSizes, productImages } from '@/db/schema';
import { toIProduct } from '@/lib/products';
import { newId } from '@/lib/id';
import { PRODUCTS_DATA } from '@/lib/products-data';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cat      = searchParams.get('category') || searchParams.get('cat') || '';
  const q        = searchParams.get('q') || '';
  const status   = searchParams.get('status') || 'active';
  const limit    = Math.min(200, Number(searchParams.get('limit') || 50));
  const featured = searchParams.get('featured');

  try {
    const db = await getDb();
    const conditions = [];
    if (status !== 'all') conditions.push(eq(products.status, status as 'draft' | 'active' | 'archived'));
    if (cat) conditions.push(eq(products.category, cat as any));

    const rows = await db.query.products.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: desc(products.createdAt),
      with: { sizes: true, images: true },
      limit: 200, // fetch generously, then filter q/featured in JS below before the real limit
    });

    let list = rows.map(toIProduct);
    if (featured) list = list.filter((p) => p.featured);
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter((p) =>
        [p.name, p.brand, p.tagline, ...p.scentNotes.top, ...p.scentNotes.heart, ...p.scentNotes.base]
          .join(' ').toLowerCase().includes(ql)
      );
    }
    list = list.slice(0, limit);

    return NextResponse.json({ products: list, total: list.length, source: 'db' });
  } catch (err: any) {
    console.error('[GET /api/products]', err.message);
    /* DB genuinely unreachable — never show an empty shop. Static fallback
       only, no admin escape hatch here (status !== 'active' callers are the
       admin catalog, which needs real data, not demo products). */
    if (status === 'active') {
      let list = PRODUCTS_DATA.map((p, i) => ({ ...p, _id: `static-${i}`, status: 'active' as const }));
      if (cat) list = list.filter((p) => p.category === cat);
      if (featured) list = list.filter((p) => p.featured);
      return NextResponse.json({ products: list.slice(0, limit), total: list.length, source: 'static-fallback' });
    }
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'products')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    const db = await getDb();
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, body.slug)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }

    const id = newId();
    const now = new Date();
    const sizes: any[] = body.sizes || [];
    const images: any[] = body.images || [];

    await db.batch([
      db.insert(products).values({
        id,
        slug: body.slug,
        name: body.name,
        brand: body.brand,
        category: body.category,
        tagline: body.tagline,
        description: body.description,
        scentNotesTop: body.scentNotes?.top || [],
        scentNotesHeart: body.scentNotes?.heart || [],
        scentNotesBase: body.scentNotes?.base || [],
        color1: body.color1 || '#722F37',
        color2: body.color2 || '#8B3A44',
        featured: !!body.featured,
        badge: body.badge || null,
        rating: body.rating || 0,
        reviewCount: body.reviewCount || 0,
        status: body.status || 'draft',
        metaTitle: body.seo?.metaTitle || null,
        metaDescription: body.seo?.metaDescription || null,
        createdAt: now,
        updatedAt: now,
      }),
      ...sizes.map((s) => db.insert(productSizes).values({
        productId: id, size: s.size || null, price: s.price ?? null, stock: s.stock ?? 0, sku: s.sku || null,
      })),
      ...images.map((img) => db.insert(productImages).values({
        productId: id, url: img.url || null, alt: img.alt || null, isPrimary: !!img.isPrimary,
      })),
    ] as any);

    const created = await db.query.products.findFirst({ where: eq(products.id, id), with: { sizes: true, images: true } });
    return NextResponse.json(toIProduct(created), { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/products]', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
