'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Check, Plus, Trash2, ArrowLeft, Upload, Eye, Image, AlertTriangle } from 'lucide-react';
import { BottleSVG } from '@/components/ui/BottleSVG';
import { formatKES, slugify, cn } from '@/lib/utils';
import { PRODUCTS_DATA } from '@/lib/products-data';

type Status = 'draft' | 'active' | 'archived';

interface Size   { size: string; price: number; stock: number; sku: string }
interface Notes  { top: string[]; heart: string[]; base: string[] }

interface ProductForm {
  name: string;
  brand: string;
  category: string;
  tagline: string;
  description: string;
  scentNotes: Notes;
  sizes: Size[];
  color1: string;
  color2: string;
  featured: boolean;
  badge: string;
  status: Status;
  images: { url: string; alt: string; isPrimary: boolean }[];
  seo: { metaTitle: string; metaDescription: string };
  slug: string;
}

const BLANK: ProductForm = {
  name:'', brand:'', category:'women', tagline:'', description:'',
  scentNotes:{ top:[], heart:[], base:[] },
  sizes:[{ size:'50ml', price:0, stock:0, sku:'' }],
  color1:'#B02837', color2:'#D24650',
  featured:false, badge:'', status:'active',
  images:[],
  seo:{ metaTitle:'', metaDescription:'' },
  slug:'',
};

const CATS    = ['women','men','arabian-oud','unisex','gift-sets','accessories'];
const BRANDS  = ['Designer','House Niche','Arabian House'];
const BADGES  = ['','New','Bestseller',"Editor's Pick",'Staff Pick','Fresh Pick','Limited'];
const SIZES   = ['10ml','15ml','20ml','30ml','35ml','40ml','50ml','60ml','75ml','100ml','125ml','200ml'];

