'use client';
import { SessionProvider } from 'next-auth/react';
import { AccountClient } from '@/components/account/AccountClient';
export default function LoginPage() {
  return <SessionProvider><AccountClient /></SessionProvider>;
}
