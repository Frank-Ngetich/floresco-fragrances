'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RefreshCw, Check, ArrowLeft, Eye, Upload, Image as ImageIcon, AlertTriangle, X } from 'lucide-react';
import { slugify, cn } from '@/lib/utils';
import { uploadToMedia, MediaUnconfiguredError } from '@/lib/media-upload';

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  seo: { metaTitle: string; metaDescription: string };
}

const BLANK: PostForm = {
  title: '', slug: '', excerpt: '', content: '', coverImage: '',
  category: '', author: '', published: false,
  seo: { metaTitle: '', metaDescription: '' },
};

const CATEGORIES = ['Guide', 'Education', 'Tips', 'Gift Guide', 'The Edit', 'Brand Story'];

export function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const [form,   setForm]   = useState<PostForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isNew = !postId || postId === 'new';

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/blog/${postId}`)
      .then(r => r.json())
      .then(d => setForm({ ...BLANK, ...d, seo: { ...BLANK.seo, ...d.seo } }))
      .catch(() => {});
  }, [postId, isNew]);

  function up<K extends keyof PostForm>(k: K, v: PostForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setSaved(false);
  }

  async function uploadCover(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploadErr('');
    setUploading(true);
    setUploadPct(0);
    try {
      const uploaded = await uploadToMedia(file, 'blog', setUploadPct);
      up('coverImage', uploaded.url);
    } catch (err: any) {
      setUploadErr(err instanceof MediaUnconfiguredError
        ? 'R2 storage is not configured yet — ask your developer to set it up.'
        : err.message || 'Upload failed.');
    }
    setUploading(false);
    setUploadPct(0);
  }

  async function save(publish?: boolean) {
    setError('');
    if (!form.title.trim())   { setError('Title is required.');   return; }
    if (!form.excerpt.trim()) { setError('Excerpt is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }

    setSaving(true);
    const body = {
      ...form,
      slug: form.slug || slugify(form.title),
      published: publish ?? form.published,
    };
    try {
      const res = await fetch(isNew ? '/api/admin/blog' : `/api/admin/blog/${postId}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setForm(p => ({ ...p, published: body.published }));
        if (isNew) router.push(`/admin/blog/${data._id}`);
      } else {
        setError(data.error || 'Failed to save.');
      }
    } catch {
      setError('Network error — could not reach the server.');
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/blog')} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display">{isNew ? 'New Article' : `Edit: ${form.title || '…'}`}</h1>
          {form.slug && <p className="text-white/40 text-xs mt-0.5 font-mono">/blog/{form.slug}</p>}
        </div>
        {!isNew && form.published && (
          <a href={`/blog/${form.slug}`} target="_blank"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs px-4 py-2 rounded transition-colors">
            <Eye size={12} /> View
          </a>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-lg p-6">
        <div>
          <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Title *</label>
          <input value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))}
            className="admin-input" placeholder="The Beginner's Guide to Arabian & Oud Perfumes" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">URL Slug</label>
            <input value={form.slug} onChange={e => up('slug', e.target.value)} className="admin-input font-mono text-sm" />
          </div>
          <div>
            <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Category</label>
            <select value={form.category} onChange={e => up('category', e.target.value)} className="admin-input">
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Excerpt *</label>
          <textarea rows={2} value={form.excerpt} onChange={e => up('excerpt', e.target.value)}
            className="admin-input resize-none" placeholder="A one or two sentence summary shown on the Journal listing…" />
        </div>
        <div>
          <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Content *</label>
          <textarea rows={14} value={form.content} onChange={e => up('content', e.target.value)}
            className="admin-input resize-none font-serif" placeholder="Write the full article here. Leave a blank line between paragraphs." />
        </div>

        <div>
          <label className="block text-[0.62rem] tracking-[0.16em] uppercase text-white/40 mb-2 font-medium">Cover Image</label>
          {form.coverImage ? (
            <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-white/10 group">
              <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
              <button onClick={() => up('coverImage', '')}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (!uploading) uploadCover(e.dataTransfer.files); }}
              className={cn('border-2 border-dashed rounded-lg p-8 text-center max-w-sm transition-colors',
                uploading ? 'border-gold-600/40' : 'border-white/15 hover:border-gold-600/40 cursor-pointer')}>
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full max-w-xs bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gold-500 transition-all duration-300 rounded-full" style={{ width: `${uploadPct}%` }} />
                  </div>
                  <p className="text-sm text-white/60">Uploading… {uploadPct}%</p>
                </div>
              ) : (
                <>
                  <Upload size={22} className="mx-auto text-white/25 mb-2" />
                  <p className="text-xs text-white/40">Drag & drop, or click to browse</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => uploadCover(e.target.files)} />
            </div>
          )}
          {uploadErr && <p className="text-xs text-amber-400 mt-2">{uploadErr}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => save(false)} disabled={saving}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2.5 rounded transition-colors">
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          Save Draft
        </button>
        <button onClick={() => save(true)} disabled={saving}
          className="flex items-center gap-2 bg-gold-600 hover:bg-gold-700 disabled:opacity-60 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2.5 rounded transition-colors">
          {saving ? <RefreshCw size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <ImageIcon size={13} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : form.published ? 'Update & Publish' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
