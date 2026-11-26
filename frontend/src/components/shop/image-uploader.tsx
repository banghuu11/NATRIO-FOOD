'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SmartImage } from '@/components/ui/misc';

export async function uploadImages(files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const { data } = await api.post<{ urls: string[] }>('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.urls;
}

/** Multi-image picker that uploads immediately and keeps a list of URLs. */
export function ImageUploader({ value, onChange, max = 5, className }: { value: string[]; onChange: (urls: string[]) => void; max?: number; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list].slice(0, max - value.length);
    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) return toast.error(`Ảnh "${tooBig.name}" lớn hơn 5MB`);
    setBusy(true);
    try {
      onChange([...value, ...(await uploadImages(files))]);
    } catch (e) {
      toast.error(apiError(e, 'Tải ảnh thất bại'));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {value.map((u, i) => (
        <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
          <SmartImage src={u} alt="" fill sizes="80px" className="object-cover" />
          {i === 0 && max > 1 && <span className="absolute bottom-0 left-0 bg-forest-600 px-1.5 text-[10px] text-white">Ảnh chính</span>}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== u))} className="absolute top-1 right-1 cursor-pointer rounded-full bg-ink/70 p-0.5 text-white" aria-label="Xóa ảnh"><X className="h-3 w-3" /></button>
        </div>
      ))}
      {value.length < max && (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand-300 text-xs text-muted hover:border-forest-400 hover:text-forest-700">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {busy ? 'Đang tải' : 'Thêm ảnh'}
        </button>
      )}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple={max > 1} hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
