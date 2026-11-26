'use client';

import Image, { type ImageProps } from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { cn, formatPrice, isRemote } from '@/lib/utils';

const FALLBACK = '/images/placeholder-product.svg';

/** next/image wrapper: falls back to a placeholder, skips optimisation for API-hosted uploads. */
export function SmartImage({ src, alt, className, ...props }: Omit<ImageProps, 'src'> & { src?: string | null }) {
  const [err, setErr] = useState(false);
  const s = !src || err ? FALLBACK : src;
  return <Image src={s} alt={alt} className={className} unoptimized={isRemote(s) || s.endsWith('.svg')} onError={() => setErr(true)} {...props} />;
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'green' | 'sale' | 'danger' | 'warning' | 'brown' | 'dark'; className?: string }) {
  const tones = {
    neutral: 'bg-sand-100 text-ink/80',
    green: 'bg-forest-50 text-forest-700',
    sale: 'bg-sale text-white',
    danger: 'bg-red-50 text-danger',
    warning: 'bg-amber-50 text-amber-800',
    brown: 'bg-latte-500/10 text-latte-700',
    dark: 'bg-ink text-white',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value.toFixed(1)} sao`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-sand-300" style={{ width: size, height: size }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];
  return (
    <div className="flex items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => onChange(i)} className="cursor-pointer p-0.5" aria-label={`${i} sao`}>
            <Star className={cn('h-8 w-8 transition', (hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-sand-300')} />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted">{labels[hover || value]}</span>
    </div>
  );
}

export function Price({ price, compare, size = 'md', className }: { price: number; compare?: number | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const pct = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
  const s = { sm: 'text-base', md: 'text-lg', lg: 'text-3xl' }[size];
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-bold text-forest-700', s)}>{formatPrice(price)}</span>
      {pct > 0 && (
        <>
          <span className="text-sm text-muted line-through">{formatPrice(compare!)}</span>
          <span className="text-xs font-bold text-sale">-{pct}%</span>
        </>
      )}
    </div>
  );
}

const NS_COLORS: Record<string, string> = { A: '#1e8f4e', B: '#7ac143', C: '#f5c518', D: '#ef8a22', E: '#e63e11' };

/** Nutri-Score A–E label (computed by the database from the nutrition facts). */
export function NutriScore({ grade, size = 'sm', className }: { grade: string | null | undefined; size?: 'sm' | 'lg'; className?: string }) {
  if (!grade) return null;
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return (
    <span className={cn('inline-flex items-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm ring-1 ring-black/5', className)} title={`Nutri-Score ${grade}`}>
      {size === 'lg' && <span className="px-1.5 text-[10px] font-bold tracking-wide text-muted">NUTRI-SCORE</span>}
      {letters.map((l) => (
        <span
          key={l}
          className={cn('flex items-center justify-center font-bold text-white transition', l === grade ? (size === 'lg' ? 'h-8 w-8 rounded-md text-base' : 'h-5 w-5 rounded text-[11px]') : size === 'lg' ? 'h-6 w-6 text-xs opacity-60' : 'h-4 w-3.5 text-[9px] opacity-45')}
          style={{ background: NS_COLORS[l] }}
        >
          {l}
        </span>
      ))}
    </span>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md', disabled }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: 'sm' | 'md'; disabled?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null);
  const h = size === 'sm' ? 'h-8' : 'h-11';
  const commit = (raw: string) => {
    const n = Math.round(Number(raw));
    setDraft(null);
    if (!Number.isFinite(n) || n < min) return onChange(min);
    onChange(Math.min(n, max));
  };
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-line bg-white', h, disabled && 'opacity-60')}>
      <button type="button" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className="flex h-full w-9 cursor-pointer items-center justify-center text-ink/70 hover:text-forest-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Giảm">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        disabled={disabled}
        value={draft ?? value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-full w-11 border-x border-line text-center text-sm font-semibold focus:outline-none"
        aria-label="Số lượng"
      />
      <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className="flex h-full w-9 cursor-pointer items-center justify-center text-ink/70 hover:text-forest-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Tăng">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = 'flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-medium transition';
  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Phân trang">
      <button className={cn(btn, 'border border-line bg-white disabled:opacity-40')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button key={p} onClick={() => onChange(p)} className={cn(btn, p === page ? 'bg-forest-600 text-white' : 'border border-line bg-white hover:border-forest-300')}>
            {p}
          </button>
        ),
      )}
      <button className={cn(btn, 'border border-line bg-white disabled:opacity-40')} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn('-mb-px cursor-pointer border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition', value === t.value ? 'border-forest-600 text-forest-700' : 'border-transparent text-muted hover:text-ink')}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-sand-100 px-1.5 py-0.5 text-[11px] text-ink/70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto text-sm whitespace-nowrap text-muted" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-forest-700">
        Trang chủ
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          {it.href ? (
            <Link href={it.href} className="hover:text-forest-700">
              {it.label}
            </Link>
          ) : (
            <span className="max-w-[16rem] truncate text-ink">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SectionTitle({ eyebrow, title, description, action, className }: { eyebrow?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-7 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && <div className="mb-2 text-xs font-bold tracking-[0.18em] text-latte-500 uppercase">{eyebrow}</div>}
        <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Very small, safe markdown subset (## headings, - lists, 1. lists, paragraphs). Text only – no HTML is injected. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
  return (
    <div className={cn('prose-nutrio', className)}>
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter(Boolean);
        if (lines[0]?.startsWith('## ')) {
          return (
            <div key={i}>
              <h2>{lines[0].slice(3)}</h2>
              {lines.length > 1 && <RichText text={lines.slice(1).join('\n')} />}
            </div>
          );
        }
        if (lines.every((l) => /^- /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{l.replace(/^\d+\. /, '')}</li>)}</ol>;
        return <p key={i}>{lines.join(' ')}</p>;
      })}
    </div>
  );
}
