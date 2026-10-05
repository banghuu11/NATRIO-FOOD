import { apiClient } from '@/lib/api/axios';

export interface CartResponse {
  cartId: number;
  items: {
    id: number;
    variantId?: number | null;
    bundleId?: number | null;
    name: string;
    variantName?: string;
    imageUrl: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    caloriesKcal: number;
  }[];
  itemCount: number;
  summary: {
    subtotal: number;
    discountAmount: number;
    finalTotal: number;
    appliedCoupon?: {
      code: string;
      description: string;
      discountType: string;
      discountValue: number;
    } | null;
  };
  nutritionSummary: {
    totalKcal: number;
    totalProteinG: number;
    totalCarbG: number;
    totalFatG: number;
    totalSugarG: number;
    totalFiberG: number;
  };
}

export const cartService = {
  async getCart(sessionToken?: string): Promise<CartResponse> {
    const response = await apiClient.get('/carts', { params: { sessionToken } });
    return response.data;
  },

  async addItem(data: { variantId?: number; bundleId?: number; quantity: number; sessionToken?: string }): Promise<CartResponse> {
    const response = await apiClient.post('/carts/items', data);
    return response.data;
  },

  async updateItemQuantity(itemId: number, quantity: number, sessionToken?: string): Promise<CartResponse> {
    const response = await apiClient.put(`/carts/items/${itemId}`, { quantity }, { params: { sessionToken } });
    return response.data;
  },

  async removeItem(itemId: number, sessionToken?: string): Promise<CartResponse> {
    const response = await apiClient.delete(`/carts/items/${itemId}`, { params: { sessionToken } });
    return response.data;
  },

  async applyCoupon(couponCode: string, sessionToken?: string): Promise<CartResponse> {
    const response = await apiClient.post('/carts/apply-coupon', { couponCode, sessionToken });
    return response.data;
  },
};
