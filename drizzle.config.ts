import type { Config } from 'drizzle-kit';

// drizzle-kit is used purely to diff src/db/schema.ts into versioned SQL
// files under ./migrations. Those files are applied with `wrangler d1
// migrations apply` (both --local and --remote), which owns its own
// bookkeeping table — never use `drizzle-kit push` against D1, it doesn't
// know about that table and the two mechanisms will desync migration history.
// No `driver`/credentials here on purpose — only `generate` (schema → SQL
// diff) is used from this config, which needs no live connection. Applying
// migrations is done separately via `wrangler d1 migrations apply`.
export default {
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
} satisfies Config;
