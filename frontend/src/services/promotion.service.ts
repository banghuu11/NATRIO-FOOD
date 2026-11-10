import { apiClient } from '@/lib/api/axios';

export interface CouponItem {
  id: number;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number;
  usedCount: number;
  firstOrderOnly: boolean;
  startsAt?: string;
  endsAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  firstOrderOnly?: boolean;
  endsAt?: string;
}

export interface FlashSaleAdminItem {
  id: number;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  items: {
    id: number;
    variantId: number;
    productName: string;
    variantName: string;
    originalPrice: number;
    salePrice: number;
    discountPercent: number;
    quantityLimit: number;
    soldCount: number;
    imageUrl: string;
  }[];
}

export const promotionService = {
  async getAdminCoupons(): Promise<CouponItem[]> {
    const response = await apiClient.get('/promotions/admin/coupons');
    return response.data;
  },

  async createCoupon(data: CreateCouponPayload) {
    const response = await apiClient.post('/promotions/admin/coupons', data);
    return response.data;
  },

  async updateCoupon(id: number, data: Partial<CreateCouponPayload> & { isActive?: boolean }) {
    const response = await apiClient.put(`/promotions/admin/coupons/${id}`, data);
    return response.data;
  },

  async deleteCoupon(id: number) {
    const response = await apiClient.delete(`/promotions/admin/coupons/${id}`);
    return response.data;
  },

  async getAdminFlashSales(): Promise<FlashSaleAdminItem[]> {
    const response = await apiClient.get('/promotions/admin/flash-sales');
    return response.data;
  },

  async createFlashSale(data: {
    name: string;
    startsAt: string;
    endsAt: string;
    items?: { variantId: number; salePrice: number; quantityLimit?: number }[];
  }) {
    const response = await apiClient.post('/promotions/admin/flash-sales', data);
    return response.data;
  },

  async toggleFlashSale(id: number, isActive: boolean) {
    const response = await apiClient.patch(`/promotions/admin/flash-sales/${id}/toggle`, { isActive });
    return response.data;
  },
};

