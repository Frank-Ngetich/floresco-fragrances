'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Package, Truck, CheckCircle,
  AlertCircle, Clock, Send, RefreshCw,
} from 'lucide-react';
import { formatKES, cn } from '@/lib/utils';

type Status = 'all' | 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

const STATUSES: { id: Status; label: string; color: string; icon: React.ElementType }[] = [
  { id: 'all',       label: 'All',       color: 'text-white/60',   icon: Package },
  { id: 'pending',   label: 'Pending',   color: 'text-amber-400',  icon: Clock },
  { id: 'confirmed', label: 'Confirmed', color: 'text-blue-400',   icon: CheckCircle },
  { id: 'packed',    label: 'Packed',    color: 'text-purple-400', icon: Package },
  { id: 'shipped',   label: 'Shipped',   color: 'text-indigo-400', icon: Truck },
  { id: 'delivered', label: 'Delivered', color: 'text-green-400',  icon: CheckCircle },
  { id: 'cancelled', label: 'Cancelled', color: 'text-red-400',    icon: AlertCircle },
];

const STATUS_PILL: Record<string, string> = {
  pending:   'bg-amber-500/15 text-amber-300',
  confirmed: 'bg-blue-500/15 text-blue-300',
  packed:    'bg-purple-500/15 text-purple-300',
  shipped:   'bg-indigo-500/15 text-indigo-300',
  delivered: 'bg-green-500/15 text-green-300',
  cancelled: 'bg-red-500/15 text-red-300',
};

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  customer: { name: string; email: string; phone: string };
  items: { name: string; brand: string; size: string; quantity: number; price: number }[];
  delivery: { method: string; fee: number; address?: any };
  payment: { method: string; status: string; amount: number };
  subtotal: number;
  total: number;
  statusHistory: { status: string; updatedAt: string; note?: string }[];
  trackingNumber?: string;
}

