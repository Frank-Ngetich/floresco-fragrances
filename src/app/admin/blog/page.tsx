'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Post {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function AdminBlog() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [deleting,setDeleting]= useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/blog')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p =>
    !query || p.title.toLowerCase().includes(query.toLowerCase())
  );

  async function togglePublished(post: Post) {
    const next = !post.published;
    setPosts(p => p.map(x => x._id === post._id ? { ...x, published: next } : x));
    try {
      await fetch(`/api/admin/blog/${post._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      });
    } catch {}
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      setPosts(p => p.filter(x => x._id !== id));
    } catch {}
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Blog / Journal</h1>
          <p className="text-white/50 text-sm mt-1">{posts.length} posts · {posts.filter(p => p.published).length} published</p>
        </div>
        <Link href="/admin/blog/new"
          className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-white text-xs tracking-[0.16em] uppercase font-medium px-5 py-2.5 rounded transition-colors self-start">
          <Plus size={14} /> New Article
        </Link>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="w-full bg-white/[0.06] border border-white/15 text-white text-sm pl-9 pr-4 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-white/30 rounded" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <FileText size={32} strokeWidth={1} className="mx-auto mb-3" />
          <p className="text-sm">{posts.length === 0 ? 'No articles yet — write your first one.' : 'No articles match your search'}</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                {['Title','Category','Status','Date',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[0.6rem] tracking-[0.18em] uppercase text-white/35 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(post => (
                  <motion.tr key={post._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="text-sm text-white font-medium">{post.title}</div>
                      <div className="text-xs text-white/35 font-mono mt-0.5">/blog/{post.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-white/50 capitalize">{post.category || '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => togglePublished(post)} className="flex items-center gap-2">
                        {post.published
                          ? <ToggleRight size={20} className="text-green-400" />
                          : <ToggleLeft  size={20} className="text-white/30" />}
                        <span className={cn('text-xs', post.published ? 'text-green-400' : 'text-white/40')}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-white/40">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {post.published && (
                          <Link href={`/blog/${post.slug}`} target="_blank"
                            className="p-1.5 text-white/40 hover:text-white transition-colors" title="View">
                            <Eye size={14} />
                          </Link>
                        )}
                        <Link href={`/admin/blog/${post._id}`}
                          className="p-1.5 text-white/40 hover:text-gold-300 transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => deletePost(post._id)} disabled={deleting === post._id}
                          className="p-1.5 text-white/40 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
