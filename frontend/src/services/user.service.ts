import { apiClient } from '@/lib/api/axios';

export interface AdminUserItem {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  gender?: string;
  isActive: boolean;
  roles: string[];
  loyaltyPoints: number;
  tier: string;
  orderCount: number;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUserDetail extends AdminUserItem {
  addresses: {
    id: number;
    recipientName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault: boolean;
  }[];
  orders: {
    id: number;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
  totalSpent: number;
}

export interface UserAddress {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  note?: string | null;
  isDefault: boolean;
}

export interface UserFullProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  referralCode?: string;
  roles: string[];
  loyalty?: {
    pointsBalance: number;
    lifetimePoints: number;
    tier: string;
    discountPercent: number;
  };
  healthProfile?: {
    heightCm: number;
    weightKg: number;
    targetWeightKg?: number;
    activityLevel?: string;
    goal?: string;
    bmi: number;
    bmr: number;
    tdee: number;
    dailyCalorieTarget: number;
  } | null;
}

export const userService = {
  async getAdminUsers(params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminUserItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await apiClient.get('/users/admin/all', { params });
    return response.data;
  },

  async getUserDetail(id: number): Promise<AdminUserDetail> {
    const response = await apiClient.get(`/users/admin/${id}`);
    return response.data;
  },

  async updateUserStatus(id: number, isActive: boolean) {
    const response = await apiClient.patch(`/users/admin/${id}/status`, { isActive });
    return response.data;
  },

  async getMyProfile(): Promise<UserFullProfile> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    gender?: 'male' | 'female' | 'other';
  }) {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  async getAddresses(): Promise<UserAddress[]> {
    const response = await apiClient.get('/users/addresses');
    return response.data;
  },

  async addAddress(data: {
    label: string;
    recipientName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault?: boolean;
    note?: string;
  }): Promise<UserAddress> {
    const response = await apiClient.post('/users/addresses', data);
    return response.data;
  },

  async deleteAddress(id: number) {
    const response = await apiClient.delete(`/users/addresses/${id}`);
    return response.data;
  },
};

