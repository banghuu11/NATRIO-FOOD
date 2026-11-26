'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MiniProduct {
  id: number;
  slug: string;
  name: string;
  image: string;
}

interface PrefsState {
  /** Allergen codes to avoid – synced from the health profile when logged in. */
  allergens: string[];
  hideAllergenProducts: boolean;
  goal: string | null;
  calorieTarget: number | null;
  compare: MiniProduct[];
  recentlyViewed: number[];
  searchHistory: string[];
  setAllergens: (a: string[]) => void;
  setHideAllergenProducts: (v: boolean) => void;
  setGoal: (goal: string | null, calories?: number | null) => void;
  toggleCompare: (p: MiniProduct) => 'added' | 'removed' | 'full';
  clearCompare: () => void;
  removeCompare: (id: number) => void;
  addViewed: (id: number) => void;
  addSearch: (q: string) => void;
  removeSearch: (q: string) => void;
  clearSearch: () => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      allergens: [],
      hideAllergenProducts: false,
      goal: null,
      calorieTarget: null,
      compare: [],
      recentlyViewed: [],
      searchHistory: [],
      setAllergens: (allergens) => set({ allergens }),
      setHideAllergenProducts: (v) => set({ hideAllergenProducts: v }),
      setGoal: (goal, calories) => set({ goal, calorieTarget: calories ?? get().calorieTarget }),
      toggleCompare: (p) => {
        const list = get().compare;
        if (list.some((x) => x.id === p.id)) {
          set({ compare: list.filter((x) => x.id !== p.id) });
          return 'removed';
        }
        if (list.length >= 3) return 'full';
        set({ compare: [...list, p] });
        return 'added';
      },
      clearCompare: () => set({ compare: [] }),
      removeCompare: (id) => set({ compare: get().compare.filter((x) => x.id !== id) }),
      addViewed: (id) => set({ recentlyViewed: [id, ...get().recentlyViewed.filter((x) => x !== id)].slice(0, 12) }),
      addSearch: (q) => {
        const t = q.trim();
        if (!t) return;
        set({ searchHistory: [t, ...get().searchHistory.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) });
      },
      removeSearch: (q) => set({ searchHistory: get().searchHistory.filter((x) => x !== q) }),
      clearSearch: () => set({ searchHistory: [] }),
    }),
    // Rehydrated after mount (see Providers) so the server and first client render match.
    { name: 'nutrio-prefs', skipHydration: true },
  ),
);
