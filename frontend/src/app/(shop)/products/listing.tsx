'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, SearchX, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { get } from '@/lib/api';
import { useMounted } from '@/hooks/use-mounted';
import { cn } from '@/lib/utils';
import { usePrefs } from '@/stores/prefs';
import type { CategoryNode, Paged, ProductCard } from '@/types';
import { useCategories } from '@/components/layout/header';
import { ProductGrid } from '@/components/shop/product-card';
import { ALLERGEN_NAMES } from '@/components/shop/allergy-sync';
import { Button } from '@/components/ui/button';
import { Checkbox, Select, Toggle } from '@/components/ui/form';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/feedback';
import { Breadcrumbs, Pagination, Stars } from '@/components/ui/misc';
import { Drawer } from '@/components/ui/overlay';

type Meta = { diets: { code: string; name: string }[]; allergens: { code: string; name: string }[] };
type Result = Paged<ProductCard> & { detectedNeeds: { label: string; diets: string[] }[] };

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best_selling', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
];
const PRICES: [string, number | undefined, number | undefined][] = [
  ['Dưới 150.000₫', undefined, 150000],
  ['150.000 – 250.000₫', 150000, 250000],
  ['250.000 – 400.000₫', 250000, 400000],
  ['Trên 400.000₫', 400000, undefined],
];
/** Diet codes shown as "nutrition goals". */
const GOALS = ['high_protein', 'low_calorie', 'keto', 'low_carb', 'eat_clean', 'vegan', 'sugar_free', 'gluten_free'];

function findCat(nodes: CategoryNode[], slug: string | null): CategoryNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const c = findCat(n.children, slug);
    if (c) return c;
  }
  return null;
}

