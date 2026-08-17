import type { UserRole } from '@/types';

export type AdminSection =
  | 'dashboard' | 'orders' | 'products' | 'customers' | 'inquiries'
  | 'media' | 'hero' | 'blog' | 'analytics' | 'settings';

/** Which roles can access each admin section at all (page-level gate). */
const SECTION_ACCESS: Record<AdminSection, UserRole[]> = {
  dashboard: ['staff', 'manager', 'owner'],
  orders:    ['staff', 'manager', 'owner'],
  products:  ['staff', 'manager', 'owner'],
  customers: ['staff', 'manager', 'owner'],
  inquiries: ['staff', 'manager', 'owner'],
  media:     ['manager', 'owner'],
  hero:      ['manager', 'owner'],
  blog:      ['manager', 'owner'],
  analytics: ['manager', 'owner'],
  settings:  ['owner'],
};

/** Path prefix -> section. Order matters: most specific first, '/admin' last. */
const ROUTE_SECTIONS: [string, AdminSection][] = [
  ['/admin/orders',    'orders'],
  ['/admin/products',  'products'],
  ['/admin/customers', 'customers'],
  ['/admin/inquiries', 'inquiries'],
  ['/admin/media',     'media'],
  ['/admin/hero',      'hero'],
  ['/admin/blog',      'blog'],
  ['/admin/analytics', 'analytics'],
  ['/admin/settings',  'settings'],
  ['/admin',           'dashboard'],
];

export function sectionForPath(pathname: string): AdminSection {
  for (const [prefix, section] of ROUTE_SECTIONS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return section;
  }
  return 'dashboard';
}

export function canAccessSection(role: UserRole | undefined | null, section: AdminSection): boolean {
  if (!role) return false;
  return SECTION_ACCESS[section].includes(role);
}

/* ── Finer, per-action checks (beyond simple page access) ───────────── */
export function canDeleteProduct(role?: UserRole | null)  { return role === 'manager' || role === 'owner'; }
export function canWriteMedia(role?: UserRole | null)     { return role === 'manager' || role === 'owner'; }
export function canWriteSettings(role?: UserRole | null)  { return role === 'owner'; }
export function canWriteHero(role?: UserRole | null)      { return role === 'manager' || role === 'owner'; }
export function canEditCustomer(role?: UserRole | null)   { return role === 'manager' || role === 'owner'; }
export function canManageTeam(role?: UserRole | null)      { return role === 'owner'; }
