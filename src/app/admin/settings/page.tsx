'use client';
import { useState, useEffect } from 'react';
import { Save, RefreshCw, Check, CreditCard, Bell, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamManager } from '@/components/admin/TeamManager';

type Tab = 'payments'|'notifications'|'team'|'advanced';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id:'payments',      label:'Payment Methods',  icon: CreditCard },
  { id:'notifications', label:'Notifications',    icon: Bell },
  { id:'team',          label:'Team',             icon: Users },
  { id:'advanced',      label:'Advanced',         icon: Shield },
];

export default function AdminSettings() {
  const [tab,      setTab]      = useState<Tab>('payments');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(true);

  const [payments, setPayments] = useState({
    mpesaEnabled:   true,
    mpesaShortcode: '174379',
    cardEnabled:    false,
    codEnabled:     true,
    codMaxAmount:   15000,
    bankEnabled:    false,
    bankName:       '',
    bankAccount:    '',
    bankBranch:     '',
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

  useEffect(() => {
    fetch('/api/admin/site-settings?key=settings')
      .then(r => r.json())
      .then(d => {
        const v = d?.value;
        if (v) {
          if (v.payments) setPayments(p => ({ ...p, ...v.payments }));
          if (v.notifs)   setNotifs(p => ({ ...p, ...v.notifs }));
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
        body: JSON.stringify({ key: 'settings', value: { payments, notifs } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  function upP(k: string, v: string | number | boolean) { setPayments(p => ({ ...p, [k]: v })); setSaved(false); }
  function upN(k: string, v: string | number | boolean) { setNotifs(p => ({ ...p, [k]: v })); setSaved(false); }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Site Settings</h1>
          <p className="text-white/50 text-sm mt-1">Store operations — branding and page content are managed by your developer</p>
        </div>
        <button onClick={save} disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2.5 rounded transition-colors self-start">
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
                tab===t.id ? 'bg-gold-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.05]')}>
              <t.icon size={15} strokeWidth={1.6} className="flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">

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
                <p className="text-xs text-white/35">Not yet connected — talk to your developer before enabling this.</p>
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
                <p className="text-xs text-white/35 mb-2">Not yet connected — talk to your developer before enabling this.</p>
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
        className={cn('relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0', checked ? 'bg-gold-600' : 'bg-white/15')}>
        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', checked ? 'left-5' : 'left-0.5')} />
      </div>
    </label>
  );
}
