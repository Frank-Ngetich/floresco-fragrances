'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Image, Video, Trash2, Copy, Check,
  Search, X, Film, Link, RefreshCw, AlertTriangle,
  FolderOpen, ExternalLink, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  key:          string;
  url:          string;
  name:         string;
  size:         number;
  lastModified: string;
  type:         'image' | 'video' | 'other';
}

const FOLDERS = ['products', 'hero', 'blog', 'general'];

function fileType(name: string): 'image' | 'video' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext)) return 'image';
  if (['mp4','mov','webm','avi'].includes(ext)) return 'video';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}

/* Downscale + re-compress large photos before upload — raw camera JPEGs
   (2-3MB, 4000px+) make first-time image optimization painfully slow.
   Leaves SVG/GIF (vector/animated) and already-small files untouched. */
async function compressImage(file: File, maxDim = 2000, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  let { width, height } = bitmap;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width  = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob || blob.size >= file.size) return file; // only use it if it actually helped

  const newName = file.name.replace(/\.\w+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}

export default function AdminMedia() {
  const [files,         setFiles]         = useState<MediaFile[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [unconfigured,  setUnconfigured]  = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [selected,      setSelected]      = useState<MediaFile | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [query,         setQuery]         = useState('');
  const [typeFilter,    setTypeFilter]    = useState<'all'|'image'|'video'>('all');
  const [folder,        setFolder]        = useState('');
  const [view,          setView]          = useState<'grid'|'list'>('grid');
  const [dragging,      setDragging]      = useState(false);
  const [addUrlMode,    setAddUrlMode]    = useState(false);
  const [externalUrl,   setExternalUrl]   = useState('');
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [compressing,   setCompressing]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Load files from R2 ── */
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folder) params.set('prefix', folder + '/');
      const res  = await fetch(`/api/media?${params}`);
      const data = await res.json();
      if (data.unconfigured) {
        setUnconfigured(true);
        setFiles([]);
      } else {
        setUnconfigured(false);
        setFiles((data.files || []).map((f: any) => ({ ...f, type: fileType(f.name) })));
      }
    } catch {
      setFiles([]);
    }
    setLoading(false);
  }, [folder]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  /* ── Upload to R2 via presigned URL ── */
  async function uploadFile(file: File) {
    setCompressing(true);
    const optimized = await compressImage(file);
    setCompressing(false);

    setUploading(true);
    setUploadPct(0);
    try {
      /* 1 - Get presigned URL */
      const presignRes = await fetch('/api/media', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          filename:    optimized.name,
          contentType: optimized.type,
          folder:      folder || 'general',
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        if (err.unconfigured) {
          setUnconfigured(true);
          return;
        }
        throw new Error(err.error || 'Failed to get upload URL');
      }

      const { presignedUrl, key, publicUrl } = await presignRes.json();

      /* 2 - Upload directly to R2 with progress tracking */
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', optimized.type);
        xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable');
        xhr.send(optimized);
      });

      /* 3 - Add to local state immediately */
      const newFile: MediaFile = {
        key,
        url:          publicUrl,
        name:         optimized.name,
        size:         optimized.size,
        lastModified: new Date().toISOString(),
        type:         fileType(optimized.name),
      };
      setFiles(prev => [newFile, ...prev]);
      setSelected(newFile);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
    setUploading(false);
    setUploadPct(0);
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }, [folder]);

  /* ── Copy URL ── */
  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Fallback for older browsers */
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  /* ── Delete from R2 ── */
  async function deleteFile(key: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    setDeleting(key);
    try {
      await fetch('/api/media', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key }),
      });
      setFiles(prev => prev.filter(f => f.key !== key));
      if (selected?.key === key) setSelected(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
    setDeleting(null);
  }

  /* ── Add external URL ── */
  function addExternalUrl() {
    if (!externalUrl.trim()) return;
    const name = externalUrl.split('/').pop() || 'external';
    const file: MediaFile = {
      key:          `external/${Date.now()}-${name}`,
      url:          externalUrl.trim(),
      name,
      size:         0,
      lastModified: new Date().toISOString(),
      type:         fileType(name),
    };
    setFiles(prev => [file, ...prev]);
    setSelected(file);
    setExternalUrl('');
    setAddUrlMode(false);
  }

  const filtered = files.filter(f => {
    const matchQ    = !query || f.name.toLowerCase().includes(query.toLowerCase());
    const matchType = typeFilter === 'all' || f.type === typeFilter;
    return matchQ && matchType;
  });

  /* ── R2 not configured banner ── */
  if (unconfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display">Media Library</h1>
          <p className="text-white/50 text-sm mt-1">Cloudflare R2 storage</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle size={24} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-300 font-medium mb-3">R2 Storage Not Configured</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Add these variables to your <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">.env.local</code> file to enable image uploads:
              </p>
              <div className="bg-black/30 rounded-lg p-5 font-mono text-sm space-y-2 text-white/70">
                <div><span className="text-amber-300">CLOUDFLARE_ACCOUNT_ID</span>=your_account_id</div>
                <div><span className="text-amber-300">R2_ACCESS_KEY_ID</span>=your_r2_access_key</div>
                <div><span className="text-amber-300">R2_SECRET_ACCESS_KEY</span>=your_r2_secret_key</div>
                <div><span className="text-amber-300">R2_BUCKET_NAME</span>=floresco-media</div>
                <div><span className="text-amber-300">R2_PUBLIC_URL</span>=https://media.florescofragrances.co.ke</div>
              </div>
              <div className="mt-6 space-y-3 text-sm text-white/55">
                <p><span className="text-white/80 font-medium">Step 1:</span> Go to <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-wine-300 hover:text-wine-200">dash.cloudflare.com</a> → R2 Object Storage → Create bucket named <code className="bg-white/10 px-1 rounded">floresco-media</code></p>
                <p><span className="text-white/80 font-medium">Step 2:</span> R2 → Manage R2 API Tokens → Create token with <em>Object Read & Write</em> permission</p>
                <p><span className="text-white/80 font-medium">Step 3:</span> Set the bucket to <em>Public</em> or connect a custom domain as R2_PUBLIC_URL</p>
                <p><span className="text-white/80 font-medium">Step 4:</span> Run <code className="bg-white/10 px-1 rounded">npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner</code></p>
                <p><span className="text-white/80 font-medium">Step 5:</span> Restart npm run dev</p>
              </div>
              <button onClick={loadFiles}
                className="mt-6 flex items-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs tracking-[0.14em] uppercase px-5 py-2.5 rounded transition-colors">
                <RefreshCw size={13} /> Check Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Media Library</h1>
          <p className="text-white/50 text-sm mt-1">{files.length} files in Cloudflare R2</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setAddUrlMode(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs tracking-wide uppercase px-4 py-2.5 rounded transition-colors">
            <Link size={13} /> Add by URL
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2.5 rounded transition-colors">
            <Upload size={13} /> Upload to R2
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*"
            className="hidden" onChange={e => uploadFiles(e.target.files)} />
        </div>
      </div>

      {/* Add by URL modal */}
      <AnimatePresence>
        {addUrlMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#1A1815] border border-white/15 rounded-xl p-7 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-display text-white">Add External Image URL</h3>
                <button onClick={() => setAddUrlMode(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[0.62rem] tracking-[0.18em] uppercase text-white/40 mb-2">Image URL</label>
                  <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addExternalUrl()}
                    className="admin-input w-full" placeholder="https://example.com/image.jpg" />
                </div>
                <p className="text-xs text-white/35 leading-relaxed">
                  External URLs are stored as references only. For best performance, upload images directly to R2.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setAddUrlMode(false)}
                    className="flex-1 bg-white/10 text-white text-xs uppercase tracking-wide py-2.5 rounded">Cancel</button>
                  <button onClick={addExternalUrl}
                    className="flex-1 bg-wine-600 hover:bg-wine-700 text-white text-xs uppercase tracking-wide py-2.5 rounded transition-colors">Add URL</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none bg-white/[0.03] rounded-lg p-1">
        <button onClick={() => setFolder('')}
          className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all',
            folder === '' ? 'bg-wine-600 text-white' : 'text-white/50 hover:text-white')}>
          <FolderOpen size={12} /> All Files
        </button>
        {FOLDERS.map(f => (
          <button key={f} onClick={() => setFolder(f)}
            className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium capitalize transition-all',
              folder === f ? 'bg-wine-600 text-white' : 'text-white/50 hover:text-white')}>
            <FolderOpen size={12} /> {f}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          dragging ? 'border-wine-500 bg-wine-600/10' : 'border-white/10 hover:border-white/25'
        )}
      >
        {compressing ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={22} className="animate-spin text-white/40" />
            <p className="text-sm text-white/60">Optimizing image…</p>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-xs bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-wine-500 transition-all duration-300 rounded-full" style={{ width: `${uploadPct}%` }} />
            </div>
            <p className="text-sm text-white/60">Uploading to Cloudflare R2… {uploadPct}%</p>
          </div>
        ) : (
          <>
            <Upload size={28} className={cn('mx-auto mb-3', dragging ? 'text-wine-400' : 'text-white/25')} />
            <p className="text-sm text-white/60 mb-1">
              Drag & drop files here, or <span className="text-wine-400">click to browse</span>
            </p>
            <p className="text-xs text-white/30">PNG, JPG, WebP, AVIF, MP4 · Stored in Cloudflare R2</p>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by filename…"
            className="w-full bg-white/[0.06] border border-white/15 text-white text-sm pl-9 pr-4 py-2.5 placeholder:text-white/30 focus:outline-none rounded" />
        </div>
        <div className="flex rounded border border-white/15 overflow-hidden">
          {(['all','image','video'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn('px-4 py-2 text-xs uppercase tracking-wide transition-colors',
                typeFilter === t ? 'bg-wine-600 text-white' : 'text-white/40 hover:text-white')}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex rounded border border-white/15 overflow-hidden">
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-2 text-xs transition-colors',
                view === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white')}>
              {v === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
        <button onClick={loadFiles} disabled={loading}
          className="px-4 py-2 bg-white/[0.06] border border-white/15 text-white/50 hover:text-white rounded text-xs transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid / List */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={cn(
              view === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                : 'space-y-2'
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={cn('bg-white/[0.04] rounded-lg animate-pulse',
                  view === 'grid' ? 'aspect-square' : 'h-14')} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Image size={32} strokeWidth={1} className="mx-auto mb-3" />
              <p className="text-sm">
                {files.length === 0
                  ? 'No files uploaded yet. Drag & drop to get started.'
                  : 'No files match your search.'}
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(file => (
                <motion.div key={file.key}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelected(file)}
                  className={cn(
                    'group relative bg-white/[0.05] border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-wine-500/50',
                    selected?.key === file.key ? 'border-wine-500 ring-1 ring-wine-500/40' : 'border-white/10'
                  )}>
                  <div className="aspect-square bg-white/[0.03] flex items-center justify-center overflow-hidden">
                    {file.type === 'image' && file.url ? (
                      <img src={file.url} alt={file.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : file.type === 'video' ? (
                      <Film size={32} className="text-white/20" />
                    ) : (
                      <Image size={32} className="text-white/20" strokeWidth={1} />
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs text-white/70 truncate">{file.name}</div>
                    <div className="text-[0.6rem] text-white/35 mt-0.5">{formatBytes(file.size)}</div>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={e => { e.stopPropagation(); copyUrl(file.url); }}
                      className="p-2 bg-white/20 hover:bg-wine-600 rounded transition-colors"
                      title="Copy URL">
                      {copied && selected?.key === file.key
                        ? <Check size={14} className="text-green-400" />
                        : <Copy size={14} className="text-white" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteFile(file.key); }}
                      disabled={deleting === file.key}
                      className="p-2 bg-white/20 hover:bg-red-600 rounded transition-colors"
                      title="Delete">
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['File', 'Size', 'Date', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[0.6rem] tracking-[0.18em] uppercase text-white/30 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(file => (
                    <tr key={file.key} onClick={() => setSelected(file)}
                      className={cn('border-b border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors',
                        selected?.key === file.key && 'bg-wine-600/10')}>
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/[0.05] rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {file.type === 'image' && file.url
                            ? <img src={file.url} alt="" className="w-full h-full object-cover" />
                            : file.type === 'video'
                            ? <Film size={16} className="text-white/30" />
                            : <Image size={16} className="text-white/30" strokeWidth={1} />}
                        </div>
                        <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/40">{formatBytes(file.size)}</td>
                      <td className="px-5 py-3.5 text-xs text-white/40">
                        {file.lastModified ? new Date(file.lastModified).toLocaleDateString('en-KE', { day:'numeric',month:'short',year:'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); copyUrl(file.url); }}
                            className="p-1.5 text-white/30 hover:text-wine-300 transition-colors">
                            <Copy size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteFile(file.key); }}
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-64 flex-shrink-0 bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden flex flex-col sticky top-24 self-start">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-xs font-medium text-white">Details</span>
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white"><X size={14} /></button>
              </div>
              {/* Preview */}
              <div className="aspect-square bg-white/[0.03] flex items-center justify-center overflow-hidden border-b border-white/10">
                {selected.type === 'image' && selected.url
                  ? <img src={selected.url} alt={selected.name} className="w-full h-full object-contain p-2" />
                  : <Film size={40} className="text-white/15" />}
              </div>
              <div className="p-4 space-y-3 flex-1">
                <div>
                  <div className="text-[0.58rem] uppercase tracking-[0.18em] text-white/30 mb-1">Filename</div>
                  <div className="text-xs text-white/70 break-all">{selected.name}</div>
                </div>
                {selected.size > 0 && (
                  <div>
                    <div className="text-[0.58rem] uppercase tracking-[0.18em] text-white/30 mb-1">Size</div>
                    <div className="text-xs text-white/70">{formatBytes(selected.size)}</div>
                  </div>
                )}
                <div>
                  <div className="text-[0.58rem] uppercase tracking-[0.18em] text-white/30 mb-1">URL</div>
                  <div className="bg-white/[0.05] rounded p-2 text-[0.6rem] text-white/45 font-mono break-all leading-relaxed">
                    {selected.url}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-white/10 space-y-2">
                <button onClick={() => copyUrl(selected.url)}
                  className="w-full flex items-center justify-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs uppercase tracking-wide py-2.5 rounded transition-colors">
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
                </button>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-xs uppercase tracking-wide py-2.5 rounded transition-colors">
                    <ExternalLink size={12} /> Open
                  </a>
                )}
                <button onClick={() => deleteFile(selected.key)} disabled={deleting === selected.key}
                  className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-red-500/15 text-red-400 text-xs uppercase tracking-wide py-2.5 rounded transition-colors disabled:opacity-40">
                  <Trash2 size={12} /> Delete from R2
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
