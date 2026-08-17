import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/types';

// Roles that can access /admin. These sessions time out after a short
// idle period since they touch orders, customer data and payment info.
// Customer sessions keep the full 30-day window for shopping convenience.
const STAFF_ROLES: UserRole[] = ['staff', 'manager', 'owner'];
const STAFF_IDLE_MS    = 30 * 60 * 1000;           // 30 minutes
const CUSTOMER_IDLE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function idleLimitMs(role?: UserRole) {
  return role && STAFF_ROLES.includes(role) ? STAFF_IDLE_MS : CUSTOMER_IDLE_MS;
}

// Edge-safe base config: no providers with DB calls, no Node-only imports
// (mongoose, bcrypt). Middleware runs on the Edge runtime and can only
// import this file — the full config with the Credentials provider lives
// in auth.ts and is only ever loaded in the Node.js runtime.
//
// NOTE: next-auth's JWT encoder always signs `exp` as `issuedAt + session.maxAge`
// (see @auth/core/jwt.js encode()) — a custom `token.exp` set in the jwt()
// callback is NOT read by the encoder, so idle timeout can't be done via
// the exp claim here. Instead we track our own `lastActive` timestamp on
// the token and return `null` from jwt() once it's stale. The session
// action handler treats a null jwt() result as "invalid" and clears the
// cookie (@auth/core/lib/actions/session.js: `if (token !== null) {...}`),
// and both `/api/auth/session` and middleware's `req.auth` resolve through
// that same code path, so this is consistently enforced everywhere.
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: CUSTOMER_IDLE_MS / 1000, updateAge: 0 },
  pages: { signIn: '/account' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      const now = Date.now();
      if (user) {
        token.role       = (user as { role?: UserRole }).role;
        token.id         = user.id;
        token.lastActive = now;
        return token;
      }
      const role       = token.role as UserRole | undefined;
      const prevActive = (token.lastActive as number | undefined) ?? now;
      if (now - prevActive > idleLimitMs(role)) {
        return null;
      }
      token.lastActive = now;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
