'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Activity, AlertTriangle, CalendarRange, Droplets, Flame, HeartPulse, Info, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { usePrefs } from '@/stores/prefs';
import type { NutritionResult, ProductCard as PC } from '@/types';
import { ProductCard } from '@/components/shop/product-card';
import { ALLERGEN_NAMES } from '@/components/shop/allergy-sync';
import { Button, ButtonLink } from '@/components/ui/button';
import { ChipGroup, Field, Input } from '@/components/ui/form';
import { Notice, Skeleton } from '@/components/ui/feedback';
import { SectionTitle } from '@/components/ui/misc';

const ACTIVITY = [
  { code: 'sedentary', label: 'Ít vận động', d: 'Văn phòng, hầu như không tập' },
  { code: 'light', label: 'Nhẹ', d: '1–3 buổi/tuần' },
  { code: 'moderate', label: 'Vừa', d: '3–5 buổi/tuần' },
  { code: 'active', label: 'Nhiều', d: '6–7 buổi/tuần' },
  { code: 'very_active', label: 'Rất nhiều', d: 'Lao động nặng / 2 buổi/ngày' },
];
const GOALS = [
  { code: 'lose_weight', label: 'Giảm cân' },
  { code: 'maintain', label: 'Giữ cân' },
  { code: 'gain_weight', label: 'Tăng cân' },
  { code: 'gain_muscle', label: 'Tăng cơ' },
  { code: 'eat_clean', label: 'Ăn sạch' },
  { code: 'control_blood_sugar', label: 'Kiểm soát đường huyết' },
];

interface Profile { hasProfile: boolean; input: { gender: string | null; age: number | null; heightCm?: number; weightKg?: number; targetWeightKg?: number | null; activityLevel?: string; goal?: string }; result: NutritionResult | null; allergens: { code: string }[] }

/** BMI position on the Asia-Pacific scale (16 → 32). */
function BmiScale({ bmi }: { bmi: number }) {
  const pct = Math.min(100, Math.max(0, ((bmi - 16) / 16) * 100));
  const bands = [
    { to: 18.5, label: 'Thiếu cân', cls: 'bg-sky-200' },
    { to: 23, label: 'Bình thường', cls: 'bg-forest-300' },
    { to: 25, label: 'Thừa cân', cls: 'bg-amber-200' },
    { to: 30, label: 'Béo phì I', cls: 'bg-orange-300' },
    { to: 32, label: 'Béo phì II', cls: 'bg-red-300' },
  ];
  let from = 16;
  return (
    <div>
      <div className="relative flex h-3 gap-0.5 overflow-hidden rounded-full">
        {bands.map((b) => { const w = ((b.to - from) / 16) * 100; from = b.to; return <div key={b.label} className={b.cls} style={{ width: `${w}%` }} />; })}
      </div>
      <div className="relative h-5"><div className="absolute -top-1 h-5 w-1 -translate-x-1/2 rounded-full bg-ink ring-2 ring-white" style={{ left: `${pct}%` }} /></div>
      <div className="flex justify-between text-[10px] text-muted">{['16', '18.5', '23', '25', '30', '32+'].map((x) => <span key={x}>{x}</span>)}</div>
    </div>
  );
}

const DEFAULT_FORM = { gender: 'female', age: '28', heightCm: '160', weightKg: '55', targetWeightKg: '', activityLevel: 'light', goal: 'maintain' };

