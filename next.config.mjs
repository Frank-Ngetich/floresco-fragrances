import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Gives `next dev` access to Cloudflare bindings (D1, R2, KV) via a local
// Miniflare-backed proxy — without this, the D1 binding is undefined outside
// the deployed Worker. Doesn't need to be awaited (async internally only).
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],

  images: {
    loader: 'custom',
    loaderFile: './image-loader.ts',
    minimumCacheTTL: 31536000, // 1 year — uploaded filenames are timestamp-prefixed, so a given URL's content never changes
    remotePatterns: [
      /* Cloudflare R2 public bucket */
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      /* Custom domain pointing to R2 (set R2_PUBLIC_URL in .env) */
      {
        protocol: 'https',
        hostname: 'media.florescofragrances.co.ke',
      },
      /* Cloudflare Workers / Pages assets */
      {
        protocol: 'https',
        hostname: '**.workers.dev',
      },
      /* Cloudinary (if used as fallback CDN) */
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      /* Generic HTTPS images for external URLs added in Media Library */
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  /* Cloudflare Pages compatibility */
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
};

export default nextConfig;
