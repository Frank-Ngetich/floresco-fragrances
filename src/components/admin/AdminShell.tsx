'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, MessageSquare,
  Settings, LogOut, Store, Menu, X, Image, FileText,
  BarChart2, Home, ChevronDown, Bell, Search, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { canAccessSection, type AdminSection } from '@/lib/permissions';
import type { UserRole } from '@/types';

const NAV: { href: string; icon: any; label: string; group: string; badge?: number; section: AdminSection }[] = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Dashboard',    group: 'Main',    section: 'dashboard' },
  { href: '/admin/hero',       icon: Home,            label: 'Hero & Banner',group: 'Content', section: 'hero' },
  { href: '/admin/media',      icon: Image,           label: 'Media Library',group: 'Content', section: 'media' },
  { href: '/admin/products',   icon: Package,         label: 'Products',     group: 'Store',   section: 'products' },
  { href: '/admin/orders',     icon: ShoppingBag,     label: 'Orders',       group: 'Store',   section: 'orders', badge: 7 },
  { href: '/admin/customers',  icon: Users,           label: 'Customers',    group: 'Store',   section: 'customers' },
  { href: '/admin/inquiries',  icon: MessageSquare,   label: 'Inquiries',    group: 'Store',   section: 'inquiries', badge: 3 },
  { href: '/admin/blog',       icon: FileText,        label: 'Blog / Journal',group:'Content', section: 'blog' },
  { href: '/admin/analytics',  icon: BarChart2,       label: 'Analytics',    group: 'Reports', section: 'analytics' },
  { href: '/admin/settings',   icon: Settings,        label: 'Settings',     group: 'System',  section: 'settings' },
];

const GROUPS = ['Main','Content','Store','Reports','System'];

interface Props {
  children: React.ReactNode;
  session: { user: { name?: string | null; email?: string | null; role?: string } };
}

export function AdminShell({ children, session }: Props) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const denied        = searchParams.get('denied') === '1';
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const [notifs, setNotifs]   = useState(true);
  const [showDenied, setShowDenied] = useState(denied);

  useEffect(() => { setShowDenied(denied); }, [denied]);

  /* Close drawer on route change */
  useEffect(() => { setOpen(false); }, [pathname]);
  /* Lock scroll when drawer open on mobile */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const user = session.user;
  const role = ((user as { role?: UserRole }).role || 'staff') as UserRole;
  const initials = (user.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  const visibleNav = NAV.filter(n => canAccessSection(role, n.section));
  const filteredNav = search
    ? visibleNav.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : visibleNav;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="font-display text-xl tracking-[0.3em] text-white">
            FLORES<span className="text-wine-400">CO</span>
          </div>
          <div className="text-[0.58rem] tracking-[0.22em] uppercase text-white/40 mt-0.5">Admin Panel</div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 text-white/50 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-white/[0.07] border border-white/10 text-white text-xs pl-8 pr-3 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/25 rounded"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {GROUPS.map(group => {
          const items = filteredNav.filter(n => n.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              {!search && (
                <div className="px-3 py-2 text-[0.58rem] tracking-[0.22em] uppercase text-white/30 font-medium mt-2">{group}</div>
              )}
              {items.map(item => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href} href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                      active
                        ? 'bg-wine-600/25 text-white border-l-2 border-wine-400 ml-0 pl-3'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    <item.icon size={16} strokeWidth={active ? 2 : 1.6} className="flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-wine-600 text-white text-[0.58rem] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4 space-y-2">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-all">
          <Store size={16} strokeWidth={1.6} />
          <span>View Store</span>
        </Link>
        <Link href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-300 hover:bg-white/[0.04] transition-all">
          <LogOut size={16} strokeWidth={1.6} />
          <span>Sign Out</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-wine-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{user.name || 'Admin'}</div>
            <div className="text-[0.65rem] text-white/40 capitalize">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0D0C0B] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-[#141210] border-r border-white/[0.07] fixed top-0 bottom-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#141210] border-r border-white/[0.07] lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0D0C0B]/90 backdrop-blur-md border-b border-white/[0.07] px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/50">
              <span>Admin</span>
              {pathname !== '/admin' && (
                <>
                  <span>/</span>
                  <span className="text-white capitalize">{pathname.split('/').pop()?.replace(/-/g,' ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 text-white/50 hover:text-white transition-colors"
              onClick={() => setNotifs(false)}>
              <Bell size={18} strokeWidth={1.5} />
              {notifs && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wine-600 rounded-full" />
              )}
            </button>

            {/* Quick add product on mobile */}
            <Link href="/admin/products/new"
              className="sm:hidden bg-wine-600 hover:bg-wine-700 text-white text-xs px-3 py-1.5 rounded transition-colors">
              + Add
            </Link>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-wine-700 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <div className="hidden md:block">
                <div className="text-sm text-white leading-tight">{user.name}</div>
                <div className="text-[0.62rem] text-white/40 capitalize">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {showDenied && (
            <div className="mb-6 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-3 rounded-lg">
              <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
              <span>Your role ({role}) doesn&apos;t have access to that section.</span>
              <button onClick={() => setShowDenied(false)} className="ml-auto text-amber-300/60 hover:text-amber-200">
                <X size={14} />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
