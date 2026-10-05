import { apiClient } from '@/lib/api/axios';

export interface CreateOrderPayload {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  note?: string;
  paymentMethod: 'cod' | 'vnpay' | 'momo' | 'bank_transfer';
  shippingMethodId?: number;
  couponCode?: string;
  pointsToUse?: number;
  items: { variantId: number; quantity: number }[];
}

export const orderService = {
  async createOrder(data: CreateOrderPayload) {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  async getMyOrders() {
    const response = await apiClient.get('/orders/my-orders');
    return response.data;
  },

  async getOrderDetail(id: number) {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
};
