import { apiClient } from '@/lib/api/axios';

/**
 * Tự động đảm bảo phiên làm việc Admin đã được cấp JWT Bearer Token hợp lệ.
 * Giúp người dùng/lập trình viên truy cập mọi menu quản trị mà không bị gián đoạn 401.
 */
export async function ensureAdminSession(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  let token = localStorage.getItem('access_token');
  if (token) return token;

  try {
    const res = await apiClient.post('/auth/login', {
      email: 'admin@nutrio.vn',
      password: 'Admin@123',
    });
    if (res.data?.accessToken) {
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(res.data.user || {}));
      return res.data.accessToken;
    }
  } catch (err) {
    console.error('Không thể tự động kích hoạt phiên Admin:', err);
  }
  return null;
}

