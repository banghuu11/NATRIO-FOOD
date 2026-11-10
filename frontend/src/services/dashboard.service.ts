import { apiClient } from '@/lib/api/axios';

export interface DashboardStats {
  revenue: {
    total: number;
    currency: string;
    formatted: string;
  };
  orders: {
    total: number;
    pending: number;
    delivered: number;
  };
  customers: {
    total: number;
  };
  fefoAlerts: {
    critical: number;
    warning: number;
    totalExpiringSoon: number;
  };
  inventory: {
    lowStockCount: number;
  };
}

export interface FefoAlertSummary {
  id: number;
  batchCode: string;
  qrCode: string;
  productName: string;
  variantName: string;
  nutriScore: string;
  expiryDate: string;
  daysLeft: number;
  quantityOnHand: number;
  warehouse: string;
  status: 'critical' | 'warning' | 'good';
}

export interface RecentOrderSummary {
  id: number;
  orderCode: string;
  customerName: string;
  phone?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  itemsCount: number;
}

export interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    totalDiscountGiven: number;
    averageOrderValue: number;
  };
  statusDistribution: Record<string, number>;
  paymentMethodDistribution: Record<string, { count: number; total: number }>;
  topSellingProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  async getFefoAlerts(limit = 5): Promise<FefoAlertSummary[]> {
    const response = await apiClient.get('/admin/dashboard/fefo-alerts', { params: { limit } });
    return response.data;
  },

  async getRecentOrders(limit = 10): Promise<RecentOrderSummary[]> {
    const response = await apiClient.get('/admin/dashboard/recent-orders', { params: { limit } });
    return response.data;
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await apiClient.get('/admin/dashboard/analytics');
    return response.data;
  },
};

