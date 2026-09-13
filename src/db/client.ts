import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import * as schema from './schema';

// eq(booleanColumn, true) reliably matches 0 rows against the real deployed
// D1 binding, even though the exact same query works locally against
// Miniflare and the raw column value is a plain SQLite integer 1/0 — a
// binding-layer quirk between local and remote D1, not a data problem.
// Comparing against a literal integer sidesteps it entirely.
export function isTrue(column: SQLiteColumn) {
  return sql`${column} = 1`;
}
export function isFalse(column: SQLiteColumn) {
  return sql`${column} = 0`;
}

// Async mode everywhere (route handlers and server components alike) —
// sync mode throws during Next's build-time SSG detection pass for server
// components, and standardizing on one pattern avoids that footgun.
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}

export type Db = Awaited<ReturnType<typeof getDb>>;