export default function AdminOrders() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<Status>('all');
  const [query,     setQuery]     = useState('');
  const [selected,  setSelected]  = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [note,      setNote]      = useState('');
  const [tracking,  setTracking]  = useState('');
  const [updating,  setUpdating]  = useState(false);
  const [updateOk,  setUpdateOk]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all') params.set('status', filter);
      const res  = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    );
  });

  async function updateStatus() {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${selected.orderNumber}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, note, trackingNumber: tracking }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o._id === selected._id ? { ...o, ...updated } : o));
        setSelected(prev => prev ? { ...prev, status: newStatus } : null);
        setNote(''); setTracking('');
        setUpdateOk(true);
        setTimeout(() => setUpdateOk(false), 2500);
      }
    } catch {}
    setUpdating(false);
  }

  /* Count per status */
  const counts: Record<string, number> = { all: total };
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

  return (
    <div className="flex gap-6 min-h-0">
      {/* Orders list */}
      <div className={cn('flex-1 space-y-5 min-w-0', selected && 'hidden lg:block lg:max-w-[55%]')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display">Orders</h1>
            <p className="text-white/50 text-sm mt-1">{total} total orders</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs tracking-wide uppercase px-4 py-2 rounded transition-colors disabled:opacity-50 self-start">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none bg-white/[0.04] rounded-lg p-1">
          {STATUSES.map(s => (
            <button key={s.id} onClick={() => setFilter(s.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all',
                filter === s.id ? 'bg-wine-600 text-white' : 'text-white/50 hover:text-white'
              )}>
              <s.icon size={11} />
              {s.label}
              {counts[s.id] > 0 && (
                <span className={cn('text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full',
                  filter === s.id ? 'bg-white/20' : 'bg-white/10')}>
                  {counts[s.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by order ID, name, email or phone…"
            className="w-full bg-white/[0.06] border border-white/15 text-white text-sm pl-9 pr-4 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-white/30 rounded" />
        </div>

        {/* Orders */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-white/[0.03] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Package size={32} strokeWidth={1} className="mx-auto mb-3" />
            <p className="text-sm">{orders.length === 0 ? 'No orders yet' : 'No orders match your search'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(order => (
                <motion.div key={order._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setSelected(order); setNewStatus(order.status); }}
                  className={cn(
                    'bg-white/[0.04] border rounded-lg p-4 cursor-pointer transition-all hover:bg-white/[0.07]',
                    selected?._id === order._id ? 'border-wine-500/50 bg-wine-600/10' : 'border-white/10'
                  )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-mono text-white font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {order.customer.name} · {order.customer.phone}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('en-KE', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn('text-[0.62rem] tracking-wide uppercase px-2.5 py-1 rounded-full font-medium',
                        STATUS_PILL[order.status] || 'bg-white/10 text-white/50')}>
                        {order.status}
                      </span>
                      <span className="text-sm font-display text-white">{formatKES(order.total)}</span>
                      <span className="text-xs text-white/40 uppercase tracking-wide">{order.payment.method}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {order.items.map((item, i) => (
                      <span key={i} className="text-[0.62rem] text-white/35">
                        {item.name} {item.size}{i < order.items.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Order detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-[400px] flex-shrink-0 bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden flex flex-col self-start sticky top-24 max-h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div>
                <div className="text-sm font-mono text-white">{selected.orderNumber}</div>
                <div className="text-xs text-white/40 mt-0.5">{selected.customer.name}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer */}
              <div>
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-3">Customer</div>
                <div className="space-y-1 text-sm">
                  <div className="text-white">{selected.customer.name}</div>
                  <div className="text-white/50">{selected.customer.email}</div>
                  <div className="text-white/50">{selected.customer.phone}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-3">Items</div>
                <div className="space-y-3">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div>
                        <div className="text-white">{item.name}</div>
                        <div className="text-xs text-white/40 mt-0.5">{item.size} · Qty {item.quantity}</div>
                      </div>
                      <div className="text-white font-display">{formatKES(item.price * item.quantity)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-white/10 font-display text-base text-white">
                    <span>Total</span>
                    <span>{formatKES(selected.total)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-3">Delivery</div>
                <div className="text-sm text-white/60 space-y-1">
                  <div className="capitalize">{selected.delivery.method}</div>
                  {selected.delivery.address && (
                    <div className="text-white/40">
                      {selected.delivery.address.street}, {selected.delivery.address.city}, {selected.delivery.address.county}
                    </div>
                  )}
                  {selected.trackingNumber && (
                    <div>Tracking: <span className="font-mono text-white/70">{selected.trackingNumber}</span></div>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div>
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-3">Payment</div>
                <div className="text-sm text-white/60 flex gap-3">
                  <span className="uppercase">{selected.payment.method}</span>
                  <span className={selected.payment.status === 'paid' ? 'text-green-400' : 'text-amber-400'}>
                    {selected.payment.status}
                  </span>
                </div>
              </div>

              {/* Status history */}
              <div>
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-3">History</div>
                <div className="space-y-2">
                  {selected.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-wine-500 flex-shrink-0 mt-1.5" />
                      <div>
                        <span className="capitalize text-white/70 font-medium">{h.status}</span>
                        <span className="text-white/30 ml-2">
                          {new Date(h.updatedAt).toLocaleString('en-KE', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {h.note && <div className="text-white/40 mt-0.5">{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Update status */}
              <div className="border-t border-white/10 pt-5">
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-4">Update Status</div>
                <div className="space-y-3">
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 rounded focus:outline-none">
                    {STATUSES.filter(s => s.id !== 'all').map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <input value={tracking} onChange={e => setTracking(e.target.value)}
                    placeholder="Tracking number (optional)"
                    className="w-full bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 rounded focus:outline-none placeholder:text-white/30" />
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                    placeholder="Note for customer (sent via email & WhatsApp)"
                    className="w-full bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 rounded focus:outline-none placeholder:text-white/30 resize-none" />
                  <button onClick={updateStatus}
                    disabled={updating || newStatus === selected.status}
                    className="w-full flex items-center justify-center gap-2 bg-wine-600 hover:bg-wine-700 disabled:opacity-50 text-white text-xs tracking-[0.14em] uppercase py-2.5 rounded transition-colors">
                    {updating ? <RefreshCw size={12} className="animate-spin" /> : updateOk ? <CheckCircle size={12} /> : <Send size={12} />}
                    {updating ? 'Updating…' : updateOk ? 'Updated!' : 'Update & Notify Customer'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
