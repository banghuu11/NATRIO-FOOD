import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthUser, LoginPayload, RegisterPayload } from '@/services/auth.service';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  isCustomer: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
        set({ user, token, isAuthenticated: true });
      },

      login: async (payload) => {
        set({ isLoading: true });
        try {
          const res = await authService.login(payload);
          const user = res.user;
          const token = res.accessToken;

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const res = await authService.register(payload);
          const user = res.user;
          const token = res.accessToken;

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
        if (!token) return;

        try {
          const profile = await authService.getMe();
          if (profile) {
            set((state) => ({
              user: state.user ? { ...state.user, ...profile } : profile,
              isAuthenticated: true,
            }));
          }
        } catch (e) {
          // Token expired or invalid
          get().logout();
        }
      },

      isAdmin: () => {
        const user = get().user;
        if (!user) return false;
        const roles = user.roles || (user.role ? [user.role] : []);
        return roles.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'staff');
      },

      isCustomer: () => {
        const user = get().user;
        if (!user) return false;
        const roles = user.roles || (user.role ? [user.role] : []);
        return roles.some((r) => r.toLowerCase() === 'customer');
      },
    }),
    {
      name: 'nutrio-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