export default function HealthPage() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const { allergens: localAllergens, setAllergens, setGoal } = usePrefs();
  const profile = useQuery({ queryKey: ['nutrition-profile', user?.id], queryFn: () => get<Profile>('/nutrition/profile'), enabled: !!user });
  const saved = profile.data?.hasProfile ? profile.data : null;

  // Local edits (null = untouched) override what comes from the saved profile / guest preferences
  const [fDraft, setF] = useState<typeof DEFAULT_FORM | null>(null);
  const f = fDraft ?? (saved ? { gender: saved.input.gender ?? 'female', age: String(saved.input.age ?? 28), heightCm: String(saved.input.heightCm), weightKg: String(saved.input.weightKg), targetWeightKg: saved.input.targetWeightKg ? String(saved.input.targetWeightKg) : '', activityLevel: saved.input.activityLevel ?? 'light', goal: saved.input.goal ?? 'maintain' } : DEFAULT_FORM);
  const [alDraft, setAl] = useState<string[] | null>(null);
  const allergens = alDraft ?? (user ? profile.data?.allergens.map((a) => a.code) ?? [] : localAllergens);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resultDraft, setResult] = useState<NutritionResult | null>(null);
  const result = resultDraft ?? saved?.result ?? null;

  const validate = () => {
    const e: Record<string, string> = {};
    const age = Number(f.age), h = Number(f.heightCm), w = Number(f.weightKg);
    if (!Number.isInteger(age) || age < 15 || age > 90) e.age = 'Tuổi từ 15 đến 90';
    if (!(h >= 120 && h <= 220)) e.heightCm = 'Chiều cao 120–220 cm';
    if (!(w >= 30 && w <= 250)) e.weightKg = 'Cân nặng 30–250 kg';
    if (f.targetWeightKg && !(Number(f.targetWeightKg) >= 30 && Number(f.targetWeightKg) <= 250)) e.targetWeightKg = 'Cân nặng mục tiêu 30–250 kg';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const body = () => ({ gender: f.gender, age: Number(f.age), heightCm: Number(f.heightCm), weightKg: Number(f.weightKg), activityLevel: f.activityLevel, goal: f.goal });

  const calc = useMutation({
    mutationFn: async () => {
      if (user) return (await api.put<Profile>('/nutrition/profile', { ...body(), targetWeightKg: f.targetWeightKg ? Number(f.targetWeightKg) : undefined, allergens })).data.result!;
      return (await api.post<NutritionResult>('/nutrition/calculate', body())).data;
    },
    onSuccess: (r) => {
      setResult(r);
      setAllergens(allergens);
      setGoal(f.goal, r.dailyCalorieTarget);
      qc.invalidateQueries({ queryKey: ['nutrition-profile'] });
      toast.success(user ? 'Đã lưu hồ sơ sức khỏe' : 'Đã tính xong! Đăng nhập để lưu hồ sơ.');
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const recs = useQuery({
    queryKey: ['recs', f.goal, allergens.join(','), !!result],
    queryFn: () => get<{ goalLabel: string; products: PC[] }>('/nutrition/recommendations', { goal: f.goal, excludeAllergens: allergens.join(',') }),
    enabled: !!result,
  });

  return (
    <div className="container-page py-8">
      <div className="mb-8 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-latte-500 uppercase"><HeartPulse className="h-4 w-4" /> Hồ sơ sức khỏe</div>
        <h1 className="text-4xl sm:text-5xl">Bạn cần bao nhiêu calo mỗi ngày?</h1>
        <p className="mt-3 text-muted">Nhập vài chỉ số cơ bản để tính BMI, BMR, TDEE và lượng đạm – tinh bột – chất béo khuyến nghị. Khai báo dị ứng để NUTRIO cảnh báo trên mọi sản phẩm.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <form className="space-y-6 rounded-3xl border border-line bg-white p-6" onSubmit={(e) => { e.preventDefault(); if (validate()) calc.mutate(); }}>
          <Field label="Giới tính"><ChipGroup value={f.gender} onChange={(v) => v && setF({ ...f, gender: v })} options={[{ value: 'female', label: 'Nữ' }, { value: 'male', label: 'Nam' }, { value: 'other', label: 'Khác' }]} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tuổi" error={errors.age}><Input type="number" inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} error={errors.age} /></Field>
            <Field label="Chiều cao (cm)" error={errors.heightCm}><Input type="number" inputMode="decimal" value={f.heightCm} onChange={(e) => setF({ ...f, heightCm: e.target.value })} error={errors.heightCm} /></Field>
            <Field label="Cân nặng (kg)" error={errors.weightKg}><Input type="number" inputMode="decimal" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} error={errors.weightKg} /></Field>
          </div>
          <Field label="Mức độ vận động">
            <div className="grid gap-2 sm:grid-cols-2">
              {ACTIVITY.map((a) => (
                <button type="button" key={a.code} onClick={() => setF({ ...f, activityLevel: a.code })} className={cn('cursor-pointer rounded-xl border p-3 text-left text-sm', f.activityLevel === a.code ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-100' : 'border-line hover:border-forest-300')}>
                  <div className="font-semibold">{a.label}</div><div className="text-xs text-muted">{a.d}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Mục tiêu"><ChipGroup value={f.goal} onChange={(v) => v && setF({ ...f, goal: v })} options={GOALS.map((g) => ({ value: g.code, label: g.label }))} /></Field>
          {user && <Field label="Cân nặng mục tiêu (kg, không bắt buộc)" error={errors.targetWeightKg}><Input type="number" value={f.targetWeightKg} onChange={(e) => setF({ ...f, targetWeightKg: e.target.value })} error={errors.targetWeightKg} /></Field>}
          <Field label="Thành phần dị ứng / cần tránh" hint="Sản phẩm chứa các thành phần này sẽ được gắn cảnh báo đỏ và không được gợi ý cho bạn">
            <ChipGroup multiple value={allergens} onChange={setAl} options={Object.entries(ALLERGEN_NAMES).map(([code, name]) => ({ value: code, label: name }))} />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={calc.isPending}>{user ? <><Save className="h-4 w-4" /> Tính & lưu hồ sơ</> : 'Tính ngay'}</Button>
          {!user && <p className="text-center text-xs text-muted"><Link href="/login?next=/health" className="font-semibold text-forest-700 underline">Đăng nhập</Link> để lưu hồ sơ và nhận gợi ý cá nhân hóa trên toàn website.</p>}
        </form>

        <div id="result" className="scroll-mt-40">
          {profile.isLoading ? <Skeleton className="h-96 rounded-3xl" /> : !result ? (
            <div className="flex h-full flex-col justify-center rounded-3xl bg-forest-50 p-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-forest-500" />
              <h2 className="mt-4 text-2xl">Kết quả sẽ hiển thị ở đây</h2>
              <p className="mt-2 text-sm text-muted">Công thức Mifflin–St Jeor, phân loại BMI theo chuẩn châu Á – Thái Bình Dương.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl bg-forest-700 p-6 text-white">
                <div className="text-sm text-white/75">Năng lượng khuyến nghị mỗi ngày</div>
                <div className="font-display text-6xl font-bold">{formatNumber(result.dailyCalorieTarget)}<span className="ml-2 text-2xl font-normal text-white/70">kcal</span></div>
                <p className="mt-2 text-sm text-white/80">{result.explanations.target}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[['BMR', result.bmr, 'kcal', result.explanations.bmr, Flame], ['TDEE', result.tdee, 'kcal', result.explanations.tdee, Activity], ['Nước', result.waterMl, 'ml', 'Khoảng 35 ml nước cho mỗi kg cân nặng mỗi ngày.', Droplets]].map(([k, v, u, d, I]) => {
                  const Icon = I as typeof Flame;
                  return (
                    <div key={k as string} className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase"><Icon className="h-4 w-4 text-latte-500" /> {k as string}</div>
                      <div className="mt-1 text-2xl font-bold">{formatNumber(v as number)} <span className="text-sm font-normal text-muted">{u as string}</span></div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{d as string}</p>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="mb-1 flex items-baseline justify-between"><span className="text-sm font-semibold">Chỉ số BMI</span><span><b className="text-2xl">{result.bmi}</b> <span className="text-sm font-semibold text-forest-700">{result.bmiCategory.label}</span></span></div>
                <BmiScale bmi={result.bmi} />
                <p className="mt-2 text-sm text-ink/80">{result.explanations.bmi}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="mb-3 text-sm font-semibold">Phân bổ dinh dưỡng mỗi ngày</div>
                <div className="flex h-9 gap-0.5 overflow-hidden rounded-xl text-xs font-semibold">
                  <div className="flex items-center justify-center bg-forest-600 text-white" style={{ width: `${result.macros.proteinPct}%` }}>{result.macros.proteinPct}%</div>
                  <div className="flex items-center justify-center bg-forest-400 text-white" style={{ width: `${result.macros.carbPct}%` }}>{result.macros.carbPct}%</div>
                  <div className="flex items-center justify-center bg-forest-200 text-forest-900" style={{ width: `${result.macros.fatPct}%` }}>{result.macros.fatPct}%</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  {[['bg-forest-600', 'Đạm', result.macros.proteinG], ['bg-forest-400', 'Tinh bột', result.macros.carbG], ['bg-forest-200', 'Chất béo', result.macros.fatG]].map(([c, l, g]) => (
                    <div key={l as string} className="flex items-center gap-2"><span className={cn('h-3 w-3 rounded-sm', c as string)} /><span>{l as string}: <b>{formatNumber(g as number)} g</b></span></div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">{result.explanations.macros}</p>
              </div>
              <Notice tone="warning" icon={<Info className="h-5 w-5 shrink-0" />}>{result.disclaimer} Phụ nữ mang thai, người có bệnh lý (tiểu đường, thận, tim mạch) nên tham khảo bác sĩ.</Notice>
              {allergens.length > 0 && <Notice tone="danger" icon={<ShieldAlert className="h-5 w-5 shrink-0" />}>Đã bật cảnh báo dị ứng: <b>{allergens.map((a) => ALLERGEN_NAMES[a]).join(', ')}</b>. Bạn có thể bật “Ẩn sản phẩm tôi dị ứng” trong bộ lọc cửa hàng.</Notice>}
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={`/meal-plan?kcal=${result.dailyCalorieTarget}`}><CalendarRange className="h-4 w-4" /> Tạo thực đơn {formatNumber(result.dailyCalorieTarget)} kcal</ButtonLink>
                <ButtonLink href="/quiz" variant="outline">Làm quiz chọn sản phẩm</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <section className="mt-14">
          <SectionTitle eyebrow="Gợi ý cho bạn" title={`Sản phẩm phù hợp mục tiêu ${recs.data?.goalLabel?.toLowerCase() ?? ''}`} description={allergens.length ? <span className="inline-flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-danger" /> Đã loại trừ sản phẩm chứa {allergens.map((a) => ALLERGEN_NAMES[a]?.toLowerCase()).join(', ')}</span> : 'Dựa trên mục tiêu và chỉ số dinh dưỡng của sản phẩm.'} />
          {recs.isLoading ? <Skeleton className="h-72" /> : recs.data?.products.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{recs.data.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          ) : <Notice>Chưa tìm thấy sản phẩm phù hợp với mọi điều kiện – hãy thử bỏ bớt thành phần dị ứng.</Notice>}
        </section>
      )}
    </div>
  );
}
