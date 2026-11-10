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

export interface CreateProductPayload {
  name: string;
  slug?: string;
  categoryId: number;
  shortDescription?: string;
  description?: string;
  originCountry?: string;
  shelfLifeDays?: number;
  nutriScoreGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  isFeatured?: boolean;
  status?: 'draft' | 'active' | 'archived' | 'discontinued';
  imageUrls?: string[];
  initialVariant?: {
    sku: string;
    name: string;
    netWeightG: number;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    reorderLevel?: number;
  };
  nutritionFacts?: {
    caloriesKcal: number;
    proteinG: number;
    carbohydratesG: number;
    sugarsG?: number;
    fatG: number;
    fiberG?: number;
    sodiumMg?: number;
  };
}

export interface UpdateProductPayload {
  name?: string;
  categoryId?: number;
  shortDescription?: string;
  description?: string;
  originCountry?: string;
  shelfLifeDays?: number;
  nutriScoreGrade?: 'A' | 'B' | 'C' | 'D' | 'E';
  isFeatured?: boolean;
  status?: string;
  nutritionFacts?: {
    caloriesKcal?: number;
    proteinG?: number;
    carbohydratesG?: number;
    sugarsG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
  };
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

  async getAllForAdmin(params?: {
    search?: string;
    status?: string;
    nutriScore?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/products/admin/all', { params });
    return response.data;
  },

  async createProduct(data: CreateProductPayload) {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  async updateProduct(id: number, data: UpdateProductPayload) {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  async archiveProduct(id: number) {
    const response = await apiClient.delete(`/products/${id}`);
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
