import axios, { AxiosError } from 'axios';
import { uuid } from './utils';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

const TOKEN_KEY = 'nutrio_token';
const CART_KEY = 'nutrio_cart_token';

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Guest cart identifier – created once per browser and kept until the cart is merged on login. */
export const cartTokenStore = {
  get: () => {
    if (typeof window === 'undefined') return null;
    let t = localStorage.getItem(CART_KEY);
    if (!t) {
      t = `guest-${uuid()}`;
      localStorage.setItem(CART_KEY, t);
    }
    return t;
  },
  peek: () => (typeof window === 'undefined' ? null : localStorage.getItem(CART_KEY)),
  reset: () => localStorage.removeItem(CART_KEY),
};

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const cart = cartTokenStore.get();
  if (cart) config.headers['x-cart-token'] = cart;
  return config;
});

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from any API error. */
export function apiError(e: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại'): string {
  const err = e as AxiosError<{ message?: string | string[] }>;
  if (err?.code === 'ECONNABORTED') return 'Máy chủ phản hồi quá lâu, vui lòng thử lại';
  if (err?.message === 'Network Error') return 'Không kết nối được máy chủ. Vui lòng kiểm tra backend đang chạy.';
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m[0] || fallback;
  return m || fallback;
}

/** Typed GET helper for React Query. */
export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await api.get<T>(url, { params })).data;
