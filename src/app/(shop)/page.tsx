import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { HomeMarquee, HomeCategories, HomeFeatured, LifestyleSection, HomeVisit } from '@/components/home/HomeSections';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { PRODUCTS_DATA } from '@/lib/products-data';
import type { IProduct } from '@/types';

export const metadata: Metadata = {
  title: 'Floresco — Luxury Fragrances & Lifestyle | Eldoret, Kenya',
};

// Cache the rendered homepage for 5 minutes instead of re-querying MongoDB
// on every single visit — featured products and category photos don't
// change minute to minute, and this is the most-visited page on the site.
export const revalidate = 300;

const CATEGORY_IDS = ['women', 'men', 'arabian-oud', 'unisex', 'gift-sets'];

async function getCategoryImages() {
  try {
    await connectDB();
    const entries = await Promise.all(
      CATEGORY_IDS.map(async (id) => {
        const products = await Product.find({
          category: id,
          status: 'active',
          images: { $elemMatch: { url: { $nin: ['', null] } } },
        })
          .sort({ featured: -1, createdAt: -1 })
          .limit(1)
          .lean();
        const images = (products[0]?.images as { url: string; isPrimary?: boolean }[] | undefined)
          ?.filter((i) => i.url);
        const img = images?.find((i) => i.isPrimary) || images?.[0];
        return [id, img?.url || null] as const;
      })
    );
    return Object.fromEntries(entries) as Record<string, string | null>;
  } catch {
    return {};
  }
}

async function getFeaturedProducts(): Promise<IProduct[]> {
  try {
    await connectDB();
    const products = await Product.find({ featured: true, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    if (products.length > 0) return products as unknown as IProduct[];
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
  // Sequential, not Promise.all: both helpers call connectDB() independently,
  // and on Cloudflare Workers two concurrent mongoose.connect() attempts on
  // a cold connection race each other and can leave the connection wedged.
  const categoryImages   = await getCategoryImages();
  const featuredProducts = await getFeaturedProducts();
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
