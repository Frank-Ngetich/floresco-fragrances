export function toIBlogPost(row: any) {
  return {
    _id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage || '',
    category: row.category || '',
    author: row.author || '',
    published: row.published,
    publishedAt: row.publishedAt || undefined,
    seo: { metaTitle: row.metaTitle || '', metaDescription: row.metaDescription || '' },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
