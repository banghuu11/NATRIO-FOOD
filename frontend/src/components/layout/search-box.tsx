'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Clock, Loader2, Search, Sparkles, TrendingUp, X } from 'lucide-react';
import { get } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { usePrefs } from '@/stores/prefs';
import { SmartImage } from '@/components/ui/misc';

interface Suggest {
  products: { id: number; name: string; slug: string; image: string; price: number | null; category: string }[];
  categories: { name: string; slug: string }[];
  needs: { label: string; diets: string[] }[];
}

function useDebounced<T>(v: T, ms = 220) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function SearchBox({ className, onDone }: { className?: string; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const term = useDebounced(q.trim());
  const { searchHistory, addSearch, removeSearch, clearSearch } = usePrefs();

  const suggest = useQuery({ queryKey: ['suggest', term], queryFn: () => get<Suggest>('/products/suggest', { q: term }), enabled: term.length >= 1, staleTime: 60_000 });
  const popular = useQuery({ queryKey: ['popular-searches'], queryFn: () => get<string[]>('/products/popular-searches'), enabled: open, staleTime: 300_000 });

  useEffect(() => {
    const h = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (href: string, record?: string) => {
    if (record) addSearch(record);
    setOpen(false);
    setQ('');
    onDone?.();
    router.push(href);
  };
  const submit = (text = q) => {
    const t = text.trim();
    if (!t) return;
    go(`/products?q=${encodeURIComponent(t)}`, t);
  };

  const items: { key: string; href: string; record?: string }[] = term
    ? [
        ...(suggest.data?.needs ?? []).map((n) => ({ key: `need-${n.label}`, href: `/products?diets=${n.diets[0]}`, record: term })),
        ...(suggest.data?.categories ?? []).map((c) => ({ key: `cat-${c.slug}`, href: `/products?category=${c.slug}` })),
        ...(suggest.data?.products ?? []).map((p) => ({ key: `p-${p.id}`, href: `/products/${p.slug}`, record: term })),
      ]
    : [];

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && items[active]) go(items[active].href, items[active].record);
          else submit();
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, -1));
              } else if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Tìm hạt macca, granola, hoặc “đồ ăn vặt giàu đạm”…"
            className="h-12 w-full rounded-full border border-line bg-white pr-12 pl-11 text-sm shadow-sm transition placeholder:text-muted/70 focus:border-forest-400 focus:ring-4 focus:ring-forest-100 focus:outline-none"
            aria-label="Tìm kiếm sản phẩm"
            autoComplete="off"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} className="absolute top-1/2 right-14 -translate-y-1/2 cursor-pointer p-1 text-muted hover:text-ink" aria-label="Xóa">
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="absolute top-1/2 right-1.5 flex h-9 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-forest-600 text-white hover:bg-forest-700" aria-label="Tìm">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {open && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] animate-fade-up overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lift">
          {!term ? (
            <div className="space-y-3 p-2">
              {searchHistory.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted uppercase">
                    Tìm kiếm gần đây
                    <button onClick={clearSearch} className="cursor-pointer font-medium normal-case hover:text-danger">
                      Xóa tất cả
                    </button>
                  </div>
                  {searchHistory.map((h) => (
                    <div key={h} className="group flex items-center rounded-lg px-2 hover:bg-sand-50">
                      <button onClick={() => submit(h)} className="flex flex-1 cursor-pointer items-center gap-2.5 py-2 text-left text-sm">
                        <Clock className="h-4 w-4 text-muted" /> {h}
                      </button>
                      <button onClick={() => removeSearch(h)} className="cursor-pointer p-1 text-muted opacity-0 group-hover:opacity-100" aria-label="Xóa">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="mb-2 text-xs font-semibold text-muted uppercase">Được tìm nhiều</div>
                <div className="flex flex-wrap gap-2">
                  {(popular.data?.length ? popular.data : ['hạt macca', 'granola', 'keto', 'giàu đạm', 'óc chó']).map((p) => (
                    <button key={p} onClick={() => submit(p)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sand-50 px-3 py-1.5 text-sm hover:bg-forest-50 hover:text-forest-700">
                      <TrendingUp className="h-3.5 w-3.5" /> {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : suggest.isLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm…
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              Không tìm thấy sản phẩm cho “<b className="text-ink">{term}</b>”. Thử “hạnh nhân”, “keto” hoặc “giàu đạm”.
            </div>
          ) : (
            <ul>
              {suggest.data!.needs.map((n, i) => (
                <li key={n.label}>
                  <button onClick={() => go(items[i].href, term)} className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm', active === i ? 'bg-forest-50' : 'hover:bg-sand-50')}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span>
                      Sản phẩm theo nhu cầu: <b className="text-forest-700">{n.label}</b>
                    </span>
                  </button>
                </li>
              ))}
              {suggest.data!.categories.map((c, j) => {
                const i = suggest.data!.needs.length + j;
                return (
                  <li key={c.slug}>
                    <button onClick={() => go(items[i].href)} className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm', active === i ? 'bg-forest-50' : 'hover:bg-sand-50')}>
                      <span className="rounded-md bg-sand-100 px-2 py-0.5 text-xs font-semibold text-latte-700">Danh mục</span> {c.name}
                    </button>
                  </li>
                );
              })}
              {suggest.data!.products.map((p, j) => {
                const i = suggest.data!.needs.length + suggest.data!.categories.length + j;
                return (
                  <li key={p.id}>
                    <button onClick={() => go(items[i].href, term)} className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left', active === i ? 'bg-forest-50' : 'hover:bg-sand-50')}>
                      <SmartImage src={p.image} alt={p.name} width={44} height={44} className="h-11 w-11 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted">{p.category}</span>
                      </span>
                      <span className="text-sm font-semibold text-forest-700">{formatPrice(p.price)}</span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button onClick={() => submit()} className="mt-1 w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-forest-700 hover:bg-forest-50">
                  Xem tất cả kết quả cho “{term}” →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
