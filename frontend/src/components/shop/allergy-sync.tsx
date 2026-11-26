'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { get } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { usePrefs } from '@/stores/prefs';

/** Keeps the local allergy/goal preferences in sync with the saved health profile. */
export function AllergySync() {
  const user = useAuth((s) => s.user);
  const { data } = useQuery({
    queryKey: ['nutrition-profile', user?.id],
    queryFn: () => get<{ allergens: { code: string }[]; input: { goal?: string } | null; result: { dailyCalorieTarget: number } | null }>('/nutrition/profile'),
    enabled: !!user,
    staleTime: 300_000,
  });
  useEffect(() => {
    if (!data) return;
    const s = usePrefs.getState();
    s.setAllergens(data.allergens.map((a) => a.code));
    if (data.input?.goal) s.setGoal(data.input.goal, data.result?.dailyCalorieTarget ?? null);
  }, [data]);
  return null;
}

export const ALLERGEN_NAMES: Record<string, string> = {
  peanut: 'Đậu phộng',
  tree_nut: 'Hạt cây',
  milk: 'Sữa',
  egg: 'Trứng',
  soy: 'Đậu nành',
  gluten: 'Gluten',
  fish: 'Cá',
  shellfish: 'Giáp xác',
  sesame: 'Mè',
};

/** Allergens of a product that the current user must avoid. */
export function useAllergyConflicts(allergens: { code: string; name: string; relation: string }[]) {
  const mine = usePrefs((s) => s.allergens);
  return allergens.filter((a) => mine.includes(a.code));
}
