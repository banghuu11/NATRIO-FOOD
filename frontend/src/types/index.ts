// ==========================================
// NUTRIO / NATRIOFOOD - Types Definition
// ==========================================

export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type HealthGoal = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_MUSCLE';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

export type ProductBadge = 
  | 'ORGANIC' 
  | 'VIETGAP' 
  | 'NON_GMO' 
  | 'VEGAN' 
  | 'KETO' 
  | 'HIGH_PROTEIN' 
  | 'LOW_SUGAR' 
  | 'GLUTEN_FREE'
  | 'FLASH_SALE'
  | 'RECOMMENDED'
  | (string & {});

export type Allergen = 
  | 'PEANUTS' 
  | 'MILK_LACTOSE' 
  | 'GLUTEN' 
  | 'SEAFOOD' 
  | 'EGGS' 
  | 'SOY';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  itemCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  unit: string;
  thumbnail: string;
  images?: string[];
  category: Category;
  categoryId: string;
  
  // Dinh dưỡng thông minh (Per serving / 100g)
  servingSize: string;
  calories: number; // kcal
  protein: number; // gram
  carbs: number; // gram
  fat: number; // gram
  fiber?: number; // gram
  sugar?: number; // gram
  
  nutriScore: NutriScoreGrade;
  badges: ProductBadge[];
  allergens: Allergen[];
  
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  stock: number;
  
  // Minh bạch nguồn gốc
  farmOrigin?: string;
  harvestDate?: string;
  expiryDays?: number;
  description?: string;
}

export interface ProductFilterParams {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  nutriScore?: NutriScoreGrade;
  allergensExclude?: Allergen[];
  sortBy?: 'price_asc' | 'price_desc' | 'popular' | 'calories_asc' | 'protein_desc';
  page?: number;
  limit?: number;
}

export interface HealthProfile {
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'MALE' | 'FEMALE';
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  allergens: Allergen[];
  
  // Tính toán
  bmi?: number;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MealPlanDay {
  day: string;
  title: string;
  calories: number;
  meals: {
    type: 'Bữa Sáng' | 'Bữa Trưa' | 'Bữa Tối' | 'Bữa Phụ';
    product: Product;
  }[];
}

// ==========================================
// User & Auth Types
// ==========================================
export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  healthProfile?: HealthProfile;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ==========================================
// API Response Wrapper
// ==========================================
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
