import { apiClient } from '@/lib/api/axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
}

export interface AuthUser {
  id: number | string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  roles: string[];
  role?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    return res.data;
  },

  async getMe(): Promise<any> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

