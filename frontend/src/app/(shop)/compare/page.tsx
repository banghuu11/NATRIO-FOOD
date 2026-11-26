'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Scale, X } from 'lucide-react';
import { get } from '@/lib/api';
import { cn, formatNumber, formatPrice } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { usePrefs } from '@/stores/prefs';
import type { ProductCard } from '@/types';
import { ALLERGEN_NAMES } from '@/components/shop/allergy-sync';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { NutriScore, SmartImage, Stars } from '@/components/ui/misc';

type C = ProductCard & { ingredients: string[] };

export default function ComparePage() {
  const { compare, removeCompare } = usePrefs();
  const ids = compare.map((c) => c.id);
  const { add } = useCartActions();
  const q = useQuery({ queryKey: ['compare', ids], queryFn: () => get<C[]>('/products/compare', { ids: ids.join(',') }), enabled: ids.length > 0 });

  if (!ids.length) return <div className="container-page py-16"><EmptyState icon={<Scale className="h-8 w-8" />} title="Chưa có sản phẩm để so sánh" description="Nhấn biểu tượng cân trên thẻ sản phẩm để thêm 2–3 sản phẩm." action={<ButtonLink href="/products">Chọn sản phẩm</ButtonLink>} /></div>;
  if (q.isLoading || !q.data) return <Spinner className="py-32" />;
  const ps = q.data;

  /** Row definitions; `best` marks the most favourable value (lower or higher is better). */
  const rows: { label: string; get: (p: C) => number | null; fmt: (v: number) => string; best?: 'min' | 'max' }[] = [
    { label: 'Giá bán', get: (p) => p.defaultVariant?.price ?? null, fmt: formatPrice },
    { label: 'Giá / 100 g', get: (p) => (p.defaultVariant ? (p.defaultVariant.price / p.defaultVariant.netWeightG) * 100 : null), fmt: formatPrice, best: 'min' },
    { label: 'Khối lượng', get: (p) => p.defaultVariant?.netWeightG ?? null, fmt: (v) => `${formatNumber(v)} g` },
    { label: 'Năng lượng (kcal/100g)', get: (p) => p.nutrition?.caloriesKcal ?? null, fmt: (v) => formatNumber(v) },
    { label: 'Protein (g/100g)', get: (p) => p.nutrition?.proteinG ?? null, fmt: (v) => formatNumber(v, 1), best: 'max' },
    { label: 'Carb (g/100g)', get: (p) => p.nutrition?.carbG ?? null, fmt: (v) => formatNumber(v, 1) },
    { label: 'Chất béo (g/100g)', get: (p) => p.nutrition?.fatG ?? null, fmt: (v) => formatNumber(v, 1) },
    { label: 'Đường (g/100g)', get: (p) => p.nutrition?.sugarG ?? null, fmt: (v) => formatNumber(v, 1), best: 'min' },
    { label: 'Chất xơ (g/100g)', get: (p) => p.nutrition?.fiberG ?? null, fmt: (v) => formatNumber(v, 1), best: 'max' },
    { label: 'Natri (mg/100g)', get: (p) => p.nutrition?.sodiumMg ?? null, fmt: (v) => formatNumber(v), best: 'min' },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="mb-2 text-3xl sm:text-4xl">So sánh sản phẩm</h1>
      <p className="mb-6 text-sm text-muted">Giá trị tốt nhất trong mỗi hàng được tô xanh.</p>
      <div className="overflow-x-auto rounded-3xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-44 p-4" />
              {ps.map((p) => (
                <th key={p.id} className="p-4 align-top font-normal">
                  <div className="relative">
                    <button onClick={() => removeCompare(p.id)} className="absolute -top-1 right-0 cursor-pointer rounded-full bg-sand-100 p-1 text-muted hover:text-danger" aria-label="Bỏ"><X className="h-3.5 w-3.5" /></button>
                    <Link href={`/products/${p.slug}`}><SmartImage src={p.image} alt={p.name} width={140} height={140} className="mx-auto h-32 w-32 rounded-xl object-cover" /></Link>
                    <Link href={`/products/${p.slug}`} className="mt-2 block font-semibold hover:text-forest-700">{p.name}</Link>
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs"><Stars value={p.avgRating} size={12} /> ({p.reviewCount})</div>
                    {p.defaultVariant && <Button size="sm" className="mt-3" onClick={() => add.mutate({ variantId: p.defaultVariant!.id, quantity: 1, name: p.name })}>Thêm vào giỏ</Button>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line"><td className="p-4 font-medium text-muted">Nutri-Score</td>{ps.map((p) => <td key={p.id} className="p-4 text-center"><NutriScore grade={p.nutriScoreGrade} /></td>)}</tr>
            {rows.map((r) => {
              const vals = ps.map(r.get);
              const nums = vals.filter((v): v is number => v !== null);
              const best = r.best && nums.length > 1 ? (r.best === 'min' ? Math.min(...nums) : Math.max(...nums)) : null;
              return (
                <tr key={r.label} className="border-t border-line">
                  <td className="p-4 font-medium text-muted">{r.label}</td>
                  {vals.map((v, i) => <td key={i} className={cn('p-4 text-center', best !== null && v === best && 'bg-forest-50 font-bold text-forest-700')}>{v === null ? '—' : r.fmt(v)}</td>)}
                </tr>
              );
            })}
            <tr className="border-t border-line"><td className="p-4 font-medium text-muted">Chế độ ăn</td>{ps.map((p) => <td key={p.id} className="p-4 text-center text-xs">{p.diets.map((d) => d.name).join(', ') || '—'}</td>)}</tr>
            <tr className="border-t border-line"><td className="p-4 font-medium text-muted">Dị ứng</td>{ps.map((p) => <td key={p.id} className="p-4 text-center text-xs text-danger">{p.allergens.map((a) => `${a.relation === 'may_contain' ? 'Có thể chứa ' : ''}${ALLERGEN_NAMES[a.code]?.toLowerCase() ?? a.name}`).join(', ') || <span className="text-muted">Không</span>}</td>)}</tr>
            <tr className="border-t border-line"><td className="p-4 font-medium text-muted">Thành phần</td>{ps.map((p) => <td key={p.id} className="p-4 text-center text-xs">{p.ingredients.join(', ') || '—'}</td>)}</tr>
          </tbody>
        </table>
      </div>
      {ps.length < 3 && <p className="mt-4 text-sm text-muted">Bạn có thể thêm tối đa {3 - ps.length} sản phẩm nữa. <Link href="/products" className="font-semibold text-forest-700 underline">Chọn thêm</Link></p>}
    </div>
  );
}
