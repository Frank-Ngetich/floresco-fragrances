'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, RefreshCw, Plus, Trash2, Upload, Image, Check } from 'lucide-react';
import { DEFAULT_HERO, type HeroData } from '@/lib/hero-defaults';

const DEFAULT: HeroData = DEFAULT_HERO;

type Tab = 'text' | 'design' | 'media' | 'animations';

export default function AdminHeroEditor() {
  const [data,    setData]    = useState<HeroData>(DEFAULT);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [tab,     setTab]     = useState<Tab>('text');
  const [newPill, setNewPill] = useState('');

  useEffect(() => {
    fetch('/api/admin/site-settings?key=hero')
      .then(r => r.json())
      .then(d => { if (d.value) setData({ ...DEFAULT, ...d.value }); })
      .catch(() => {});
  }, []);

  function up<K extends keyof HeroData>(k: K, v: HeroData[K]) {
    setData(p => ({ ...p, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hero', value: data }),
      });
      setSaved(true);
    } catch {}
    setSaving(false);
  }

  function addPill() {
    if (!newPill.trim()) return;
    up('pills', [...data.pills, newPill.trim()]);
    setNewPill('');
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'text',       label: 'Text & CTAs' },
    { id: 'design',     label: 'Colors & Style' },
    { id: 'media',      label: 'Images & Video' },
    { id: 'animations', label: 'Animations' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Hero Section Editor</h1>
          <p className="text-white/50 text-sm mt-1">Changes go live when you click Save & Publish</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs tracking-wide uppercase px-4 py-2.5 rounded transition-colors">
            <Eye size={13} /> Preview
          </a>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-wine-600 hover:bg-wine-700 disabled:opacity-60 text-white text-xs tracking-[0.16em] uppercase font-medium px-5 py-2.5 rounded transition-colors">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded text-xs tracking-[0.14em] uppercase font-medium transition-all ${
              tab === t.id ? 'bg-wine-600 text-white' : 'text-white/50 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Editor panels ── */}
        <div className="space-y-5">

          {/* TEXT TAB */}
          {tab === 'text' && (
            <div className="space-y-5">
              <Field label="Badge Text (live indicator pill)">
                <input value={data.badge} onChange={e => up('badge', e.target.value)} className="admin-input" placeholder="Eldoret's Luxury Fragrance House" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Heading Line 1">
                  <input value={data.heading1} onChange={e => up('heading1', e.target.value)} className="admin-input" placeholder="Your story," />
                </Field>
                <Field label="Heading Line 2 (italic, wine red)">
                  <input value={data.heading2} onChange={e => up('heading2', e.target.value)} className="admin-input" placeholder="begins to bloom." />
                </Field>
              </div>
              <Field label="Body Text">
                <textarea rows={3} value={data.subtext} onChange={e => up('subtext', e.target.value)} className="admin-input resize-none" />
              </Field>
              <Field label="Location Tagline (below body)">
                <input value={data.tagline} onChange={e => up('tagline', e.target.value)} className="admin-input" />
              </Field>

              <div className="border-t border-white/10 pt-5">
                <h3 className="text-sm font-medium text-white mb-4">Call to Action Buttons</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Primary Button Label">
                    <input value={data.cta1Label} onChange={e => up('cta1Label', e.target.value)} className="admin-input" />
                  </Field>
                  <Field label="Primary Button Link">
                    <input value={data.cta1Link} onChange={e => up('cta1Link', e.target.value)} className="admin-input" placeholder="/shop" />
                  </Field>
                  <Field label="Secondary Button Label">
                    <input value={data.cta2Label} onChange={e => up('cta2Label', e.target.value)} className="admin-input" />
                  </Field>
                  <Field label="Secondary Button Link">
                    <input value={data.cta2Link} onChange={e => up('cta2Link', e.target.value)} className="admin-input" placeholder="/about" />
                  </Field>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <h3 className="text-sm font-medium text-white mb-4">Floating Scent Pills</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {data.pills.map((pill, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full">
                      {pill}
                      <button onClick={() => up('pills', data.pills.filter((_,j) => j !== i))} className="text-white/40 hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newPill} onChange={e => setNewPill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPill()}
                    placeholder="Add scent note…" className="admin-input flex-1 text-sm py-2" />
                  <button onClick={addPill} className="bg-wine-600 hover:bg-wine-700 text-white px-4 py-2 rounded text-xs transition-colors flex items-center gap-1">
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <h3 className="text-sm font-medium text-white mb-4">Trust / Stats Row</h3>
                {data.trustItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 mb-3">
                    <input value={item.label} onChange={e => {
                      const t = [...data.trustItems]; t[i] = { ...t[i], label: e.target.value }; up('trustItems', t);
                    }} placeholder="Label" className="admin-input text-sm py-2" />
                    <input value={item.sub} onChange={e => {
                      const t = [...data.trustItems]; t[i] = { ...t[i], sub: e.target.value }; up('trustItems', t);
                    }} placeholder="Sub-label" className="admin-input text-sm py-2" />
                    <button onClick={() => up('trustItems', data.trustItems.filter((_,j) => j !== i))}
                      className="text-white/30 hover:text-red-400 transition-colors p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => up('trustItems', [...data.trustItems, { label:'', sub:'' }])}
                  className="text-xs text-wine-400 hover:text-wine-300 flex items-center gap-1 transition-colors">
                  <Plus size={12} /> Add row
                </button>
              </div>
            </div>
          )}

          {/* DESIGN TAB */}
          {tab === 'design' && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-white">Background Gradient</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  ['bgFrom','From (top-left)', data.bgFrom],
                  ['bgMid', 'Mid',             data.bgMid],
                  ['bgTo',  'To (bottom-right)',data.bgTo],
                ].map(([key, label, val]) => (
                  <Field key={key} label={label as string}>
                    <div className="flex gap-2">
                      <input type="color" value={val} onChange={e => up(key as keyof HeroData, e.target.value as HeroData[keyof HeroData])}
                        className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer flex-shrink-0" />
                      <input value={val} onChange={e => up(key as keyof HeroData, e.target.value as HeroData[keyof HeroData])}
                        className="admin-input font-mono text-sm" placeholder="#FDFBF8" />
                    </div>
                  </Field>
                ))}
              </div>
              {/* Live preview swatch */}
              <div className="rounded-lg overflow-hidden h-20 border border-white/10"
                style={{ background: `linear-gradient(145deg, ${data.bgFrom} 0%, ${data.bgMid} 50%, ${data.bgTo} 100%)` }}>
                <div className="h-full flex items-center justify-center text-xs text-stone/60 tracking-wide">
                  Background preview
                </div>
              </div>
            </div>
          )}

          {/* MEDIA TAB */}
          {tab === 'media' && (
            <div className="space-y-6">
              <div className="bg-white/[0.04] border border-white/10 rounded-lg p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Image size={15} /> Hero Image / Video
                </h3>
                <div className="space-y-4">
                  <Toggle label="Use video instead of bottle SVG" checked={data.useVideo} onChange={v => up('useVideo', v)} />
                  {data.useVideo ? (
                    <Field label="Video URL (YouTube embed or direct .mp4)">
                      <input value={data.videoUrl} onChange={e => up('videoUrl', e.target.value)}
                        className="admin-input" placeholder="https://youtube.com/embed/..." />
                    </Field>
                  ) : (
                    <Field label="Custom Hero Image URL (leave blank to use animated bottle)">
                      <input value={data.heroImageUrl} onChange={e => up('heroImageUrl', e.target.value)}
                        className="admin-input" placeholder="https://..." />
                    </Field>
                  )}
                  <div className="border-2 border-dashed border-white/15 rounded-lg p-10 text-center hover:border-white/30 transition-colors cursor-pointer">
                    <Upload size={28} className="mx-auto text-white/30 mb-3" />
                    <p className="text-sm text-white/50 mb-1">Drag & drop or click to upload</p>
                    <p className="text-xs text-white/30">PNG, JPG, MP4 · Max 25 MB</p>
                    <p className="text-xs text-white/25 mt-3">
                      Upload images to the <a href="/admin/media" className="text-wine-400 hover:text-wine-300">Media Library</a> and paste the URL above
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANIMATIONS TAB */}
          {tab === 'animations' && (
            <div className="space-y-4 bg-white/[0.04] border border-white/10 rounded-lg p-5">
              <h3 className="text-sm font-medium text-white mb-4">Animation Elements</h3>
              <Toggle label="Show floating particles" checked={data.showParticles} onChange={v => up('showParticles', v)} />
              <Toggle label="Show orbit rings around bottle" checked={data.showOrbitRings} onChange={v => up('showOrbitRings', v)} />
              <Toggle label="Show star rating badge" checked={data.showRatingBadge} onChange={v => up('showRatingBadge', v)} />
              <div className="mt-4 p-4 bg-white/[0.04] rounded-lg border border-white/10">
                <p className="text-xs text-white/40 leading-relaxed">
                  All animations respect the visitor's OS-level "reduce motion" preference and are automatically disabled for accessibility.
                  The bottle SVG automatically uses the colour of whatever product you feature in the hero.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Live preview panel ── */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs tracking-[0.14em] uppercase text-white/50">Live Preview</span>
              <a href="/" target="_blank" className="text-xs text-wine-400 hover:text-wine-300 flex items-center gap-1 transition-colors">
                <Eye size={11} /> Full preview
              </a>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded text-[0.55rem] font-medium tracking-[0.2em] uppercase text-center py-1 border"
                style={{ color:'rgb(176,40,55)', borderColor:'rgb(176,40,55,0.3)', background:'rgb(176,40,55,0.06)' }}>
                ● {data.badge}
              </div>
              <div className="font-display text-xl text-white leading-tight">
                {data.heading1}<br />
                <em className="text-wine-400 font-light">{data.heading2}</em>
              </div>
              <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{data.subtext}</p>
              <div className="flex gap-2 flex-wrap">
                <div className="bg-wine-600 text-white text-[0.58rem] tracking-[0.15em] uppercase px-3 py-1.5 rounded">{data.cta1Label}</div>
                <div className="border border-white/30 text-white text-[0.58rem] tracking-[0.15em] uppercase px-3 py-1.5 rounded">{data.cta2Label}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.pills.slice(0,5).map((p,i) => (
                  <span key={i} className="text-[0.55rem] tracking-[0.18em] uppercase text-wine-400 border border-wine-400/30 bg-wine-600/10 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 pt-2 border-t border-white/10">
                {data.trustItems.map((t,i) => (
                  <div key={i} className="text-center">
                    <div className="text-[0.58rem] uppercase tracking-wide text-white font-medium">{t.label}</div>
                    <div className="text-[0.55rem] text-white/40">{t.sub}</div>
                  </div>
                ))}
              </div>
              <div className="rounded h-6 mt-2" style={{
                background: `linear-gradient(145deg, ${data.bgFrom} 0%, ${data.bgMid} 50%, ${data.bgTo} 100%)`
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.65rem] tracking-[0.18em] uppercase text-white/45 mb-2 font-medium">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-2">
      <span className="text-sm text-white/75">{label}</span>
      <div onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-wine-600' : 'bg-white/20'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}
