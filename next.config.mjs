/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],

  images: {
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
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
  },
};

export default nextConfig;
