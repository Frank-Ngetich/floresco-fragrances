import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { PRODUCTS_DATA } from '@/lib/products-data';
import type { IProduct } from '@/types';

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
    await connectDB();
    const doc = await Product.findOne({ slug, status: 'active' }).lean();
    if (doc) return JSON.parse(JSON.stringify(doc));
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
    await connectDB();
    const docs = await Product.find({ category, slug: { $ne: excludeSlug }, status: 'active' }).limit(4).lean();
    if (docs.length) return JSON.parse(JSON.stringify(docs));
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
