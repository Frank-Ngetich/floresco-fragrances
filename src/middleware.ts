import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import { sectionForPath, canAccessSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');
  if (!isAdmin) return;

  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: UserRole })?.role;
  const isStaff = ['staff', 'manager', 'owner'].includes(role || '');

  if (!isLoggedIn || !isStaff) {
    return NextResponse.redirect(new URL(`/account?callbackUrl=${req.nextUrl.pathname}`, req.url));
  }

  const section = sectionForPath(req.nextUrl.pathname);
  if (!canAccessSection(role, section)) {
    return NextResponse.redirect(new URL('/admin?denied=1', req.url));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
