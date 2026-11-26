'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { get } from '@/lib/api';
import { usePrefs } from '@/stores/prefs';
import type { Recipe } from '@/types';
import { RecipeCard } from '@/components/home/sections';
import { ChipGroup, Input, Toggle } from '@/components/ui/form';
import { EmptyState, ProductGridSkeleton } from '@/components/ui/feedback';

export default function RecipesPage() {
  const [diet, setDiet] = useState<string | null>(null);
  const [meal, setMeal] = useState<string | null>(null);
  const [maxCal, setMaxCal] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const myAllergens = usePrefs((s) => s.allergens);
  const [safe, setSafe] = useState(true);
  const list = useQuery({
    queryKey: ['recipes', diet, meal, maxCal, q, safe && myAllergens.join(',')],
    queryFn: () => get<Recipe[]>('/recipes', { diet: diet ?? undefined, mealType: meal ?? undefined, maxCalories: maxCal ?? undefined, q: q || undefined, excludeAllergens: safe && myAllergens.length ? myAllergens.join(',') : undefined }),
  });
  return (
    <div className="container-page py-8">
      <div className="mb-8 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-latte-500 uppercase"><ChefHat className="h-4 w-4" /> Shop the recipe</div>
        <h1 className="text-4xl sm:text-5xl">Công thức Eat Clean, Keto & Thuần chay</h1>
        <p className="mt-3 text-muted">Mỗi công thức có calo từng phần, thời gian chuẩn bị và nút thêm toàn bộ nguyên liệu vào giỏ.</p>
      </div>
      <div className="mb-6 space-y-3 rounded-3xl border border-line bg-white p-5">
        <div className="flex flex-wrap gap-3"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm món…" className="max-w-xs" />{myAllergens.length > 0 && <Toggle checked={safe} onChange={setSafe} label="Ẩn món có thành phần tôi dị ứng" />}</div>
        <ChipGroup value={diet} onChange={setDiet} options={[{ value: 'eat_clean', label: 'Eat Clean' }, { value: 'keto', label: 'Keto' }, { value: 'vegan', label: 'Thuần chay' }, { value: 'high_protein', label: 'Giàu đạm' }]} />
        <ChipGroup value={meal} onChange={setMeal} options={[{ value: 'breakfast', label: 'Bữa sáng' }, { value: 'lunch', label: 'Bữa trưa' }, { value: 'dinner', label: 'Bữa tối' }, { value: 'snack', label: 'Bữa phụ' }]} />
        <ChipGroup value={maxCal} onChange={setMaxCal} options={[{ value: '250', label: '≤ 250 kcal' }, { value: '450', label: '≤ 450 kcal' }, { value: '600', label: '≤ 600 kcal' }]} />
      </div>
      {list.isLoading ? <ProductGridSkeleton count={6} /> : !list.data?.length ? <EmptyState title="Không có công thức phù hợp" description="Thử bỏ bớt bộ lọc." /> : (
        <><p className="mb-4 text-sm text-muted">{list.data.length} công thức</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.data.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div></>
      )}
    </div>
  );
}
