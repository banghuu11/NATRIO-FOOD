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

export interface AdminOrderListItem {
  id: number;
  orderNumber: string;
  customer: {
    id: number;
    name: string;
    phone?: string;
    email: string;
  };
  recipient: {
    name: string;
    phone: string;
    address: string;
    note?: string | null;
  };
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  placedAt: string;
  itemsCount: number;
  itemsSummary: string;
  trackingNumber?: string | null;
  carrier?: string | null;
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

  async getAdminOrders(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminOrderListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await apiClient.get('/orders/admin/all', { params });
    return response.data;
  },

  async updateOrderStatus(id: number, status: string, note?: string) {
    const response = await apiClient.patch(`/orders/admin/${id}/status`, { status, note });
    return response.data;
  },

  async createShipment(id: number, data: { carrier: string; trackingCode: string; estimatedDelivery?: string }) {
    const response = await apiClient.post(`/orders/admin/${id}/shipment`, data);
    return response.data;
  },
};
