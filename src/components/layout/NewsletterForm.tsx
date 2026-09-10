'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-cream-200 text-sm pb-2 border-b border-cream-600">
        <Check size={14} className="text-burgundy-300" /> You&apos;re on the list.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-0 border-b border-cream-600 pb-2">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 bg-transparent text-cream-200 placeholder:text-cream-600 text-sm focus:outline-none py-1"
      />
      <button type="submit" disabled={status === 'sending'}
        className="text-[0.68rem] tracking-[0.2em] uppercase text-burgundy-300 hover:text-burgundy-200 transition-colors font-medium whitespace-nowrap disabled:opacity-50">
        {status === 'sending' ? 'Sending…' : status === 'error' ? 'Try again →' : 'Subscribe →'}
      </button>
    </form>
  );
}
