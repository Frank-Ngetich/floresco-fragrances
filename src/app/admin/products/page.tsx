'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, ChevronDown, Package, Filter } from 'lucide-react';
import { BottleSVG } from '@/components/ui/BottleSVG';
import { formatKES, cn } from '@/lib/utils';
import { PRODUCTS_DATA } from '@/lib/products-data';
import type { IProduct } from '@/types';

type SortKey = 'name' | 'price' | 'stock' | 'status';

function toProduct(p: typeof PRODUCTS_DATA[0], i: number): IProduct {
  return {
    ...p, _id: `s-${i}`, status: 'active',
    sizes: p.sizes.map(s => ({ ...s })),
    images: p.images.map(img => ({ ...img })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [query,    setQuery]    = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [sort,     setSort]     = useState<SortKey>('name');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid'|'table'>('table');

  useEffect(() => {
    /* Try API first, fallback to static */
    fetch('/api/products?limit=100&status=all')
      .then(r => r.json())
      .then(d => { if (d.products?.length) setProducts(d.products); else throw new Error(); })
      .catch(() => setProducts(PRODUCTS_DATA.map(toProduct)));
  }, []);

  const filtered = products
    .filter(p => {
      const q = query.toLowerCase();
      return (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
        && (!catFilter || p.category === catFilter);
    })
    .sort((a, b) => {
      if (sort === 'name')   return a.name.localeCompare(b.name);
      if (sort === 'price')  return b.sizes[0].price - a.sizes[0].price;
      if (sort === 'stock')  return (b.sizes[0].stock ?? 0) - (a.sizes[0].stock ?? 0);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const totalStock = products.reduce((s, p) => s + p.sizes.reduce((ss, sz) => ss + (sz.stock ?? 0), 0), 0);
  const lowStock   = products.filter(p => p.sizes.some(sz => (sz.stock ?? 0) < 5));
  const active     = products.filter(p => p.status === 'active');

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'archived' : 'active';
    setProducts(p => p.map(x => x._id === id ? { ...x, status: next as IProduct['status'] } : x));
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch {}
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts(p => p.filter(x => x._id !== id));
    } catch {}
    setDeleting(null);
  }

  const CATS = ['women','men','arabian-oud','unisex','gift-sets','accessories'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Products</h1>
          <p className="text-white/50 text-sm mt-1">{products.length} total · {active.length} active · {lowStock.length} low stock</p>
        </div>
        <Link href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs tracking-[0.16em] uppercase font-medium px-5 py-2.5 rounded transition-colors self-start">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Products', value: products.length },
          { label:'Active',         value: active.length },
          { label:'Total Stock',    value: totalStock },
          { label:'Low Stock',      value: lowStock.length, warn: lowStock.length > 0 },
        ].map(s => (
          <div key={s.label} className={cn('bg-white/[0.04] border rounded-lg p-4', s.warn ? 'border-amber-500/30' : 'border-white/10')}>
            <div className="text-2xl font-display text-white mb-1">{s.value}</div>
            <div className={cn('text-xs uppercase tracking-wide', s.warn ? 'text-amber-400' : 'text-white/40')}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search products, brands…"
            className="w-full bg-white/[0.06] border border-white/15 text-white text-sm pl-9 pr-4 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-white/30 rounded" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none rounded">
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c.replace('-',' & ')}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
          className="bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none rounded">
          <option value="name">Sort: Name</option>
          <option value="price">Sort: Price</option>
          <option value="stock">Sort: Stock</option>
          <option value="status">Sort: Status</option>
        </select>
        <div className="flex rounded border border-white/15 overflow-hidden">
          {(['table','grid'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={cn('px-3 py-2.5 text-xs uppercase tracking-wide transition-colors',
                viewMode === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white')}>
              {v === 'table' ? '≡' : '⊞'}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      {viewMode === 'table' ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-white/10">
                <tr>
                  {['Product','Category','Price','Stock','Status',''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.6rem] tracking-[0.18em] uppercase text-white/35 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(p => {
                    const stock = p.sizes.reduce((s, sz) => s + (sz.stock ?? 0), 0);
                    const isLow = stock < 5;
                    return (
                      <motion.tr key={p._id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-12 bg-white/[0.06] flex items-center justify-center flex-shrink-0 rounded">
                              <BottleSVG color1={p.color1} color2={p.color2} id={`adm-${p._id}`} className="h-10 w-auto" showLabel={false} />
                            </div>
                            <div>
                              <div className="text-sm text-white font-medium">{p.name}</div>
                              <div className="text-xs text-white/40">{p.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-white/50 capitalize">{p.category.replace('-',' & ')}</td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-white">{formatKES(p.sizes[0].price)}</div>
                          {p.sizes.length > 1 && <div className="text-xs text-white/35">+{p.sizes.length-1} sizes</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('text-sm font-medium', isLow ? 'text-amber-400' : 'text-white')}>
                            {stock} units
                          </span>
                          {isLow && <div className="text-[0.6rem] text-amber-400">Low stock</div>}
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => toggleStatus(p._id, p.status)}
                            className="flex items-center gap-2 group/toggle">
                            {p.status === 'active'
                              ? <ToggleRight size={20} className="text-green-400" />
                              : <ToggleLeft  size={20} className="text-white/30" />}
                            <span className={cn('text-xs capitalize', p.status === 'active' ? 'text-green-400' : 'text-white/40')}>
                              {p.status}
                            </span>
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/product/${p.slug}`} target="_blank"
                              className="p-1.5 text-white/40 hover:text-white transition-colors" title="View on site">
                              <Eye size={14} />
                            </Link>
                            <Link href={`/admin/products/${p._id}`}
                              className="p-1.5 text-white/40 hover:text-wine-300 transition-colors" title="Edit">
                              <Edit2 size={14} />
                            </Link>
                            <button onClick={() => deleteProduct(p._id)} disabled={deleting === p._id}
                              className="p-1.5 text-white/40 hover:text-red-400 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/40">
              <Package size={32} strokeWidth={1} className="mx-auto mb-3" />
              <p className="text-sm">No products match your filters</p>
            </div>
          )}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <div key={p._id} className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden group">
              <div className="bg-white/[0.04] p-4 flex items-center justify-center h-32">
                <BottleSVG color1={p.color1} color2={p.color2} id={`grid-${p._id}`} className="h-24 w-auto" showLabel={false} />
              </div>
              <div className="p-3">
                <div className="text-xs text-white/40 mb-0.5">{p.brand}</div>
                <div className="text-sm text-white font-medium truncate mb-1">{p.name}</div>
                <div className="text-xs text-white/60">{formatKES(p.sizes[0].price)}</div>
              </div>
              <div className="flex border-t border-white/10">
                <Link href={`/admin/products/${p._id}`} className="flex-1 py-2 text-center text-xs text-white/40 hover:text-wine-300 hover:bg-white/[0.04] transition-all">
                  Edit
                </Link>
                <button onClick={() => toggleStatus(p._id, p.status)}
                  className="flex-1 py-2 text-center text-xs border-l border-white/10 transition-all hover:bg-white/[0.04]">
                  <span className={p.status === 'active' ? 'text-green-400' : 'text-white/30'}>{p.status === 'active' ? 'Live' : 'Draft'}</span>
                </button>
              </div>
            </div>
          ))}
          {/* Add new card */}
          <Link href="/admin/products/new"
            className="border-2 border-dashed border-white/15 rounded-lg flex flex-col items-center justify-center p-6 text-center hover:border-wine-600/50 hover:bg-wine-600/5 transition-all group min-h-[180px]">
            <Plus size={24} className="text-white/20 group-hover:text-wine-400 transition-colors mb-2" />
            <span className="text-xs text-white/30 group-hover:text-wine-400 transition-colors">Add Product</span>
          </Link>
        </div>
      )}
    </div>
  );
}
