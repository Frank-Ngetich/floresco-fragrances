import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import { User } from '@/models';
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
          await connectDB();
          const user = await User.findOne({ email: credentials.email }).select('+password');
          if (!user) return null;
          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) return null;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