export function ProductListing() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const mounted = useMounted();
  const { allergens: myAllergens, hideAllergenProducts, setHideAllergenProducts } = usePrefs();
  const cats = useCategories();
  const meta = useQuery({ queryKey: ['catalog-meta'], queryFn: () => get<Meta>('/categories/meta'), staleTime: 600_000 });

  const p = {
    q: sp.get('q') || '',
    category: sp.get('category'),
    diets: sp.get('diets')?.split(',').filter(Boolean) ?? [],
    excludeAllergens: sp.get('excludeAllergens')?.split(',').filter(Boolean) ?? [],
    minPrice: sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined,
    maxPrice: sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined,
    minRating: sp.get('minRating') ? Number(sp.get('minRating')) : undefined,
    nutriScore: sp.get('nutriScore')?.split(',').filter(Boolean) ?? [],
    inStock: sp.get('inStock') === 'true',
    onSale: sp.get('onSale') === 'true',
    featured: sp.get('featured') === 'true',
    sort: sp.get('sort') || 'newest',
    page: Number(sp.get('page') || 1),
  };
  const effectiveAllergens = useMemo(() => [...new Set([...p.excludeAllergens, ...(hideAllergenProducts ? myAllergens : [])])], [p.excludeAllergens, hideAllergenProducts, myAllergens]);

  const set = (patch: Record<string, string | number | undefined | null | string[] | boolean>, keepPage = false) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      const val = Array.isArray(v) ? v.join(',') : v === true ? 'true' : v === false ? '' : v;
      if (val === undefined || val === null || val === '') next.delete(k);
      else next.set(k, String(val));
    }
    if (!keepPage) next.delete('page');
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const query = useQuery({
    queryKey: ['products', p, effectiveAllergens],
    queryFn: () =>
      get<Result>('/products', {
        q: p.q || undefined,
        category: p.category || undefined,
        diets: p.diets.join(',') || undefined,
        excludeAllergens: effectiveAllergens.join(',') || undefined,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        minRating: p.minRating,
        nutriScore: p.nutriScore.join(',') || undefined,
        inStock: p.inStock || undefined,
        onSale: p.onSale || undefined,
        featured: p.featured || undefined,
        sort: p.sort,
        page: p.page,
        limit: 12,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (p.q) usePrefs.getState().addSearch(p.q);
  }, [p.q]);

  const current = findCat(cats.data ?? [], p.category);
  const title = p.q ? `Kết quả cho “${p.q}”` : current?.name ?? (p.onSale ? 'Sản phẩm khuyến mãi' : p.featured ? 'Sản phẩm nổi bật' : 'Tất cả sản phẩm');
  const dietName = (code: string) => meta.data?.diets.find((d) => d.code === code)?.name ?? code;

  const chips: { label: string; clear: () => void }[] = [
    ...(p.q ? [{ label: `Từ khóa: ${p.q}`, clear: () => set({ q: null }) }] : []),
    ...(current ? [{ label: current.name, clear: () => set({ category: null }) }] : []),
    ...p.diets.map((d) => ({ label: dietName(d), clear: () => set({ diets: p.diets.filter((x) => x !== d) }) })),
    ...p.excludeAllergens.map((a) => ({ label: `Không ${ALLERGEN_NAMES[a]?.toLowerCase() ?? a}`, clear: () => set({ excludeAllergens: p.excludeAllergens.filter((x) => x !== a) }) })),
    ...(p.minPrice || p.maxPrice ? [{ label: PRICES.find((x) => x[1] === p.minPrice && x[2] === p.maxPrice)?.[0] ?? 'Khoảng giá', clear: () => set({ minPrice: null, maxPrice: null }) }] : []),
    ...(p.minRating ? [{ label: `Từ ${p.minRating} sao`, clear: () => set({ minRating: null }) }] : []),
    ...p.nutriScore.map((g) => ({ label: `Nutri-Score ${g}`, clear: () => set({ nutriScore: p.nutriScore.filter((x) => x !== g) }) })),
    ...(p.inStock ? [{ label: 'Còn hàng', clear: () => set({ inStock: null }) }] : []),
    ...(p.onSale ? [{ label: 'Đang giảm giá', clear: () => set({ onSale: null }) }] : []),
  ];

  const filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 font-sans text-sm font-bold tracking-wide uppercase">Danh mục</h3>
        <button onClick={() => set({ category: null })} className={cn('mb-1 block w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm', !p.category ? 'bg-forest-50 font-semibold text-forest-700' : 'hover:bg-sand-50')}>
          Tất cả
        </button>
        {(cats.data ?? []).map((c) => (
          <div key={c.id}>
            <button onClick={() => set({ category: c.slug })} className={cn('flex w-full cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-left text-sm', p.category === c.slug ? 'bg-forest-50 font-semibold text-forest-700' : 'font-medium hover:bg-sand-50')}>
              {c.name} <span className="text-xs text-muted">{c.productCount}</span>
            </button>
            {c.children.map((ch) => (
              <button key={ch.id} onClick={() => set({ category: ch.slug })} className={cn('flex w-full cursor-pointer justify-between rounded-lg py-1.5 pr-2.5 pl-6 text-left text-sm', p.category === ch.slug ? 'bg-forest-50 font-semibold text-forest-700' : 'text-ink/75 hover:bg-sand-50')}>
                {ch.name} <span className="text-xs text-muted">{ch.productCount}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-3 font-sans text-sm font-bold tracking-wide uppercase">Khoảng giá</h3>
        <div className="space-y-2">
          {PRICES.map(([label, min, max]) => (
            <Checkbox key={label} label={label} checked={p.minPrice === min && p.maxPrice === max && (min !== undefined || max !== undefined)} onChange={(on) => set(on ? { minPrice: min, maxPrice: max } : { minPrice: null, maxPrice: null })} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 font-sans text-sm font-bold tracking-wide uppercase">Mục tiêu dinh dưỡng</h3>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <Checkbox key={g} label={dietName(g)} checked={p.diets.includes(g)} onChange={(on) => set({ diets: on ? [...p.diets, g] : p.diets.filter((x) => x !== g) })} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-sans text-sm font-bold tracking-wide uppercase">Loại trừ dị ứng</h3>
        {myAllergens.length > 0 && (
          <div className="mb-3 rounded-xl bg-red-50 p-3">
            <Toggle checked={hideAllergenProducts} onChange={setHideAllergenProducts} label="Ẩn sản phẩm tôi dị ứng" />
            <div className="mt-1 text-xs text-red-800/80">Theo hồ sơ: {myAllergens.map((a) => ALLERGEN_NAMES[a] ?? a).join(', ')}</div>
          </div>
        )}
        <div className="space-y-2">
          {(meta.data?.allergens ?? []).map((a) => (
            <Checkbox key={a.code} label={`Không chứa ${ALLERGEN_NAMES[a.code]?.toLowerCase() ?? a.name}`} checked={p.excludeAllergens.includes(a.code)} onChange={(on) => set({ excludeAllergens: on ? [...p.excludeAllergens, a.code] : p.excludeAllergens.filter((x) => x !== a.code) })} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 font-sans text-sm font-bold tracking-wide uppercase">Đánh giá</h3>
        <div className="space-y-1">
          {[4.5, 4, 3].map((r) => (
            <button key={r} onClick={() => set({ minRating: p.minRating === r ? null : r })} className={cn('flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm', p.minRating === r ? 'bg-forest-50 font-semibold text-forest-700' : 'hover:bg-sand-50')}>
              <Stars value={r} /> từ {r} sao
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 font-sans text-sm font-bold tracking-wide uppercase">Nutri-Score</h3>
        <div className="flex gap-1.5">
          {['A', 'B', 'C', 'D', 'E'].map((g) => (
            <button key={g} onClick={() => set({ nutriScore: p.nutriScore.includes(g) ? p.nutriScore.filter((x) => x !== g) : [...p.nutriScore, g] })} className={cn('h-9 w-9 cursor-pointer rounded-lg border text-sm font-bold', p.nutriScore.includes(g) ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white hover:border-forest-300')}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        <Checkbox label="Chỉ hiện sản phẩm còn hàng" checked={p.inStock} onChange={(v) => set({ inStock: v })} />
        <Checkbox label="Đang giảm giá" checked={p.onSale} onChange={(v) => set({ onSale: v })} />
      </div>
    </div>
  );

  const data = query.data;
  if (!mounted) return <div className="container-page py-10"><ProductGridSkeleton count={9} /></div>;
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Cửa hàng', href: '/products' }, ...(current ? [{ label: current.name }] : [])]} />
      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          {current?.description && !p.q && <p className="mt-1 text-muted">{current.description}</p>}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 pb-6">{filters}</div>
        </aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc {chips.length > 0 && `(${chips.length})`}
            </Button>
            <div className="text-sm text-muted" aria-live="polite">
              {data ? <><b className="text-ink">{data.meta.total}</b> sản phẩm</> : 'Đang tải…'}
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-muted sm:inline">Sắp xếp</span>
              <Select value={p.sort} onChange={(e) => set({ sort: e.target.value })} className="h-10 w-44">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-forest-50 px-3 py-1 text-sm text-forest-800 hover:bg-forest-100">
                  {c.label} <X className="h-3.5 w-3.5" />
                </button>
              ))}
              <button onClick={() => router.push(pathname)} className="cursor-pointer px-2 text-sm font-medium text-danger hover:underline">Xóa tất cả</button>
            </div>
          )}

          {data?.detectedNeeds?.length ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-latte-500/10 px-4 py-2.5 text-sm text-latte-700">
              <Sparkles className="h-4 w-4" /> Tìm theo nhu cầu: <b>{data.detectedNeeds.map((n) => n.label).join(', ')}</b> – kết quả gồm cả sản phẩm phù hợp mục tiêu này.
            </div>
          ) : null}
          {hideAllergenProducts && myAllergens.length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4" /> Đang ẩn sản phẩm chứa: {myAllergens.map((a) => ALLERGEN_NAMES[a]).join(', ')}
            </div>
          )}

          {query.isLoading ? (
            <ProductGridSkeleton count={9} />
          ) : query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : !data?.data.length ? (
            <EmptyState
              icon={<SearchX className="h-8 w-8" />}
              title="Không tìm thấy sản phẩm phù hợp"
              description={p.q ? `Không có kết quả cho “${p.q}”. Hãy thử từ khóa khác như “hạnh nhân”, “granola”, “giàu đạm”.` : 'Thử bỏ bớt bộ lọc để xem thêm sản phẩm.'}
              action={<Button variant="outline" onClick={() => router.push(pathname)}>Xóa bộ lọc</Button>}
            />
          ) : (
            <div className={cn('transition-opacity', query.isFetching && 'opacity-60')}>
              <ProductGrid products={data.data} className="md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3" />
              <div className="mt-10">
                <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={(pg) => { set({ page: pg }, true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Bộ lọc" side="left" width="max-w-sm" footer={<Button className="w-full" onClick={() => setDrawer(false)}>Xem {data?.meta.total ?? ''} sản phẩm</Button>}>
        <div className="p-5">{filters}</div>
      </Drawer>
    </div>
  );
}
