import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { PRODUCTS_DATA } from '@/lib/products-data';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const cat     = searchParams.get('category') || searchParams.get('cat') || '';
    const q       = searchParams.get('q') || '';
    const status  = searchParams.get('status') || 'active';
    const limit   = Math.min(100, Number(searchParams.get('limit') || 50));
    const featured = searchParams.get('featured');

    await connectDB();

    const query: any = {};
    if (status !== 'all') query.status = status;
    if (cat)     query.category = cat;
    if (featured) query.featured = true;
    if (q) {
      query.$or = [
        { name:     { $regex: q, $options: 'i' } },
        { brand:    { $regex: q, $options: 'i' } },
        { tagline:  { $regex: q, $options: 'i' } },
        { 'scentNotes.top':   { $elemMatch: { $regex: q, $options: 'i' } } },
        { 'scentNotes.heart': { $elemMatch: { $regex: q, $options: 'i' } } },
        { 'scentNotes.base':  { $elemMatch: { $regex: q, $options: 'i' } } },
      ];
    }

    let products = await Product.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    /* Fallback to static data if DB is empty (dev / first run) */
    if (products.length === 0) {
      let list = PRODUCTS_DATA.map((p, i) => ({ ...p, _id: `static-${i}`, status: 'active' }));
      if (cat)      list = list.filter(p => p.category === cat);
      if (featured) list = list.filter(p => p.featured);
      if (q) {
        const ql = q.toLowerCase();
        list = list.filter(p =>
          [p.name, p.brand, p.tagline, ...p.scentNotes.top, ...p.scentNotes.heart, ...p.scentNotes.base]
            .join(' ').toLowerCase().includes(ql)
        );
      }
      return NextResponse.json({ products: list, total: list.length, source: 'static' });
    }

    return NextResponse.json({ products, total: products.length, source: 'db' });
  } catch (err: any) {
    console.error('[GET /api/products]', err);
    /* Even on error, return static data so the shop never shows empty */
    return NextResponse.json({ products: PRODUCTS_DATA.map((p, i) => ({ ...p, _id: `static-${i}` })), total: PRODUCTS_DATA.length, source: 'static-fallback' });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/products]', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
