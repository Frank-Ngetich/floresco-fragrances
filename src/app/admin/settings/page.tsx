'use client';
import { useState, useEffect } from 'react';
import { Save, RefreshCw, Check, Building, CreditCard, Bell, Palette, Globe, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamManager } from '@/components/admin/TeamManager';

type Tab = 'business'|'payments'|'notifications'|'appearance'|'team'|'advanced';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id:'business',      label:'Business Info',    icon: Building },
  { id:'payments',      label:'Payment Methods',  icon: CreditCard },
  { id:'notifications', label:'Notifications',    icon: Bell },
  { id:'appearance',    label:'Appearance',       icon: Palette },
  { id:'team',          label:'Team',             icon: Users },
  { id:'advanced',      label:'Advanced',         icon: Shield },
];

export default function AdminSettings() {
  const [tab,      setTab]      = useState<Tab>('business');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(true);

  const [business, setBusiness] = useState({
    name:    'Floresco Fragrances & Accessories',
    tagline: "Eldoret's Luxury Fragrance House",
    email:   'hello@florescofragrances.co.ke',
    phone:   '+254 7XX XXX XXX',
    whatsapp:'+254 7XX XXX XXX',
    address: 'Kapsoya Business Park, Eldoret, Uasin Gishu County',
    city:    'Eldoret',
    county:  'Uasin Gishu',
    country: 'Kenya',
    instagram:'florescofragrances',
    facebook: 'florescofragrances',
    tiktok:   '',
    twitter:  '',
  });

  const [payments, setPayments] = useState({
    mpesaEnabled:   true,
    mpesaShortcode: '174379',
    cardEnabled:    true,
    codEnabled:     true,
    codMaxAmount:   15000,
    bankEnabled:    true,
    bankName:       'Equity Bank',
    bankAccount:    '0123456789',
    bankBranch:     'Eldoret',
    freeDeliveryMin:10000,
    eldoretFee:     0,
    nairobi:        500,
    national:       600,
  });

  const [notifs, setNotifs] = useState({
    emailEnabled:    true,
    whatsappEnabled: true,
    resendKey:       '',
    fromEmail:       'orders@florescofragrances.co.ke',
    fromName:        'Floresco',
    waToken:         '',
    waPhoneId:       '',
    orderConfirm:    true,
    orderShipped:    true,
    orderDelivered:  true,
    lowStockAlert:   true,
    lowStockThreshold: 5,
    newInquiryAlert: true,
  });

  const [appearance, setAppearance] = useState({
    primaryColor:    '#B02837',
    secondaryColor:  '#B5924C',
    logoUrl:         '',
    faviconUrl:      '',
    announcementBar: true,
    announcementText:'Complimentary delivery in Eldoret · Countrywide via courier · Pay via M-Pesa',
    footerText:      '© 2026 Floresco Fragrances & Accessories · Kapsoya Business Park, Eldoret, Kenya',
    maintenanceMode: false,
  });

  useEffect(() => {
    fetch('/api/admin/site-settings?key=settings')
      .then(r => r.json())
      .then(d => {
        const v = d?.value;
        if (v) {
          if (v.business)    setBusiness(p => ({ ...p, ...v.business }));
          if (v.payments)    setPayments(p => ({ ...p, ...v.payments }));
          if (v.notifs)      setNotifs(p => ({ ...p, ...v.notifs }));
          if (v.appearance)  setAppearance(p => ({ ...p, ...v.appearance }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'settings', value: { business, payments, notifs, appearance } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  function upB(k: string, v: string | number | boolean) { setBusiness(p => ({ ...p, [k]: v })); setSaved(false); }
  function upP(k: string, v: string | number | boolean) { setPayments(p => ({ ...p, [k]: v })); setSaved(false); }
  function upN(k: string, v: string | number | boolean) { setNotifs(p => ({ ...p, [k]: v })); setSaved(false); }
  function upA(k: string, v: string | boolean) { setAppearance(p => ({ ...p, [k]: v })); setSaved(false); }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Site Settings</h1>
          <p className="text-white/50 text-sm mt-1">Configure your store — changes apply immediately after saving</p>
        </div>
        <button onClick={save} disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-wine-600 hover:bg-wine-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2.5 rounded transition-colors self-start">
          {saving ? <RefreshCw size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
          {loading ? 'Loading…' : saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs — vertical on desktop, horizontal scrollable on mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:w-48 flex-shrink-0 bg-white/[0.03] rounded-lg p-2 lg:self-start">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded text-sm whitespace-nowrap text-left transition-all flex-shrink-0',
                tab===t.id ? 'bg-wine-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.05]')}>
              <t.icon size={15} strokeWidth={1.6} className="flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">

          {/* BUSINESS */}
          {tab === 'business' && (
            <Section title="Business Information">
              <Grid2>
                <F label="Business Name"><input value={business.name} onChange={e => upB('name',e.target.value)} className="admin-input" /></F>
                <F label="Tagline"><input value={business.tagline} onChange={e => upB('tagline',e.target.value)} className="admin-input" /></F>
                <F label="Email"><input type="email" value={business.email} onChange={e => upB('email',e.target.value)} className="admin-input" /></F>
                <F label="Phone"><input value={business.phone} onChange={e => upB('phone',e.target.value)} className="admin-input" /></F>
                <F label="WhatsApp"><input value={business.whatsapp} onChange={e => upB('whatsapp',e.target.value)} className="admin-input" /></F>
                <F label="City"><input value={business.city} onChange={e => upB('city',e.target.value)} className="admin-input" /></F>
              </Grid2>
              <F label="Full Address">
                <textarea rows={2} value={business.address} onChange={e => upB('address',e.target.value)} className="admin-input resize-none" />
              </F>
              <div className="border-t border-white/10 pt-5 mt-5">
                <div className="text-xs uppercase tracking-[0.16em] text-white/40 mb-4">Social Media Handles</div>
                <Grid2>
                  <F label="Instagram"><input value={business.instagram} onChange={e => upB('instagram',e.target.value)} className="admin-input" placeholder="username (no @)" /></F>
                  <F label="Facebook"><input value={business.facebook} onChange={e => upB('facebook',e.target.value)} className="admin-input" placeholder="page name" /></F>
                  <F label="TikTok"><input value={business.tiktok} onChange={e => upB('tiktok',e.target.value)} className="admin-input" placeholder="username (no @)" /></F>
                  <F label="Twitter / X"><input value={business.twitter} onChange={e => upB('twitter',e.target.value)} className="admin-input" placeholder="handle (no @)" /></F>
                </Grid2>
              </div>
            </Section>
          )}

          {/* PAYMENTS */}
          {tab === 'payments' && (
            <div className="space-y-5">
              <Section title="M-Pesa (Daraja)">
                <Toggle label="Enable M-Pesa STK Push" checked={payments.mpesaEnabled} onChange={v => upP('mpesaEnabled',v)} />
                {payments.mpesaEnabled && (
                  <F label="Business Shortcode">
                    <input value={payments.mpesaShortcode} onChange={e => upP('mpesaShortcode',e.target.value)} className="admin-input font-mono" />
                  </F>
                )}
              </Section>
              <Section title="Card Payments (Flutterwave)">
                <Toggle label="Enable card payments" checked={payments.cardEnabled} onChange={v => upP('cardEnabled',v)} />
              </Section>
              <Section title="Cash on Delivery">
                <Toggle label="Enable COD" checked={payments.codEnabled} onChange={v => upP('codEnabled',v)} />
                {payments.codEnabled && (
                  <F label="Maximum order value for COD (KES)">
                    <input type="number" value={payments.codMaxAmount} onChange={e => upP('codMaxAmount',+e.target.value)} className="admin-input" />
                  </F>
                )}
              </Section>
              <Section title="Bank Transfer">
                <Toggle label="Enable bank transfer" checked={payments.bankEnabled} onChange={v => upP('bankEnabled',v)} />
                {payments.bankEnabled && (
                  <Grid2>
                    <F label="Bank Name"><input value={payments.bankName} onChange={e => upP('bankName',e.target.value)} className="admin-input" /></F>
                    <F label="Account Number"><input value={payments.bankAccount} onChange={e => upP('bankAccount',e.target.value)} className="admin-input font-mono" /></F>
                    <F label="Branch"><input value={payments.bankBranch} onChange={e => upP('bankBranch',e.target.value)} className="admin-input" /></F>
                  </Grid2>
                )}
              </Section>
              <Section title="Delivery Fees (KES)">
                <Grid2>
                  <F label="Free delivery minimum (0 = always paid)"><input type="number" value={payments.freeDeliveryMin} onChange={e => upP('freeDeliveryMin',+e.target.value)} className="admin-input" /></F>
                  <F label="Eldoret town fee"><input type="number" value={payments.eldoretFee} onChange={e => upP('eldoretFee',+e.target.value)} className="admin-input" /></F>
                  <F label="Nairobi fee"><input type="number" value={payments.nairobi} onChange={e => upP('nairobi',+e.target.value)} className="admin-input" /></F>
                  <F label="National / other counties"><input type="number" value={payments.national} onChange={e => upP('national',+e.target.value)} className="admin-input" /></F>
                </Grid2>
              </Section>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <Section title="Email (Resend)">
                <Toggle label="Enable email notifications" checked={notifs.emailEnabled} onChange={v => upN('emailEnabled',v)} />
                {notifs.emailEnabled && (
                  <Grid2>
                    <F label="Resend API Key"><input value={notifs.resendKey} onChange={e => upN('resendKey',e.target.value)} className="admin-input font-mono text-sm" placeholder="re_xxxxxxxxx" /></F>
                    <F label="From Email"><input value={notifs.fromEmail} onChange={e => upN('fromEmail',e.target.value)} className="admin-input" /></F>
                    <F label="From Name"><input value={notifs.fromName} onChange={e => upN('fromName',e.target.value)} className="admin-input" /></F>
                  </Grid2>
                )}
              </Section>
              <Section title="WhatsApp Business API">
                <Toggle label="Enable WhatsApp notifications" checked={notifs.whatsappEnabled} onChange={v => upN('whatsappEnabled',v)} />
                {notifs.whatsappEnabled && (
                  <Grid2>
                    <F label="Access Token"><input value={notifs.waToken} onChange={e => upN('waToken',e.target.value)} className="admin-input font-mono text-sm" placeholder="EAAxxxxxxx…" /></F>
                    <F label="Phone Number ID"><input value={notifs.waPhoneId} onChange={e => upN('waPhoneId',e.target.value)} className="admin-input font-mono" /></F>
                  </Grid2>
                )}
              </Section>
              <Section title="Triggers">
                {[
                  ['orderConfirm','Order confirmation'],
                  ['orderShipped','Order shipped'],
                  ['orderDelivered','Order delivered'],
                  ['lowStockAlert','Low stock alert'],
                  ['newInquiryAlert','New customer inquiry'],
                ].map(([k,l]) => (
                  <Toggle key={k} label={l as string} checked={notifs[k as keyof typeof notifs] as boolean} onChange={v => upN(k as string, v)} />
                ))}
                <F label="Low stock threshold (units)">
                  <input type="number" value={notifs.lowStockThreshold} onChange={e => upN('lowStockThreshold',+e.target.value)} className="admin-input w-32" />
                </F>
              </Section>
            </div>
          )}

          {/* APPEARANCE */}
          {tab === 'appearance' && (
            <div className="space-y-5">
              <Section title="Brand Colors">
                <Grid2>
                  <F label="Primary Color (Wine Red)">
                    <div className="flex gap-2">
                      <input type="color" value={appearance.primaryColor} onChange={e => upA('primaryColor',e.target.value)}
                        className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer" />
                      <input value={appearance.primaryColor} onChange={e => upA('primaryColor',e.target.value)} className="admin-input font-mono" />
                    </div>
                  </F>
                  <F label="Gold Accent Color">
                    <div className="flex gap-2">
                      <input type="color" value={appearance.secondaryColor} onChange={e => upA('secondaryColor',e.target.value)}
                        className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer" />
                      <input value={appearance.secondaryColor} onChange={e => upA('secondaryColor',e.target.value)} className="admin-input font-mono" />
                    </div>
                  </F>
                </Grid2>
              </Section>
              <Section title="Logo & Favicon">
                <Grid2>
                  <F label="Logo URL"><input value={appearance.logoUrl} onChange={e => upA('logoUrl',e.target.value)} className="admin-input" placeholder="Leave blank to use text logo" /></F>
                  <F label="Favicon URL"><input value={appearance.faviconUrl} onChange={e => upA('faviconUrl',e.target.value)} className="admin-input" /></F>
                </Grid2>
                <p className="text-xs text-white/35">
                  Homepage hero text, photo/video and layout are managed separately in <a href="/admin/hero" className="text-wine-400 hover:text-wine-300">Hero Section Editor</a>.
                </p>
              </Section>
              <Section title="Announcement Bar">
                <Toggle label="Show announcement bar" checked={appearance.announcementBar} onChange={v => upA('announcementBar',v)} />
                {appearance.announcementBar && (
                  <F label="Announcement Text">
                    <input value={appearance.announcementText} onChange={e => upA('announcementText',e.target.value)} className="admin-input" />
                  </F>
                )}
              </Section>
              <Section title="Footer">
                <F label="Footer Copyright Text">
                  <input value={appearance.footerText} onChange={e => upA('footerText',e.target.value)} className="admin-input" />
                </F>
              </Section>
              <Section title="Maintenance">
                <Toggle label="Enable maintenance mode (hides store from public)" checked={appearance.maintenanceMode} onChange={v => upA('maintenanceMode',v)} />
                {appearance.maintenanceMode && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-300">
                    ⚠️ Store is currently in maintenance mode. Visitors will see a "coming soon" page. Admin login still works.
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* TEAM */}
          {tab === 'team' && <TeamManager />}

          {/* ADVANCED */}
          {tab === 'advanced' && (
            <Section title="Advanced Settings">
              <div className="space-y-4 text-sm">
                <div className="bg-white/[0.04] border border-white/10 rounded-lg p-5">
                  <div className="font-medium text-white mb-2">Site URL</div>
                  <code className="text-xs text-white/50">Set NEXT_PUBLIC_SITE_URL in your .env.local</code>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-lg p-5">
                  <div className="font-medium text-white mb-2">Database</div>
                  <code className="text-xs text-white/50">MONGODB_URI configured in .env.local</code>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-lg p-5">
                  <div className="font-medium text-white mb-2">Auth Secret</div>
                  <code className="text-xs text-white/50">AUTH_SECRET configured in .env.local</code>
                </div>
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-5">
                  <div className="font-medium text-red-300 mb-2">Danger Zone</div>
                  <p className="text-xs text-white/40 mb-3">These actions cannot be undone.</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded transition-colors">
                      Clear All Sessions
                    </button>
                    <button className="text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded transition-colors">
                      Reset Cached Data
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-medium text-white pb-3 border-b border-white/10">{title}</h3>
      {children}
    </div>
  );
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">{label}</label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-1.5">
      <span className="text-sm text-white/70">{label}</span>
      <div onClick={() => onChange(!checked)}
        className={cn('relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0', checked ? 'bg-wine-600' : 'bg-white/15')}>
        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', checked ? 'left-5' : 'left-0.5')} />
      </div>
    </label>
  );
}
