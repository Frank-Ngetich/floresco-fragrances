/* Shared R2 upload pipeline — used by the Media Library page and by any
   inline uploader (e.g. the Product Editor) so both go through the same
   compress -> presign -> PUT flow instead of duplicating it. */

/* Downscale + re-compress large photos before upload — raw camera JPEGs
   (2-3MB, 4000px+) make first-time image optimization painfully slow.
   Leaves SVG/GIF (vector/animated) and already-small files untouched. */
export async function compressImage(file: File, maxDim = 2000, quality = 0.82): Promise<File> {
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

export class MediaUnconfiguredError extends Error {}

export async function uploadToMedia(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<{ url: string; key: string; name: string; size: number }> {
  const optimized = await compressImage(file);

  const presignRes = await fetch('/api/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: optimized.name, contentType: optimized.type, folder }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    if (err.unconfigured) throw new MediaUnconfiguredError('R2 storage is not configured.');
    throw new Error(err.error || 'Failed to get upload URL');
  }

  const { presignedUrl, key, publicUrl } = await presignRes.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', optimized.type);
    xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable');
    xhr.send(optimized);
  });

  return { url: publicUrl, key, name: optimized.name, size: optimized.size };
}
