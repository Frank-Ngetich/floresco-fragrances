import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from '@/db/client';
import { findUserByEmailWithSecrets } from '@/lib/users';
import type { UserRole } from '@/types';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const db = await getDb();
          const user = await findUserByEmailWithSecrets(db, credentials.email as string);
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            mustChangePassword: !!user.mustChangePassword,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
