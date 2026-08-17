import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !['owner','manager','staff'].includes(role || '')) {
    redirect('/login?callbackUrl=/admin');
  }
  return <AdminShell session={session}>{children}</AdminShell>;
}
