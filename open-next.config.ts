// Cloudflare Workers build config for @opennextjs/cloudflare.
// See: https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// R2-backed page/data cache (ISR) — strongly consistent, unlike Workers KV,
// which matters here since a stale cache could show wrong prices/stock.
// Needs a dedicated R2 bucket bound as NEXT_INC_CACHE_R2_BUCKET in
// wrangler.jsonc — kept separate from the media bucket so cache-internal
// objects never show up in the Media Library's file listing.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
