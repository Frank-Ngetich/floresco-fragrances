/* Shapes a Drizzle product row (with sizes[]/images[] relations loaded) into
   the IProduct shape the frontend already expects — this is the one place
   that translation happens, so every route stays consistent. */
export function toIProduct(row: any) {
  return {
    _id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    scentNotes: {
      top: row.scentNotesTop || [],
      heart: row.scentNotesHeart || [],
      base: row.scentNotesBase || [],
    },
    sizes: (row.sizes || []).map((s: any) => ({ size: s.size, price: s.price, stock: s.stock, sku: s.sku })),
    images: (row.images || []).map((i: any) => ({ url: i.url, alt: i.alt, isPrimary: i.isPrimary })),
    color1: row.color1,
    color2: row.color2,
    featured: row.featured,
    badge: row.badge || '',
    rating: row.rating,
    reviewCount: row.reviewCount,
    status: row.status,
    seo: { metaTitle: row.metaTitle || '', metaDescription: row.metaDescription || '' },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
