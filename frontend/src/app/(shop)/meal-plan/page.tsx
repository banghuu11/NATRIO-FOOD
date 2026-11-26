'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CalendarRange, Clock, Info, RefreshCw, Save, ShoppingBasket, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { useAuth } from '@/stores/auth';
import { usePrefs } from '@/stores/prefs';
import type { PlanDay, PlanMeal } from '@/types';
import { ALLERGEN_NAMES } from '@/components/shop/allergy-sync';
import { Button } from '@/components/ui/button';
import { ChipGroup, Field, Input } from '@/components/ui/form';
import { Notice, Skeleton } from '@/components/ui/feedback';
import { SmartImage } from '@/components/ui/misc';

interface Plan { targetCalories: number; days: PlanDay[]; weekAverageKcal: number; note?: string; name?: string }

const totals = (meals: PlanMeal[]) => ({
  kcal: meals.reduce((s, m) => s + m.kcal, 0),
  proteinG: Math.round(meals.reduce((s, m) => s + m.proteinG, 0)),
  carbG: Math.round(meals.reduce((s, m) => s + m.carbG, 0)),
  fatG: Math.round(meals.reduce((s, m) => s + m.fatG, 0)),
});
const SPLIT: Record<string, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };

function MealPlanner() {
  const sp = useSearchParams();
  const user = useAuth((s) => s.user);
  const prefs = usePrefs();
  const mine = useQuery({ queryKey: ['my-plan', user?.id], queryFn: () => get<Plan | null>('/meal-plans/mine'), enabled: !!user });
  // The API answers an empty body when nothing is saved, so treat anything without days as "no plan"
  const savedPlan = sp.get('kcal') || !mine.data?.days ? null : mine.data;
  // Local edits (null = untouched) override the URL, the saved plan and the persisted preferences
  const [kcalDraft, setKcal] = useState<string | null>(null);
  const kcal = kcalDraft ?? String(sp.get('kcal') || savedPlan?.targetCalories || prefs.calorieTarget || 1800);
  const [alDraft, setAllergens] = useState<string[] | null>(null);
  const allergens = alDraft ?? prefs.allergens;
  const [diet, setDiet] = useState<string | null>(null);
  const [planDraft, setPlan] = useState<Plan | null>(null);
  const plan = planDraft ?? savedPlan;
  const [day, setDay] = useState(1);
  const [err, setErr] = useState('');
  const { addMany } = useCartActions();

  const gen = useMutation({
    mutationFn: async () => (await api.post<Plan>('/meal-plans/generate', { targetCalories: Number(kcal), excludeAllergens: allergens, diet: diet ?? undefined })).data,
    onSuccess: (p) => { setPlan(p); setDay(1); },
    onError: (e) => toast.error(apiError(e)),
  });
  const swap = useMutation({
    mutationFn: async (m: PlanMeal) => (await api.post<PlanMeal>('/meal-plans/swap', { mealType: m.mealType, targetKcal: Math.round(Number(kcal) * SPLIT[m.mealType]), excludeRecipeIds: [m.recipeId], excludeAllergens: allergens })).data,
    onSuccess: (nm, old) => {
      if (plan) setPlan({ ...plan, days: plan.days.map((d) => (d.day !== day ? d : { ...d, meals: d.meals.map((m) => (m.mealType === old.mealType ? nm : m)), totals: totals(d.meals.map((m) => (m.mealType === old.mealType ? nm : m))) })) });
      toast.success(`Đã đổi sang “${nm.title}”`);
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const save = useMutation({
    mutationFn: () => api.post('/meal-plans', { targetCalories: plan!.targetCalories, days: plan!.days.map((d) => ({ day: d.day, meals: d.meals.map((m) => ({ mealType: m.mealType, recipeId: m.recipeId, servings: m.servings })) })) }),
    onSuccess: () => toast.success('Đã lưu thực đơn vào tài khoản'),
    onError: (e) => toast.error(apiError(e)),
  });
  const toCart = useMutation({
    mutationFn: async (meals: PlanMeal[]) => (await api.post<{ items: { variantId: number; quantity: number }[]; notSold: string[] }>('/meal-plans/cart-items', { meals: meals.map((m) => ({ recipeId: m.recipeId, servings: m.servings })) })).data,
    onSuccess: (r) => {
      if (!r.items.length) return toast.info('Các món này không có nguyên liệu bán tại NUTRIO');
      addMany.mutate(r.items);
      if (r.notSold.length) toast.message(`Nguyên liệu tự chuẩn bị: ${r.notSold.slice(0, 8).join(', ')}${r.notSold.length > 8 ? '…' : ''}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const d = plan?.days.find((x) => x.day === day);
  const allMeals = plan?.days.flatMap((x) => x.meals) ?? [];

  return (
    <div className="container-page py-8">
      <div className="mb-8 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-latte-500 uppercase"><CalendarRange className="h-4 w-4" /> Smart Meal Plan</div>
        <h1 className="text-4xl sm:text-5xl">Thực đơn 7 ngày theo mục tiêu calo</h1>
        <p className="mt-3 text-muted">Hệ thống chia calo cho bữa sáng 25% · trưa 35% · tối 30% · phụ 10% và chọn công thức phù hợp, tránh thành phần bạn dị ứng.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit space-y-5 rounded-3xl border border-line bg-white p-5 lg:sticky lg:top-40">
          <Field label="Mục tiêu calo/ngày" error={err} hint={<><Link href="/health" className="text-forest-700 underline">Tính TDEE</Link> nếu chưa biết</>}>
            <Input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} error={err} rightSlot={<span className="pr-2 text-xs text-muted">kcal</span>} />
          </Field>
          <Field label="Chế độ ăn"><ChipGroup value={diet} onChange={setDiet} options={[{ value: 'eat_clean', label: 'Eat Clean' }, { value: 'keto', label: 'Keto' }, { value: 'vegan', label: 'Thuần chay' }, { value: 'high_protein', label: 'Giàu đạm' }]} /></Field>
          <Field label="Tránh thành phần"><ChipGroup multiple value={allergens} onChange={setAllergens} options={Object.entries(ALLERGEN_NAMES).map(([c, n]) => ({ value: c, label: n }))} /></Field>
          <Button className="w-full" size="lg" loading={gen.isPending} onClick={() => { const n = Number(kcal); if (!(n >= 1000 && n <= 5000)) return setErr('Nhập từ 1.000 đến 5.000 kcal'); setErr(''); gen.mutate(); }}>
            <Sparkles className="h-4 w-4" /> {plan ? 'Tạo thực đơn mới' : 'Tạo thực đơn'}
          </Button>
        </aside>

        <div>
          {gen.isPending ? <Skeleton className="h-[520px] rounded-3xl" /> : !plan ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-forest-50 p-8 text-center">
              <SmartImage src="/images/banners/hero-eating-healthy.jpg" alt="" width={220} height={140} className="mb-5 rounded-2xl object-cover" />
              <h2 className="text-2xl">Nhập mục tiêu và nhấn “Tạo thực đơn”</h2>
              <p className="mt-2 max-w-md text-sm text-muted">Bạn có thể đổi từng món, lưu thực đơn và thêm toàn bộ nguyên liệu vào giỏ chỉ với một chạm.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-forest-700 p-5 text-white">
                <div><div className="text-sm text-white/75">Mục tiêu {formatNumber(plan.targetCalories)} kcal/ngày</div><div className="text-xl font-semibold">Trung bình tuần: {formatNumber(plan.weekAverageKcal)} kcal/ngày</div></div>
                <div className="flex flex-wrap gap-2">
                  {user ? <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" loading={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" /> Lưu thực đơn</Button> : <Link href="/login?next=/meal-plan" className="self-center text-sm text-white/80 underline">Đăng nhập để lưu</Link>}
                  <Button variant="accent" loading={toCart.isPending || addMany.isPending} onClick={() => toCart.mutate(allMeals)}><ShoppingBasket className="h-4 w-4" /> Thêm nguyên liệu cả tuần</Button>
                </div>
              </div>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {plan.days.map((x) => (
                  <button key={x.day} onClick={() => setDay(x.day)} className={cn('min-w-24 shrink-0 cursor-pointer rounded-2xl border px-4 py-2.5 text-left', x.day === day ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white hover:border-forest-300')}>
                    <div className="text-sm font-semibold">Ngày {x.day}</div><div className={cn('text-xs', x.day === day ? 'text-white/80' : 'text-muted')}>{formatNumber(x.totals.kcal)} kcal</div>
                  </button>
                ))}
              </div>
              {d && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {d.meals.map((m) => (
                      <article key={m.mealType} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
                        <Link href={`/recipes/${m.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl"><SmartImage src={m.image} alt={m.title} fill sizes="96px" className="object-cover" /></Link>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold tracking-wide text-latte-500 uppercase">{m.mealLabel}</div>
                          <Link href={`/recipes/${m.slug}`} className="line-clamp-2 font-semibold hover:text-forest-700">{m.title}</Link>
                          <div className="mt-1 text-xs text-muted"><b className="text-ink">{m.kcal} kcal</b> · {m.servings} phần · <Clock className="inline h-3 w-3" /> {m.prepMinutes}′</div>
                          <div className="text-xs text-muted">Đạm {m.proteinG}g · Carb {m.carbG}g · Béo {m.fatG}g</div>
                          <button onClick={() => swap.mutate(m)} disabled={swap.isPending} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-forest-700 hover:underline disabled:opacity-50"><RefreshCw className={cn('h-3.5 w-3.5', swap.isPending && swap.variables?.mealType === m.mealType && 'animate-spin')} /> Đổi món</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand-50 p-4 text-sm">
                    <div>Tổng ngày {d.day}: <b>{formatNumber(d.totals.kcal)} kcal</b> · Đạm {d.totals.proteinG}g · Carb {d.totals.carbG}g · Béo {d.totals.fatG}g <span className={cn('ml-1 font-semibold', Math.abs(d.totals.kcal - plan.targetCalories) / plan.targetCalories <= 0.1 ? 'text-forest-700' : 'text-warning')}>({d.totals.kcal >= plan.targetCalories ? '+' : ''}{formatNumber(d.totals.kcal - plan.targetCalories)} so với mục tiêu)</span></div>
                    <Button size="sm" variant="secondary" loading={toCart.isPending} onClick={() => toCart.mutate(d.meals)}><ShoppingBasket className="h-4 w-4" /> Nguyên liệu ngày {d.day}</Button>
                  </div>
                </>
              )}
              <Notice icon={<Info className="h-5 w-5 shrink-0" />}>{plan.note ?? 'Thực đơn tham khảo, không thay thế tư vấn của chuyên gia dinh dưỡng.'} Số lượng sản phẩm được quy đổi theo tổng gram nguyên liệu cần dùng.</Notice>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MealPlanPage() {
  return <Suspense><MealPlanner /></Suspense>;
}
