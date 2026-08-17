'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Users, Package,
  AlertTriangle, Eye, ArrowUpRight, Clock,
  CheckCircle, Truck, BarChart2, RefreshCw,
} from 'lucide-react';
import { formatKES } from '@/lib/utils';

const CARD = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

interface Stats {
  todayRevenue:   number;
  weekRevenue:    number;
  pendingOrders:  number;
  totalOrders:    number;
  lowStockCount:  number;
  totalCustomers: number;
}

interface RecentOrder {
  orderNumber: string;
  customer:    { name: string };
  total:       number;
  status:      string;
  payment:     { method: string };
  createdAt:   string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-50   text-blue-700',
  shipped:   'bg-purple-50 text-purple-700',
  pending:   'bg-amber-50  text-amber-700',
  delivered: 'bg-green-50  text-green-700',
  packed:    'bg-indigo-50 text-indigo-700',
  cancelled: 'bg-stone-100 text-stone-600',
};

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [orders,  setOrders]  = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/orders?limit=5'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  }

  const statCards = stats ? [
    { label: "Today's Revenue",  value: formatKES(stats.todayRevenue),  change: 'Today',        up: true,  icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'This Week',        value: formatKES(stats.weekRevenue),   change: 'Last 7 days',  up: true,  icon: BarChart2,   color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Pending Orders',   value: String(stats.pendingOrders),    change: 'Need action',  up: false, icon: ShoppingBag, color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Low Stock Items',  value: String(stats.lowStockCount),    change: 'Under 5 units',up: false, icon: AlertTriangle,color:'text-red-600',    bg: 'bg-red-50' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-normal">{greeting} 👋</h1>
          <p className="text-white/50 text-sm mt-1">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs tracking-wide uppercase px-4 py-2.5 rounded transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link href="/admin/products/new"
            className="flex items-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs tracking-[0.16em] uppercase font-medium px-4 py-2.5 rounded transition-colors">
            + New Product
          </Link>
          <Link href="/" target="_blank"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs tracking-[0.16em] uppercase font-medium px-4 py-2.5 rounded transition-colors">
            <Eye size={13} /> View Store
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/[0.04] rounded-lg animate-pulse" />)}
        </div>
      ) : stats ? (
        <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(s => (
            <motion.div key={s.label} variants={CARD}
              className="bg-white/[0.05] border border-white/10 p-4 lg:p-5 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[0.62rem] tracking-[0.16em] uppercase text-white/50 font-medium leading-tight">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={15} className={s.color} strokeWidth={1.8} />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-display text-white mb-1">{s.value}</div>
              <div className={`text-xs ${s.up ? 'text-green-400' : 'text-amber-400'}`}>{s.change}</div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-8 text-center">
          <p className="text-white/40 text-sm">Could not load stats. Check your MongoDB connection.</p>
          <button onClick={loadData} className="mt-4 text-wine-400 text-xs hover:text-wine-300 transition-colors">Retry</button>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-medium text-white">Recent Orders</h3>
          <Link href="/admin/orders"
            className="text-xs text-wine-300 hover:text-wine-200 tracking-wide uppercase transition-colors flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <ShoppingBag size={28} strokeWidth={1} className="mx-auto mb-3" />
            <p className="text-sm">{loading ? 'Loading orders…' : 'No orders yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['Order', 'Customer', 'Total', 'Payment', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.6rem] tracking-[0.18em] uppercase text-white/35 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderNumber}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-3.5 text-sm font-mono text-white/80">{o.orderNumber}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-white font-medium">{o.customer.name}</div>
                      <div className="text-xs text-white/40">
                        {new Date(o.createdAt).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-display text-white">{formatKES(o.total)}</td>
                    <td className="px-5 py-3.5 text-xs text-white/60 uppercase">{o.payment.method}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 text-[0.62rem] tracking-wide uppercase font-medium rounded-full ${STATUS_STYLES[o.status] || 'bg-stone-100 text-stone-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href="/admin/orders"
                        className="text-xs text-wine-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-wine-200">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: '/admin/hero',        label: 'Edit Hero',    emoji: '🎨' },
          { href: '/admin/products/new',label: 'Add Product',  emoji: '➕' },
          { href: '/admin/orders',      label: 'All Orders',   emoji: '📦' },
          { href: '/admin/customers',   label: 'Customers',    emoji: '👥' },
          { href: '/admin/settings',    label: 'Settings',     emoji: '⚙️' },
          { href: '/admin/media',       label: 'Media',        emoji: '🖼️' },
        ].map(link => (
          <Link key={link.href} href={link.href}
            className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg p-4 text-center transition-all group">
            <div className="text-2xl mb-2">{link.emoji}</div>
            <div className="text-xs tracking-[0.12em] uppercase text-white/60 group-hover:text-white transition-colors">{link.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
