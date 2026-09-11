import type { ImageLoaderProps } from 'next/image';

/* Routes next/image requests through Cloudflare's edge image resizer
   (/cdn-cgi/image/) instead of Next's default Node-based optimizer, which
   isn't available on Workers.

   IMAGE RESIZING IS A PER-DOMAIN (ZONE) FEATURE — it does not work on the
   shared *.workers.dev testing domain at all, and /cdn-cgi/image/ is not
   intercepted there. Flip this to true only once the site is on a real
   custom domain with Image Resizing enabled (Cloudflare dashboard → Speed
   → Optimization) — until then this must stay false or every image will
   404 instead of just going unoptimized. */
const IMAGE_RESIZING_ENABLED = false;

function normalizeSrc(src: string): string {
  return src.startsWith('/') ? src.slice(1) : src;
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!IMAGE_RESIZING_ENABLED || process.env.NODE_ENV === 'development') return src;

  const params = [`width=${width}`, `quality=${quality || 82}`, 'format=auto'];
  return `/cdn-cgi/image/${params.join(',')}/${normalizeSrc(src)}`;
}
