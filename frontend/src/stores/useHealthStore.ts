'use client';

import { create } from 'zustand';
import { HealthProfile, HealthGoal, ActivityLevel, Allergen } from '@/types';

interface HealthState {
  profile: HealthProfile;
  setProfile: (updates: Partial<HealthProfile>) => void;
  calculateMetrics: () => void;
  toggleAllergen: (allergen: Allergen) => void;
}

const DEFAULT_PROFILE: HealthProfile = {
  height: 170,
  weight: 65,
  age: 24,
  gender: 'MALE',
  activityLevel: 'MODERATE',
  goal: 'MAINTAIN',
  allergens: [],
  bmi: 22.5,
  bmr: 1620,
  tdee: 2200,
  targetCalories: 2200,
  targetProtein: 140,
  targetCarbs: 250,
  targetFat: 60,
};

export const useHealthStore = create<HealthState>((set, get) => ({
  profile: DEFAULT_PROFILE,

  setProfile: (updates) => {
    set((state) => ({
      profile: { ...state.profile, ...updates },
    }));
    get().calculateMetrics();
  },

  toggleAllergen: (allergen) => {
    set((state) => {
      const exists = state.profile.allergens.includes(allergen);
      const allergens = exists
        ? state.profile.allergens.filter((a) => a !== allergen)
        : [...state.profile.allergens, allergen];
      return { profile: { ...state.profile, allergens } };
    });
  },

  calculateMetrics: () => {
    const { height, weight, age, gender, activityLevel, goal } = get().profile;
    if (!height || !weight || !age) return;

    // 1. BMI: kg / (m^2)
    const heightM = height / 100;
    const bmi = Number((weight / (heightM * heightM)).toFixed(1));

    // 2. BMR (Mifflin-St Jeor)
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'MALE' ? 5 : -161;
    bmr = Math.round(bmr);

    // 3. TDEE
    const activityMultipliers: Record<ActivityLevel, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    };
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));

    // 4. Target Calories based on Goal
    let targetCalories = tdee;
    if (goal === 'LOSE_WEIGHT') targetCalories = Math.max(1200, tdee - 500);
    if (goal === 'GAIN_MUSCLE') targetCalories = tdee + 300;

    // 5. Target Macros (approx grams)
    // Protein: 2g/kg, Fat: 25% calories, Carbs: remainder
    const targetProtein = Math.round(weight * 2);
    const fatCalories = targetCalories * 0.25;
    const targetFat = Math.round(fatCalories / 9);
    const carbCalories = targetCalories - (targetProtein * 4 + fatCalories);
    const targetCarbs = Math.max(50, Math.round(carbCalories / 4));

    set((state) => ({
      profile: {
        ...state.profile,
        bmi,
        bmr,
        tdee,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
      },
    }));
  },
}));
