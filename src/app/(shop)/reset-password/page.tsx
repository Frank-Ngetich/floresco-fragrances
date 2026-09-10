'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to reset password.'); setSaving(false); return; }
      setDone(true);
      setTimeout(() => router.push('/account'), 2000);
    } catch {
      setError('Network error. Please try again.');
    }
    setSaving(false);
  }

  if (!token || !email) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-4">Invalid Reset Link</h1>
          <p className="text-stone/50 mb-8">This password reset link is missing information. Please request a new one.</p>
          <Link href="/account" className="btn-primary">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <div className="eyebrow mb-4">Account Security</div>
          <h1 className="font-display text-4xl">Reset Password</h1>
        </div>

        {done ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-4">
            <Check size={16} /> Password updated. Redirecting you to sign in…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2 font-medium">New Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-luxury pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone/35 hover:text-stone transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-stone/40 mb-2 font-medium">Confirm New Password *</label>
              <input type={showPw ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="input-luxury" placeholder="••••••••" />
            </div>
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-2 disabled:opacity-60">
              {saving ? 'Updating…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