type Tab = 'basic'|'scent'|'inventory'|'media'|'seo';

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form,    setForm]    = useState<ProductForm>(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState<Tab>('basic');
  const [noteInputs, setNoteInputs] = useState({ top:'', heart:'', base:'' });

  const isNew = !productId || productId === 'new';

  useEffect(() => {
    if (!isNew) {
      /* Try API then fallback to static */
      fetch(`/api/products/${productId}`)
        .then(r => r.json())
        .then(d => setForm({ ...BLANK, ...d }))
        .catch(() => {
          const p = PRODUCTS_DATA.find(x => x.slug === productId || `s-${PRODUCTS_DATA.indexOf(x)}` === productId);
          if (p) setForm({
            ...BLANK, name:p.name, brand:p.brand, category:p.category, tagline:p.tagline,
            description:p.description, scentNotes:{ ...p.scentNotes },
            sizes: p.sizes.map(s=>({...s})), color1:p.color1, color2:p.color2,
            featured:!!p.featured, badge:p.badge||'', status:'active', slug:p.slug,
            seo: p.seo, images: p.images.map(i=>({...i})),
          });
        });
    }
  }, [productId, isNew]);

  function up<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setSaved(false);
    if (k === 'name') setForm(p => ({ ...p, name: v as string, slug: slugify(v as string) }));
  }

  function addNote(type: keyof Notes) {
    const val = noteInputs[type].trim();
    if (!val) return;
    up('scentNotes', { ...form.scentNotes, [type]: [...form.scentNotes[type], val] });
    setNoteInputs(p => ({ ...p, [type]: '' }));
  }
  function removeNote(type: keyof Notes, i: number) {
    up('scentNotes', { ...form.scentNotes, [type]: form.scentNotes[type].filter((_,j)=>j!==i) });
  }

  function addSize() { up('sizes', [...form.sizes, { size:'30ml', price:0, stock:0, sku:'' }]); }
  function updateSize(i: number, k: keyof Size, v: string|number) {
    const s = [...form.sizes]; s[i] = { ...s[i], [k]: v }; up('sizes', s);
  }

  async function save() {
    setError('');
    if (!form.name.trim())        { setError('Product Name is required.');        setTab('basic'); return; }
    if (!form.brand.trim())       { setError('Brand is required.');               setTab('basic'); return; }
    if (!form.tagline.trim())     { setError('Tagline is required.');             setTab('basic'); return; }
    if (!form.description.trim()) { setError('Full Description is required.');    setTab('basic'); return; }

    setSaving(true);
    const body = { ...form, slug: form.slug || slugify(form.name) };
    try {
      const res = await fetch(isNew ? '/api/products' : `/api/products/${productId}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        if (isNew) router.push(`/admin/products/${data._id || data.slug}`);
      } else {
        setError(data.error || 'Failed to save product.');
      }
    } catch {
      setError('Network error — could not reach the server.');
    }
    setSaving(false);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id:'basic',     label:'Basic Info' },
    { id:'scent',     label:'Scent Notes' },
    { id:'inventory', label:'Sizes & Stock' },
    { id:'media',     label:'Images' },
    { id:'seo',       label:'SEO' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-display">{isNew ? 'New Product' : `Edit: ${form.name || '…'}`}</h1>
            {form.slug && <p className="text-white/40 text-xs mt-0.5 font-mono">/product/{form.slug}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={form.status} onChange={e => up('status', e.target.value as Status)}
            className="bg-white/[0.06] border border-white/15 text-white text-xs px-3 py-2 rounded focus:outline-none">
            <option value="draft">Draft</option>
            <option value="active">Active (Live)</option>
            <option value="archived">Archived</option>
          </select>
          {!isNew && (
            <a href={`/product/${form.slug}`} target="_blank"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs px-4 py-2 rounded transition-colors">
              <Eye size={12} /> Preview
            </a>
          )}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-wine-600 hover:bg-wine-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2 rounded transition-colors">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* Draft warning */}
      {form.status === 'draft' && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-3 rounded-lg">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>This product is a <strong>Draft</strong> — it will not appear in the shop until you set Status to "Active (Live)" and save.</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded text-xs tracking-[0.14em] uppercase font-medium transition-all ${
              tab===t.id ? 'bg-wine-600 text-white' : 'text-white/50 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Main form */}
        <div>
          {/* BASIC */}
          {tab === 'basic' && (
            <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-lg p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="Product Name *">
                  <input value={form.name} onChange={e => { setForm(p=>({...p,name:e.target.value,slug:slugify(e.target.value)})); setSaved(false); }}
                    className="admin-input" placeholder="Velvet Oud Intense" />
                </F>
                <F label="URL Slug">
                  <input value={form.slug} onChange={e => up('slug', e.target.value)}
                    className="admin-input font-mono text-sm" placeholder="velvet-oud-intense" />
                </F>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="Brand">
                  <select value={form.brand} onChange={e => up('brand', e.target.value)} className="admin-input">
                    <option value="">Select brand…</option>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </F>
                <F label="Category">
                  <select value={form.category} onChange={e => up('category', e.target.value)} className="admin-input">
                    {CATS.map(c => <option key={c} value={c}>{c.replace('-',' & ')}</option>)}
                  </select>
                </F>
              </div>
              <F label="Tagline (italic sub-title)">
                <input value={form.tagline} onChange={e => up('tagline', e.target.value)}
                  className="admin-input" placeholder="Deep, smoky oud with warm amber and damask rose." />
              </F>
              <F label="Full Description">
                <textarea rows={5} value={form.description} onChange={e => up('description', e.target.value)}
                  className="admin-input resize-none" placeholder="Describe the fragrance in full…" />
              </F>
              <div className="grid sm:grid-cols-3 gap-4">
                <F label="Badge">
                  <select value={form.badge} onChange={e => up('badge', e.target.value)} className="admin-input">
                    {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </F>
                <F label="Bottle Color 1">
                  <div className="flex gap-2">
                    <input type="color" value={form.color1} onChange={e => up('color1', e.target.value)}
                      className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer flex-shrink-0" />
                    <input value={form.color1} onChange={e => up('color1', e.target.value)} className="admin-input font-mono" />
                  </div>
                </F>
                <F label="Bottle Color 2">
                  <div className="flex gap-2">
                    <input type="color" value={form.color2} onChange={e => up('color2', e.target.value)}
                      className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer flex-shrink-0" />
                    <input value={form.color2} onChange={e => up('color2', e.target.value)} className="admin-input font-mono" />
                  </div>
                </F>
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" checked={form.featured} onChange={e => up('featured', e.target.checked)}
                  className="w-4 h-4 accent-wine-600" />
                <div>
                  <div className="text-sm text-white">Feature on homepage</div>
                  <div className="text-xs text-white/40">Shows in the "House Favourites" section</div>
                </div>
              </label>
            </div>
          )}

          {/* SCENT */}
          {tab === 'scent' && (
            <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-lg p-6">
              {(['top','heart','base'] as const).map(type => (
                <div key={type}>
                  <F label={`${type.charAt(0).toUpperCase()+type.slice(1)} Notes`}>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.scentNotes[type].map((note, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-wine-600/20 border border-wine-600/30 text-wine-300 text-xs px-3 py-1.5 rounded-full">
                          {note}
                          <button onClick={() => removeNote(type, i)} className="text-wine-400/60 hover:text-red-400 transition-colors">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={noteInputs[type]}
                        onChange={e => setNoteInputs(p=>({...p,[type]:e.target.value}))}
                        onKeyDown={e => e.key==='Enter' && addNote(type)}
                        placeholder={`Add ${type} note… (press Enter)`}
                        className="admin-input flex-1 text-sm py-2"
                      />
                      <button onClick={() => addNote(type)}
                        className="bg-wine-600 hover:bg-wine-700 text-white px-3 py-2 rounded text-xs transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                  </F>
                </div>
              ))}
            </div>
          )}

          {/* INVENTORY */}
          {tab === 'inventory' && (
            <div className="space-y-4 bg-white/[0.03] border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Sizes & Pricing</h3>
                <button onClick={addSize} className="flex items-center gap-1.5 text-xs text-wine-400 hover:text-wine-300 transition-colors">
                  <Plus size={13} /> Add Size
                </button>
              </div>
              {form.sizes.map((size, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] sm:grid-cols-[120px_1fr_1fr_1fr_auto] gap-3 items-end">
                  <F label={i===0?'Size':''}>
                    <select value={size.size} onChange={e => updateSize(i,'size',e.target.value)} className="admin-input">
                      {SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label={i===0?'Price (KES)':''}>
                    <input type="number" value={size.price} onChange={e => updateSize(i,'price',+e.target.value)}
                      className="admin-input" placeholder="8500" />
                  </F>
                  <F label={i===0?'Stock':''}>
                    <input type="number" value={size.stock} onChange={e => updateSize(i,'stock',+e.target.value)}
                      className="admin-input" placeholder="10" />
                  </F>
                  <F label={i===0?'SKU':''}>
                    <input value={size.sku} onChange={e => updateSize(i,'sku',e.target.value)}
                      className="admin-input font-mono text-sm" placeholder="VOI-50" />
                  </F>
                  <button onClick={() => up('sizes', form.sizes.filter((_,j)=>j!==i))}
                    disabled={form.sizes.length===1}
                    className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-20 pb-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {form.sizes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-white/40">Total stock: <strong className="text-white">{form.sizes.reduce((s,sz)=>s+(sz.stock||0),0)} units</strong></div>
                </div>
              )}
            </div>
          )}

          {/* MEDIA */}
          {tab === 'media' && (
            <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Product Images</h3>
                <button onClick={() => up('images', [...form.images, { url:'', alt:'', isPrimary: form.images.length===0 }])}
                  className="text-xs text-wine-400 hover:text-wine-300 flex items-center gap-1 transition-colors">
                  <Plus size={13} /> Add Image URL
                </button>
              </div>
              {form.images.length === 0 && (
                <div className="border-2 border-dashed border-white/10 rounded-lg p-10 text-center">
                  <Image size={28} className="mx-auto text-white/20 mb-3" strokeWidth={1} />
                  <p className="text-sm text-white/40 mb-1">No images added yet</p>
                  <p className="text-xs text-white/25">Upload via <a href="/admin/media" className="text-wine-400">Media Library</a> then paste URL here</p>
                </div>
              )}
              {form.images.map((img, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                  <F label={i===0?'Image URL':''}>
                    <input value={img.url} onChange={e => {
                      const imgs=[...form.images]; imgs[i]={...imgs[i],url:e.target.value}; up('images',imgs);
                    }} className="admin-input text-sm" placeholder="https://res.cloudinary.com/…" />
                  </F>
                  <div className={cn('flex-shrink-0 w-8 h-8 rounded border flex items-center justify-center cursor-pointer transition-colors',
                    img.isPrimary ? 'border-wine-500 bg-wine-500/20 text-wine-400' : 'border-white/15 text-white/20 hover:border-wine-400')}
                    onClick={() => up('images', form.images.map((im,j)=>({...im,isPrimary:j===i})))}>
                    <Check size={12} />
                  </div>
                  <button onClick={() => up('images', form.images.filter((_,j)=>j!==i))}
                    className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-wine-600/30 transition-colors cursor-pointer">
                <Upload size={22} className="mx-auto text-white/20 mb-2" />
                <p className="text-xs text-white/30">Upload directly via <a href="/admin/media" className="text-wine-400 hover:text-wine-300">Media Library →</a></p>
              </div>
            </div>
          )}

          {/* SEO */}
          {tab === 'seo' && (
            <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-lg p-6">
              <F label="Meta Title">
                <input value={form.seo.metaTitle} onChange={e => up('seo',{...form.seo,metaTitle:e.target.value})}
                  className="admin-input" placeholder="Velvet Oud Intense | Floresco" />
                <div className="text-xs text-white/30 mt-1">{form.seo.metaTitle.length}/60 characters</div>
              </F>
              <F label="Meta Description">
                <textarea rows={3} value={form.seo.metaDescription} onChange={e => up('seo',{...form.seo,metaDescription:e.target.value})}
                  className="admin-input resize-none" placeholder="Deep Cambodian oud with damask rose and amber…" />
                <div className="text-xs text-white/30 mt-1">{form.seo.metaDescription.length}/160 characters</div>
              </F>
              <div className="bg-white/[0.04] rounded-lg p-4 border border-white/10">
                <div className="text-[0.6rem] tracking-wide uppercase text-white/30 mb-3">Google Preview</div>
                <div className="text-blue-400 text-sm truncate">{`florescofragrances.co.ke/product/${form.slug}`}</div>
                <div className="text-blue-300 font-medium text-base mt-1">{form.seo.metaTitle || form.name || 'Product Name'}</div>
                <div className="text-white/50 text-xs mt-1 line-clamp-2">{form.seo.metaDescription || form.tagline || 'Meta description…'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar preview */}
        <div className="lg:sticky lg:top-24 self-start space-y-4">
          {/* Bottle preview */}
          <div className="bg-white/[0.04] border border-white/10 rounded-lg p-5 text-center">
            <div className="text-xs uppercase tracking-[0.14em] text-white/30 mb-4">Bottle Preview</div>
            <div className="flex justify-center mb-4">
              <BottleSVG color1={form.color1} color2={form.color2} id="preview" className="h-36 w-auto" />
            </div>
            <div className="text-xs text-white/40 mb-1">{form.brand || 'Brand'}</div>
            <div className="text-sm text-white font-display mb-1">{form.name || 'Product Name'}</div>
            <div className="text-xs text-white/50 italic mb-3 line-clamp-2">{form.tagline || 'Tagline'}</div>
            {form.sizes[0]?.price > 0 && (
              <div className="text-base font-display text-white">{formatKES(form.sizes[0].price)}</div>
            )}
          </div>

          {/* Status */}
          <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 space-y-2">
            <div className="text-xs uppercase tracking-[0.14em] text-white/30 mb-3">Publish</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Status</span>
              <span className={cn('font-medium capitalize', form.status==='active'?'text-green-400':form.status==='draft'?'text-amber-400':'text-white/40')}>
                {form.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Featured</span>
              <span className={form.featured?'text-wine-400':'text-white/30'}>{form.featured?'Yes':'No'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Sizes</span>
              <span className="text-white/70">{form.sizes.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Total stock</span>
              <span className="text-white/70">{form.sizes.reduce((s,sz)=>s+(sz.stock||0),0)}</span>
            </div>
            <button onClick={save} disabled={saving}
              className="w-full mt-3 bg-wine-600 hover:bg-wine-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase py-2.5 rounded transition-colors flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">{label}</label>}
      {children}
    </div>
  );
}
