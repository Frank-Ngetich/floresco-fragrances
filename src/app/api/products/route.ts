import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { PRODUCTS_DATA } from '@/lib/products-data';
import { auth } from '@/lib/auth';
import { canAccessSection } from '@/lib/permissions';
import { getProductsCache, isProductsCacheFresh, setProductsCache, invalidateProductsCache } from '@/lib/products-cache';
import { withTimeout } from '@/lib/with-timeout';
import type { UserRole } from '@/types';

export const runtime = 'nodejs';

async function getBaseProducts(): Promise<{ list: any[]; source: string }> {
  if (isProductsCacheFresh()) {
    return { list: getProductsCache()!.products, source: 'cache' };
  }

  try {
    const products = await withTimeout((async () => {
      await connectDB();
      return Product.find({ status: 'active' }).sort({ createdAt: -1 }).limit(200).lean();
    })(), 8000, 'public products query');
    if (products.length > 0) {
      setProductsCache(products);
      return { list: products, source: 'db' };
    }
  } catch (err: any) {
    console.error('[GET /api/products] DB fetch failed:', err.message);
  }

  /* DB is empty or unreachable this request — prefer real (if slightly
     stale) inventory over generic demo products whenever we have any. */
  const stale = getProductsCache();
  if (stale) {
    return { list: stale.products, source: 'stale-cache' };
  }
  return {
    list: PRODUCTS_DATA.map((p, i) => ({ ...p, _id: `static-${i}`, status: 'active' })),
    source: 'static-fallback',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cat      = searchParams.get('category') || searchParams.get('cat') || '';
  const q        = searchParams.get('q') || '';
  const status   = searchParams.get('status') || 'active';
  const limit    = Math.min(200, Number(searchParams.get('limit') || 50));
  const featured = searchParams.get('featured');

  /* The admin catalog needs drafts/archived items too, and correctness
     (seeing a just-created product immediately) matters more there than
     resilience — so it bypasses the public active-only cache entirely and
     queries live. The admin UI already has its own client-side fallback. */
  if (status !== 'active') {
    try {
      const products = await withTimeout((async () => {
        await connectDB();
        const query: any = {};
        if (status !== 'all') query.status = status;
        if (cat) query.category = cat;
        return Product.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      })(), 8000, 'admin products query');
      return NextResponse.json({ products, total: products.length, source: 'db' });
    } catch (err: any) {
      console.error('[GET /api/products] admin query failed:', err.message);
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
  }

  const { list: base, source } = await getBaseProducts();

  let list = base;
  if (cat)      list = list.filter((p: any) => p.category === cat);
  if (featured) list = list.filter((p: any) => p.featured);
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter((p: any) =>
      [p.name, p.brand, p.tagline, ...(p.scentNotes?.top || []), ...(p.scentNotes?.heart || []), ...(p.scentNotes?.base || [])]
        .join(' ').toLowerCase().includes(ql)
    );
  }
  list = list.slice(0, limit);

  return NextResponse.json({ products: list, total: list.length, source });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: UserRole })?.role;
    if (!canAccessSection(role, 'products')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }
    const existing = await Product.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }
    const product = await Product.create({ ...body, status: body.status || 'draft' });
    invalidateProductsCache();
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/products]', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
