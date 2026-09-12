/* A fresh MongoDB handshake from a cold Cloudflare Workers isolate is slow
   and occasionally hangs or fails outright — hitting it on every single
   request made the shop's product list flicker between real inventory and
   the generic demo catalog. This module-level cache (safe to share across
   requests within the same warm isolate — unlike a pending connection
   promise, a plain data snapshot has no request-context to be cancelled
   with) means most requests are served from memory instead of racing a
   live connection at all. */
let cache: { products: any[]; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

export function getProductsCache() {
  return cache;
}

export function isProductsCacheFresh() {
  return !!cache && Date.now() - cache.ts < CACHE_TTL_MS;
}

export function setProductsCache(products: any[]) {
  cache = { products, ts: Date.now() };
}

export function invalidateProductsCache() {
  cache = null;
}
