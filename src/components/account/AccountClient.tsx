'use client';
import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Package, Heart, MapPin, User, LogOut, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { formatKES } from '@/lib/utils';

const T = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

/* ─── Auth Panel ─────────────────────────────────────── */
function AuthPanel() {
  const router      = useRouter();
  const params      = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/account';
  const [tab,      setTab]      = useState<'login' | 'register'>('login');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });
  const up = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    setLoading(true); setError('');
    const res = await signIn('credentials', {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Incorrect email or password. Please try again.');
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      setError('Name, email and password are required.'); return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed. Please try again.'); }
      else {
        setSuccess('Account created! Signing you in…');
        await signIn('credentials', {
          email: form.email.trim().toLowerCase(),
          password: form.password,
          redirect: false,
        });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <div className="eyebrow mb-4">Welcome</div>
          <h1 className="font-display text-4xl">My Account</h1>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-stone/10 mb-8">
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={`flex-1 py-3.5 text-[0.7rem] tracking-[0.2em] uppercase font-medium border-b-2 -mb-px transition-all
                ${tab === t ? 'border-wine-600 text-wine-600' : 'border-transparent text-stone/40 hover:text-stone'}`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Error / Success banners */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-6">
              <Check size={15} /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={T} onSubmit={handleLogin} className="space-y-4">
              <Field label="Email *">
                <input type="email" required autoComplete="email"
                  value={form.email} onChange={e => up('email', e.target.value)}
                  className="input-luxury" placeholder="you@example.com" />
              </Field>
              <Field label="Password *">
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                    value={form.password} onChange={e => up('password', e.target.value)}
                    className="input-luxury pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone/35 hover:text-stone transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <div className="flex justify-end">
                <button type="button" className="text-[0.72rem] text-wine-600 hover:opacity-70 transition-opacity">
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-60">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-[0.8rem] text-stone/50 pt-2">
                New to Floresco?{' '}
                <button type="button" onClick={() => setTab('register')}
                  className="text-wine-600 font-medium hover:opacity-70">Create account</button>
              </p>
            </motion.form>
          ) : (
            <motion.form key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={T} onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *">
                  <input required value={form.firstName} onChange={e => up('firstName', e.target.value)}
                    className="input-luxury" placeholder="Amina" />
                </Field>
                <Field label="Last Name">
                  <input value={form.lastName} onChange={e => up('lastName', e.target.value)}
                    className="input-luxury" placeholder="Kiptoo" />
                </Field>
              </div>
              <Field label="Email *">
                <input type="email" required autoComplete="email"
                  value={form.email} onChange={e => up('email', e.target.value)}
                  className="input-luxury" placeholder="you@example.com" />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={e => up('phone', e.target.value)}
                  className="input-luxury" placeholder="+254 7XX XXX XXX" />
              </Field>
              <Field label="Password * (min 8 characters)">
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required autoComplete="new-password"
                    value={form.password} onChange={e => up('password', e.target.value)}
                    className="input-luxury pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone/35 hover:text-stone transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="text-center text-[0.8rem] text-stone/50 pt-2">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')}
                  className="text-wine-600 font-medium hover:opacity-70">Sign in</button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Order Status Badge ────────────────────────────── */
const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packed:    'bg-purple-50 text-purple-700 border-purple-200',
  shipped:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-stone/5 text-stone/50 border-stone/15',
};

/* ─── Dashboard ─────────────────────────────────────── */
function Dashboard({ session }: { session: { user: { name?: string | null; email?: string | null } } }) {
  const [section,  setSection]  = useState<'orders' | 'wishlist' | 'addresses' | 'profile'>('orders');
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loadingO, setLoadingO] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [profile, setProfile] = useState({
    name: session.user.name || '',
    email: session.user.email || '',
    phone: '',
  });
  const firstName = (session.user.name || 'there').split(' ')[0];

  useEffect(() => {
    if (section !== 'orders') return;
    setLoadingO(true);
    fetch('/api/account/orders')
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingO(false));
  }, [section]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  const NAV = [
    { id: 'orders'    as const, icon: Package, label: 'My Orders' },
    { id: 'wishlist'  as const, icon: Heart,   label: 'Wishlist' },
    { id: 'addresses' as const, icon: MapPin,  label: 'Addresses' },
    { id: 'profile'   as const, icon: User,    label: 'Profile' },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 min-h-[70vh]">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="eyebrow mb-2">My Account</div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">Welcome back, {firstName}.</h1>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 text-[0.7rem] tracking-wide uppercase text-stone/40 hover:text-wine-600 transition-colors">
          <LogOut size={14} strokeWidth={1.5} /> Sign Out
        </button>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-10">
        {/* Sidebar nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 text-sm transition-all text-left border-l-2
                ${section === id
                  ? 'border-wine-600 text-wine-600 bg-wine-50 font-medium'
                  : 'border-transparent text-stone/55 hover:text-stone hover:border-stone/15'}`}>
              <Icon size={15} strokeWidth={1.5} />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={T}>

            {/* ORDERS */}
            {section === 'orders' && (
              <div>
                <h2 className="font-display text-2xl mb-6">Order History</h2>
                {loadingO ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-stone/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 border border-stone/10">
                    <Package size={36} strokeWidth={1} className="mx-auto mb-4 text-stone/20" />
                    <p className="text-stone/50 mb-6 text-sm">No orders yet.</p>
                    <Link href="/shop" className="btn-primary">Shop the Collection</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o: any) => (
                      <Link key={o._id || o.orderNumber} href={`/orders/${o.orderNumber}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-stone/10 hover:border-wine-200 transition-colors group">
                        <div>
                          <div className="font-mono font-medium text-sm mb-0.5">{o.orderNumber}</div>
                          <div className="text-stone/40 text-xs">
                            {new Date(o.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-sm text-stone/55 mt-1 max-w-xs truncate">
                            {o.items?.map((i: any) => `${i.name} ${i.size}`).join(' · ')}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-3">
                          <div className="font-display text-lg">{formatKES(o.total)}</div>
                          <span className={`text-[0.6rem] tracking-[0.18em] uppercase font-medium px-2.5 py-1 border
                            ${STATUS_STYLE[o.status] || STATUS_STYLE.pending}`}>
                            {o.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST */}
            {section === 'wishlist' && (
              <div className="text-center py-16 border border-stone/10">
                <Heart size={36} strokeWidth={1} className="mx-auto mb-4 text-stone/20" />
                <p className="text-stone/50 mb-6 text-sm">Your wishlist is empty. Heart items to save them here.</p>
                <Link href="/shop" className="btn-primary">Browse Collection</Link>
              </div>
            )}

            {/* ADDRESSES */}
            {section === 'addresses' && (
              <div className="text-center py-16 border border-stone/10">
                <MapPin size={36} strokeWidth={1} className="mx-auto mb-4 text-stone/20" />
                <p className="text-stone/50 mb-6 text-sm">No saved addresses yet.</p>
                <button className="btn-primary">Add Address</button>
              </div>
            )}

            {/* PROFILE */}
            {section === 'profile' && (
              <div>
                <h2 className="font-display text-2xl mb-6">Profile Settings</h2>
                <form onSubmit={saveProfile} className="space-y-5 max-w-md">
                  <Field label="Full Name">
                    <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      className="input-luxury" />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      className="input-luxury" />
                  </Field>
                  <Field label="Phone">
                    <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className="input-luxury" placeholder="+254 7XX XXX XXX" />
                  </Field>
                  <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                    {saving ? 'Saving…' : saved ? <><Check size={14} /> Saved</> : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Root export ───────────────────────────────────── */
export function AccountClient() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-wine-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return session ? <Dashboard session={session as any} /> : <AuthPanel />;
}

/* ─── Helper ────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2 font-medium">{label}</label>
      {children}
    </div>
  );
}
