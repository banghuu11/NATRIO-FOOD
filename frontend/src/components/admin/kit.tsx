'use client';

import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-sans text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn('rounded-2xl border border-line bg-white', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <h2 className="font-sans text-[15px] font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/** Stat tile: label, headline value, optional context line. */
export function Stat({ label, value, hint, icon, tone = 'default' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: 'default' | 'warning' | 'danger' }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between text-sm text-muted">{label}<span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tone === 'warning' ? 'bg-amber-50 text-amber-700' : tone === 'danger' ? 'bg-red-50 text-danger' : 'bg-forest-50 text-forest-600')}>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Table({ head, children, empty, className }: { head: ReactNode[]; children: ReactNode; empty?: boolean; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-sand-50/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            {head.map((h, i) => <th key={i} className="px-4 py-3 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <div className="py-12 text-center text-sm text-muted">Không có dữ liệu</div>}
    </div>
  );
}

/** Downloads a file from an authenticated API endpoint (e.g. Excel export). */
export async function download(url: string, params: Record<string, unknown>, filename: string) {
  try {
    const res = await api.get(url, { params, responseType: 'blob' });
    const href = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
    toast.success('Đã xuất file Excel');
  } catch (e) {
    toast.error(apiError(e, 'Xuất file thất bại'));
  }
}
