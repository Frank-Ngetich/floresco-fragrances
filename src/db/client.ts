import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Async mode everywhere (route handlers and server components alike) —
// sync mode throws during Next's build-time SSG detection pass for server
// components, and standardizing on one pattern avoids that footgun.
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}

export type Db = Awaited<ReturnType<typeof getDb>>;
