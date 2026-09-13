import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import type { Db } from '@/db/client';

/* D1/Drizzle has no schema-level `select: false` the way Mongoose did for
   `password`/`resetToken`/`resetTokenExpiry` — safety here is a matter of
   convention instead: every ordinary lookup goes through the functions
   below, which omit those three columns by default. Only auth.ts's
   authorize(), and the register/password-reset/change-password routes that
   genuinely need them, should select the full row directly. */
export const SAFE_USER_COLUMNS = {
  id: users.id,
  email: users.email,
  name: users.name,
  phone: users.phone,
  role: users.role,
  mustChangePassword: users.mustChangePassword,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

export async function findUserByEmail(db: Db, email: string) {
  const [row] = await db.select(SAFE_USER_COLUMNS).from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function findUserById(db: Db, id: string) {
  const [row] = await db.select(SAFE_USER_COLUMNS).from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

/* Full row, including password/resetToken/resetTokenExpiry — only for the
   handful of places that genuinely need to read one of those three. */
export async function findUserByEmailWithSecrets(db: Db, email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}
