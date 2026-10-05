import { apiClient } from '@/lib/api/axios';

export interface HealthMeta {
  allergens: { id: number; code: string; nameVi: string; iconUrl?: string }[];
  diets: { id: number; code: string; nameVi: string; iconUrl?: string }[];
}

export interface HealthProfileData {
  hasProfile: boolean;
  profile: {
    heightCm: number;
    weightKg: number;
    targetWeightKg?: number | null;
    activityLevel: string;
    goal: string;
    bmi?: number | null;
    bmr?: number | null;
    tdee?: number | null;
    dailyCalorieTarget?: number | null;
    dailyProteinG?: number | null;
    dailyCarbG?: number | null;
    dailyFatG?: number | null;
    dailyWaterMl: number;
    medicalNote?: string | null;
  } | null;
  allergens: { code: string; name: string }[];
  diets: { code: string; name: string }[];
}

export const healthService = {
  async getMeta(): Promise<HealthMeta> {
    const response = await apiClient.get('/health/meta');
    return response.data;
  },

  async getMyProfile(): Promise<HealthProfileData> {
    const response = await apiClient.get('/health/profile');
    return response.data;
  },

  async updateProfile(data: {
    heightCm: number;
    weightKg: number;
    targetWeightKg?: number;
    activityLevel: string;
    goal: string;
    medicalNote?: string;
    allergenCodes?: string[];
    dietCodes?: string[];
  }): Promise<HealthProfileData> {
    const response = await apiClient.put('/health/profile', data);
    return response.data;
  },

  async logWater(amountMl: number) {
    const response = await apiClient.post('/health/water-log', { amountMl });
    return response.data;
  },

  async logFood(data: {
    productId?: number;
    customFoodName?: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    quantityG: number;
    caloriesKcal?: number;
    proteinG?: number;
  }) {
    const response = await apiClient.post('/health/food-diary', data);
    return response.data;
  },
};
