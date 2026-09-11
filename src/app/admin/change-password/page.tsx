'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { KeyRound, Check, AlertTriangle, X } from 'lucide-react';
import { passwordChecklist, isPasswordStrong } from '@/lib/password';

export default function ForcedChangePassword() {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isPasswordStrong(next)) { setError('Please choose a stronger password — see the requirements below.'); return; }
    if (next !== confirm) { setError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change password.'); setSaving(false); return; }
      setDone(true);
      setTimeout(() => signOut({ callbackUrl: '/account' }), 1800);
    } catch {
      setError('Network error. Please try again.');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-3 rounded-lg flex items-start gap-2.5 mb-8">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
        <span>For security, you must set a new password before continuing to the admin panel.</span>
      </div>

      {done ? (
        <div className="bg-white/[0.04] border border-white/10 rounded-lg p-8 text-center">
          <Check size={32} className="mx-auto mb-4 text-green-400" />
          <p className="text-white">Password updated. Signing you out — please sign back in.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white/[0.04] border border-white/10 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Current (temporary) Password</label>
            <input type="password" required value={current} onChange={e => setCurrent(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">New Password</label>
            <input type="password" required value={next} onChange={e => setNext(e.target.value)} className="admin-input" />
            {next && (
              <ul className="mt-2.5 space-y-1">
                {passwordChecklist(next).map(r => (
                  <li key={r.key} className={`flex items-center gap-1.5 text-[0.72rem] transition-colors ${r.met ? 'text-green-400' : 'text-white/35'}`}>
                    {r.met ? <Check size={11} /> : <X size={11} />} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Confirm New Password</label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="admin-input" />
            {confirm && confirm !== next && (
              <p className="mt-1.5 text-[0.72rem] text-red-400">Passwords do not match.</p>
            )}
          </div>
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium py-3 rounded transition-colors">
            <KeyRound size={13} /> {saving ? 'Updating…' : 'Set New Password'}
          </button>
        </form>
      )}
    </div>
  );
}
