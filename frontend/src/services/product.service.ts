import { apiClient } from '@/lib/api/axios';

export interface ProductItem {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand?: { id: number; name: string } | null;
  nutriScoreGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  nutriScorePoints?: number;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  primaryImage: string;
  defaultVariant?: {
    id: number;
    sku: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    netWeightG: number;
  } | null;
  nutrition?: {
    caloriesKcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    sugarG?: number;
    fiberG?: number;
  } | null;
  diets?: { code: string; name: string; iconUrl?: string | null }[];
  allergens?: { code: string; name: string; relation: string }[];
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  productCount: number;
}

export const productService = {
  async getProducts(params?: {
    categorySlug?: string;
    dietCode?: string;
    excludeAllergen?: string;
    nutriScore?: string;
    maxCalories?: number;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ProductItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  async getProductBySlug(slug: string) {
    const response = await apiClient.get(`/products/${slug}`);
    return response.data;
  },

  async getCategories(): Promise<CategoryItem[]> {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async getTraceability(qrCode: string) {
    const response = await apiClient.get(`/products/traceability/${qrCode}`);
    return response.data;
  },
};
