import { customAlphabet } from 'nanoid';

// URL-safe, no ambiguous-looking characters removed on purpose — these are
// internal IDs, not user-typed codes (order numbers are the human-facing
// identifier and already have their own generator elsewhere).
const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21);

export function newId(): string {
  return nano();
}

// Migrated rows kept their original Mongo ObjectId (24 lowercase hex chars)
// as their D1 primary key; every ID created after the D1 migration comes
// from newId() above and will never match this shape. Used where a single
// path param might be either an ID or a human-facing code (e.g. an order
// lookup by id-or-orderNumber) to decide which branch to try first.
export function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}
