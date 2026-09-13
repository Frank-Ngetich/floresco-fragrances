import type { Metadata } from 'next';
import { and, eq, desc } from 'drizzle-orm';
import { Hero } from '@/components/home/Hero';
import { HomeMarquee, HomeCategories, HomeFeatured, LifestyleSection, HomeVisit } from '@/components/home/HomeSections';
import { getDb, isTrue, type Db } from '@/db/client';
import { products } from '@/db/schema';
import { toIProduct } from '@/lib/products';
import { PRODUCTS_DATA } from '@/lib/products-data';
import type { IProduct } from '@/types';

export const metadata: Metadata = {
  title: 'Floresco — Luxury Fragrances & Lifestyle | Eldoret, Kenya',
};

// Cache the rendered homepage for 5 minutes instead of re-querying on every
// single visit — featured products and category photos don't change
// minute to minute, and this is the most-visited page on the site.
export const revalidate = 300;

const CATEGORY_IDS = ['women', 'men', 'arabian-oud', 'unisex', 'gift-sets'];

async function getCategoryImages(db: Db) {
  try {
    const entries = await Promise.all(
      CATEGORY_IDS.map(async (id) => {
        const rows = await db.query.products.findMany({
          where: and(eq(products.category, id as any), eq(products.status, 'active')),
          orderBy: [desc(products.featured), desc(products.createdAt)],
          with: { images: true },
          limit: 20,
        });
        for (const p of rows) {
          const valid = (p.images || []).filter((i) => i.url);
          if (valid.length) {
            const img = valid.find((i) => i.isPrimary) || valid[0];
            return [id, img.url as string] as const;
          }
        }
        return [id, null] as const;
      })
    );
    return Object.fromEntries(entries) as Record<string, string | null>;
  } catch {
    return {};
  }
}

async function getFeaturedProducts(db: Db): Promise<IProduct[]> {
  try {
    const rows = await db.query.products.findMany({
      where: and(isTrue(products.featured), eq(products.status, 'active')),
      orderBy: desc(products.createdAt),
      with: { sizes: true, images: true },
      limit: 4,
    });
    if (rows.length > 0) return rows.map(toIProduct);
  } catch {
    /* fall through to static fallback below */
  }
  return PRODUCTS_DATA.filter((p) => p.featured).slice(0, 4).map((p, i) => ({
    ...p,
    _id: `f-${i}`,
    status: 'active',
    sizes: p.sizes.map((s) => ({ ...s })),
    images: p.images.map((img) => ({ ...img })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })) as IProduct[];
}

export default async function HomePage() {
  const db = await getDb();
  // Independent queries, no shared-connection contention on D1 — safe to
  // run concurrently (unlike the old Mongo driver on Workers).
  const [categoryImages, featuredProducts] = await Promise.all([
    getCategoryImages(db),
    getFeaturedProducts(db),
  ]);
  return (
    <>
      <Hero />
      <HomeMarquee />
      <HomeCategories images={categoryImages} />
      <HomeFeatured products={featuredProducts} />
      <LifestyleSection images={categoryImages} />
      <HomeVisit />
    </>
  );
}
