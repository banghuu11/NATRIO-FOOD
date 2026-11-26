'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ChefHat, Clock, Flame, ShoppingBasket, Users } from 'lucide-react';
import { apiError, get } from '@/lib/api';
import { formatNumber, formatPrice } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { usePrefs } from '@/stores/prefs';
import type { ProductCard, Recipe } from '@/types';
import { ALLERGEN_NAMES } from '@/components/shop/allergy-sync';
import { Button } from '@/components/ui/button';
import { ErrorState, Notice, Spinner } from '@/components/ui/feedback';
import { Badge, Breadcrumbs, SmartImage } from '@/components/ui/misc';

type Detail = Recipe & {
  ingredients: { name: string; quantity: number | null; unit: string | null; product: ProductCard | null; variantId: number | null }[];
  steps: { step: number; instruction: string }[];
  cartItems: { variantId: number; quantity: number }[];
};
const DIFF = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

export default function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const q = useQuery({ queryKey: ['recipe', slug], queryFn: () => get<Detail>(`/recipes/${slug}`), retry: false });
  const { addMany } = useCartActions();
  const mine = usePrefs((s) => s.allergens);
  if (q.isLoading) return <Spinner className="py-32" />;
  if (q.isError || !q.data) return <div className="container-page py-16"><ErrorState message={apiError(q.error)} /></div>;
  const r = q.data;
  const conflicts = r.allergens.filter((a) => mine.includes(a));
  const shopTotal = r.ingredients.reduce((s, i) => s + (i.product?.defaultVariant?.price ?? 0), 0);

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Công thức', href: '/recipes' }, { label: r.title }]} />
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><SmartImage src={r.image} alt={r.title} fill priority sizes="55vw" className="object-cover" /></div>
        <div>
          <div className="flex flex-wrap gap-2">{r.diets.map((d) => <Badge key={d.code} tone="green">{d.name}</Badge>)}</div>
          <h1 className="mt-3 text-3xl sm:text-4xl">{r.title}</h1>
          {r.description && <p className="mt-3 text-ink/80">{r.description}</p>}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[[Flame, `${formatNumber(r.caloriesPerServing)} kcal`, 'mỗi phần'], [Clock, `${r.prepMinutes} phút`, 'chuẩn bị'], [Users, `${r.servings} phần`, 'khẩu phần'], [ChefHat, DIFF[r.difficulty], 'độ khó']].map(([I, v, l], k) => {
              const Icon = I as typeof Flame;
              return <div key={k} className="rounded-2xl bg-sand-50 p-3 text-center"><Icon className="mx-auto h-5 w-5 text-latte-500" /><div className="mt-1 font-semibold">{v as string}</div><div className="text-xs text-muted">{l as string}</div></div>;
            })}
          </div>
          <div className="mt-3 text-sm text-muted">Mỗi phần: Đạm {r.proteinG}g · Carb {r.carbG}g · Chất béo {r.fatG}g</div>
          {conflicts.length > 0 && <Notice tone="danger" className="mt-4" icon={<AlertTriangle className="h-5 w-5 shrink-0" />}>Món này có thành phần bạn dị ứng: <b>{conflicts.map((c) => ALLERGEN_NAMES[c]).join(', ')}</b>.</Notice>}
          {r.cartItems.length > 0 && (
            <div className="mt-6 rounded-2xl border border-forest-200 bg-forest-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div><div className="font-semibold">{r.cartItems.length} nguyên liệu có tại NUTRIO</div><div className="text-sm text-muted">Khoảng {formatPrice(shopTotal)}</div></div>
                <Button loading={addMany.isPending} onClick={() => addMany.mutate(r.cartItems)}><ShoppingBasket className="h-4 w-4" /> Thêm tất cả vào giỏ</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
        <section className="h-fit rounded-3xl border border-line bg-white p-6">
          <h2 className="mb-4 font-sans text-xl font-semibold">Nguyên liệu</h2>
          <ul className="space-y-3 text-sm">
            {r.ingredients.map((i, k) => (
              <li key={k} className="flex items-center gap-3 border-b border-line pb-3 last:border-0">
                {i.product ? <SmartImage src={i.product.image} alt="" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-sand-100" />}
                <div className="flex-1"><div className="font-medium">{i.name}</div>{i.product ? <Link href={`/products/${i.product.slug}`} className="text-xs text-forest-700 hover:underline">Có bán tại NUTRIO · {formatPrice(i.product.defaultVariant?.price)}</Link> : <span className="text-xs text-muted">Tự chuẩn bị</span>}</div>
                <span className="text-muted">{i.quantity ? `${formatNumber(i.quantity)} ${i.unit ?? ''}` : i.unit}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="mb-4 font-sans text-xl font-semibold">Cách làm</h2>
          <ol className="space-y-5">
            {r.steps.map((s) => (
              <li key={s.step} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-600 font-bold text-white">{s.step}</span><p className="pt-1.5 leading-relaxed">{s.instruction}</p></li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
