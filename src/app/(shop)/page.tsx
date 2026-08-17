import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { HomeMarquee, HomeCategories, HomeFeatured, LifestyleSection, HomeVisit } from '@/components/home/HomeSections';
import { connectDB } from '@/lib/db';
import { Product, SiteSettings } from '@/models';
import { DEFAULT_HERO, type HeroData } from '@/lib/hero-defaults';

export const metadata: Metadata = {
  title: 'Floresco — Luxury Fragrances & Lifestyle | Eldoret, Kenya',
};

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

async function getHeroData(): Promise<HeroData> {
  try {
    await connectDB();
    const s = await SiteSettings.findOne({ key: 'hero' }).lean();
    const value = (s as any)?.value;
    return value ? { ...DEFAULT_HERO, ...value } : DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export default async function HomePage() {
  const [categoryImages, hero] = await Promise.all([getCategoryImages(), getHeroData()]);
  return (
    <>
      <Hero hero={hero} />
      <HomeMarquee />
      <HomeCategories images={categoryImages} />
      <HomeFeatured />
      <LifestyleSection images={categoryImages} />
      <HomeVisit />
    </>
  );
}
