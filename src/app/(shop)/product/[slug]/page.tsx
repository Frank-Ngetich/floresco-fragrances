import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { and, eq, ne } from 'drizzle-orm';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { getDb } from '@/db/client';
import { products } from '@/db/schema';
import { toIProduct } from '@/lib/products';
import { PRODUCTS_DATA } from '@/lib/products-data';
import type { IProduct } from '@/types';

// Shorter cache window than the homepage since price/stock live here —
// still avoids hitting the database on every single page view.
export const revalidate = 60;

interface Props { params: { slug: string } }

function fromStatic(slug: string): IProduct | undefined {
  const p = PRODUCTS_DATA.find((x) => x.slug === slug);
  if (!p) return undefined;
  return {
    ...p, _id: `static-${slug}`, status: 'active',
    sizes: p.sizes.map((s) => ({ ...s })),
    images: p.images.map((img) => ({ ...img })),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

async function getProduct(slug: string): Promise<IProduct | undefined> {
  try {
    const db = await getDb();
    const row = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.status, 'active')),
      with: { sizes: true, images: true },
    });
    if (row) return toIProduct(row);
  } catch {}
  return fromStatic(slug);
}

function relatedFromStatic(category: string, excludeSlug: string): IProduct[] {
  return PRODUCTS_DATA
    .filter((p) => p.category === category && p.slug !== excludeSlug)
    .slice(0, 4)
    .map((p, i) => ({
      ...p, _id: `rel-${i}`, status: 'active' as const,
      sizes: p.sizes.map((s) => ({ ...s })),
      images: p.images.map((img) => ({ ...img })),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
}

async function getRelated(category: string, excludeSlug: string): Promise<IProduct[]> {
  try {
    const db = await getDb();
    const rows = await db.query.products.findMany({
      where: and(eq(products.category, category as any), ne(products.slug, excludeSlug), eq(products.status, 'active')),
      with: { sizes: true, images: true },
      limit: 4,
    });
    if (rows.length) return rows.map(toIProduct);
  } catch {}
  return relatedFromStatic(category, excludeSlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.seo.metaTitle || product.name,
    description: product.seo.metaDescription || product.tagline,
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelated(product.category, product.slug);

  return <ProductDetailClient product={product} related={related} />;
}
