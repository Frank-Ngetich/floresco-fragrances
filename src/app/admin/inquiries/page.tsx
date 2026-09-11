'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, Phone, Send, RefreshCw, Check, X, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'all' | 'new' | 'replied' | 'closed';

const STATUSES: { id: Status; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'new',     label: 'New' },
  { id: 'replied', label: 'Replied' },
  { id: 'closed',  label: 'Closed' },
];

const STATUS_PILL: Record<string, string> = {
  new:     'bg-amber-500/15 text-amber-300',
  replied: 'bg-blue-500/15 text-blue-300',
  closed:  'bg-white/10 text-white/50',
};

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<Status>('all');
  const [selected,  setSelected]  = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res  = await fetch(`/api/admin/inquiries?${params}`);
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch {
      setInquiries([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selected._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInquiries(prev => prev.map(i => i._id === updated._id ? updated : i));
        setSelected(updated);
        setReplyText('');
        setSent(true);
        setTimeout(() => setSent(false), 2500);
      }
    } catch {}
    setSending(false);
  }

  async function closeInquiry() {
    if (!selected) return;
    const res = await fetch(`/api/admin/inquiries/${selected._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInquiries(prev => prev.map(i => i._id === updated._id ? updated : i));
      setSelected(updated);
    }
  }

  const counts: Record<string, number> = { all: inquiries.length };
  inquiries.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });

  return (
    <div className="flex gap-6 min-h-0">
      <div className={cn('flex-1 space-y-5 min-w-0', selected && 'hidden lg:block lg:max-w-[55%]')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display">Inquiries</h1>
            <p className="text-white/50 text-sm mt-1">Messages submitted through the Contact page</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs tracking-wide uppercase px-4 py-2 rounded transition-colors disabled:opacity-50 self-start">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-none bg-white/[0.04] rounded-lg p-1">
          {STATUSES.map(s => (
            <button key={s.id} onClick={() => setFilter(s.id)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all',
                filter === s.id ? 'bg-gold-600 text-white' : 'text-white/50 hover:text-white')}>
              {s.label}
              {counts[s.id] > 0 && (
                <span className={cn('text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full',
                  filter === s.id ? 'bg-white/20' : 'bg-white/10')}>
                  {counts[s.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.03] rounded-lg animate-pulse" />)}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <MessageSquare size={32} strokeWidth={1} className="mx-auto mb-3" />
            <p className="text-sm">No inquiries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {inquiries.map(inq => (
                <motion.div key={inq._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  onClick={() => { setSelected(inq); setReplyText(''); }}
                  className={cn('bg-white/[0.04] border rounded-lg p-4 cursor-pointer transition-all hover:bg-white/[0.07]',
                    selected?._id === inq._id ? 'border-gold-500/50 bg-gold-600/10' : 'border-white/10')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{inq.subject}</div>
                      <div className="text-xs text-white/50 mt-0.5">{inq.name} · {inq.email}</div>
                      <div className="text-xs text-white/30 mt-1 truncate">{inq.message}</div>
                    </div>
                    <span className={cn('text-[0.6rem] tracking-wide uppercase px-2 py-1 rounded-full font-medium flex-shrink-0',
                      STATUS_PILL[inq.status] || 'bg-white/10 text-white/50')}>
                      {inq.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-[420px] flex-shrink-0 bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden flex flex-col self-start sticky top-24 max-h-[calc(100dvh-8rem)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div>
                <div className="text-sm text-white font-medium">{selected.subject}</div>
                <div className="text-xs text-white/40 mt-0.5">{new Date(selected.createdAt).toLocaleString('en-KE')}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-1.5 text-sm">
                <div className="text-white font-medium">{selected.name}</div>
                <div className="flex items-center gap-2 text-white/50"><Mail size={12} /> {selected.email}</div>
                {selected.phone && <div className="flex items-center gap-2 text-white/50"><Phone size={12} /> {selected.phone}</div>}
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-sm text-white/70 leading-relaxed">
                {selected.message}
              </div>

              {selected.reply && (
                <div>
                  <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={11} /> Your Reply
                  </div>
                  <div className="bg-gold-600/10 border border-gold-600/25 rounded-lg p-4 text-sm text-white/70 leading-relaxed">
                    {selected.reply}
                  </div>
                  {selected.repliedAt && (
                    <div className="text-xs text-white/30 mt-1.5 flex items-center gap-1"><Clock size={10} /> {new Date(selected.repliedAt).toLocaleString('en-KE')}</div>
                  )}
                </div>
              )}

              <div className="border-t border-white/10 pt-5">
                <div className="text-[0.6rem] tracking-[0.18em] uppercase text-white/30 mb-3">
                  {selected.reply ? 'Send Another Reply' : 'Reply'}
                </div>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
                  placeholder="Type your reply — this is emailed directly to the customer…"
                  className="w-full bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 rounded focus:outline-none placeholder:text-white/30 resize-none mb-3" />
                <div className="flex gap-2">
                  <button onClick={sendReply} disabled={sending || !replyText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white text-xs tracking-[0.14em] uppercase py-2.5 rounded transition-colors">
                    {sending ? <RefreshCw size={12} className="animate-spin" /> : sent ? <Check size={12} /> : <Send size={12} />}
                    {sending ? 'Sending…' : sent ? 'Sent!' : 'Send Reply'}
                  </button>
                  {selected.status !== 'closed' && (
                    <button onClick={closeInquiry}
                      className="px-4 bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-xs uppercase tracking-wide rounded transition-colors">
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
