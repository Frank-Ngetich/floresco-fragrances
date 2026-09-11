import type { ImageLoaderProps } from 'next/image';

/* Routes next/image requests through Cloudflare's edge image resizer
   (/cdn-cgi/image/) instead of Next's default Node-based optimizer, which
   isn't available on Workers. Requires "Image Resizing" to be on for this
   zone (Cloudflare dashboard → Speed → Optimization) — falls back to the
   original, unresized image if it isn't. */

function normalizeSrc(src: string): string {
  return src.startsWith('/') ? src.slice(1) : src;
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  if (process.env.NODE_ENV === 'development') return src;

  const params = [`width=${width}`, `quality=${quality || 82}`, 'format=auto'];
  return `/cdn-cgi/image/${params.join(',')}/${normalizeSrc(src)}`;
}
