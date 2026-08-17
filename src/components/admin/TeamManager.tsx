'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, RefreshCw, Trash2, KeyRound, Copy, Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TeamRole = 'staff' | 'manager' | 'owner';
interface Member { _id: string; name: string; email: string; role: TeamRole; createdAt?: string }

const ROLES: { id: TeamRole; label: string }[] = [
  { id: 'staff',   label: 'Staff' },
  { id: 'manager', label: 'Manager' },
  { id: 'owner',   label: 'Owner' },
];

export function TeamManager() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string } | undefined)?.id;

  const [team,    setTeam]    = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busyId,  setBusyId]  = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'staff' as TeamRole });
  const [creating, setCreating] = useState(false);

  const [reveal, setReveal] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const loadTeam = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(d => setTeam(Array.isArray(d.team) ? d.team : []))
      .catch(() => setError('Could not load the team list.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  async function createMember() {
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create account.'); setCreating(false); return; }
      setReveal({ name: form.name, email: form.email, password: data.tempPassword });
      setForm({ name: '', email: '', role: 'staff' });
      setShowForm(false);
      loadTeam();
    } catch {
      setError('Network error — could not reach the server.');
    }
    setCreating(false);
  }

  async function changeRole(member: Member, role: TeamRole) {
    if (role === member.role) return;
    setError('');
    setBusyId(member._id);
    try {
      const res = await fetch(`/api/admin/team/${member._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change role.'); }
      loadTeam();
    } catch {
      setError('Network error — could not reach the server.');
    }
    setBusyId(null);
  }

  async function resetPassword(member: Member) {
    setError('');
    setBusyId(member._id);
    try {
      const res = await fetch(`/api/admin/team/${member._id}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to reset password.'); setBusyId(null); return; }
      setReveal({ name: member.name, email: member.email, password: data.tempPassword });
    } catch {
      setError('Network error — could not reach the server.');
    }
    setBusyId(null);
  }

  async function removeMember(member: Member) {
    setError('');
    setBusyId(member._id);
    try {
      const res = await fetch(`/api/admin/team/${member._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to remove team member.'); }
      else { setTeam(t => t.filter(m => m._id !== member._id)); }
    } catch {
      setError('Network error — could not reach the server.');
    }
    setConfirmRemove(null);
    setBusyId(null);
  }

  function copyPassword() {
    if (!reveal) return;
    navigator.clipboard?.writeText(reveal.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Temp password reveal */}
      {reveal && (
        <div className="bg-wine-600/10 border border-wine-600/30 rounded-lg p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">
                {reveal.name}&apos;s temporary password
              </div>
              <div className="text-xs text-white/40 mt-0.5">{reveal.email} — share this with them securely. It won&apos;t be shown again.</div>
            </div>
            <button onClick={() => setReveal(null)} className="text-white/40 hover:text-white transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-wine-200 font-mono tracking-wide">
              {reveal.password}
            </code>
            <button onClick={copyPassword}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-2 rounded transition-colors flex-shrink-0">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Team Accounts</h3>
          <p className="text-xs text-white/40 mt-0.5">Staff, Manager and Owner accounts with access to this admin panel.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 bg-wine-600 hover:bg-wine-700 text-white text-xs px-3.5 py-2 rounded transition-colors flex-shrink-0">
          <UserPlus size={13} /> Add Team Member
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white/[0.04] border border-white/10 rounded-lg p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="admin-input" placeholder="Jane Wanjiru" />
            </div>
            <div>
              <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="admin-input" placeholder="jane@florescofragrances.co.ke" />
            </div>
            <div>
              <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as TeamRole }))} className="admin-input">
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={createMember} disabled={creating}
              className="flex items-center gap-2 bg-wine-600 hover:bg-wine-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium px-4 py-2 rounded transition-colors">
              {creating ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
              {creating ? 'Creating…' : 'Create Account'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
          </div>
          <p className="text-xs text-white/30">A random temporary password is generated — you&apos;ll see it once after creating the account.</p>
        </div>
      )}

      {/* List */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" /> Loading team…
          </div>
        ) : team.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No team accounts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-left text-[0.62rem] tracking-[0.14em] uppercase text-white/40">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map(member => {
                const isSelf = member._id === myId;
                const rowBusy = busyId === member._id;
                return (
                  <tr key={member._id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">
                      {member.name}{isSelf && <span className="text-white/30 ml-1.5 text-xs">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-white/60">{member.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={member.role}
                        disabled={rowBusy}
                        onChange={e => changeRole(member, e.target.value as TeamRole)}
                        className="bg-white/[0.06] border border-white/15 text-white text-xs px-2.5 py-1.5 rounded focus:outline-none disabled:opacity-50"
                      >
                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => resetPassword(member)} disabled={rowBusy}
                          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs px-2.5 py-1.5 rounded hover:bg-white/[0.06] transition-colors disabled:opacity-40">
                          <KeyRound size={12} /> Reset password
                        </button>
                        <button onClick={() => setConfirmRemove(member)} disabled={rowBusy || isSelf}
                          title={isSelf ? "You can't remove your own account" : 'Remove'}
                          className="flex items-center gap-1.5 text-white/40 hover:text-red-400 text-xs px-2.5 py-1.5 rounded hover:bg-red-500/[0.06] transition-colors disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:bg-transparent">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Remove confirmation */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmRemove(null)}>
          <div className="bg-[#1A1714] border border-white/10 rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-medium text-white mb-2">Remove {confirmRemove.name}?</div>
            <p className="text-xs text-white/50 mb-5">They&apos;ll immediately lose access to the admin panel. This can&apos;t be undone.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => removeMember(confirmRemove)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded transition-colors">
                Remove
              </button>
              <button onClick={() => setConfirmRemove(null)} className="text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
