'use client';

import { create } from 'zustand';
import { api, cartTokenStore, tokenStore } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  ready: boolean;
  /** Loads the current user from the stored token (called once on app start). */
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  init: async () => {
    if (!tokenStore.get()) return set({ ready: true });
    try {
      const { data } = await api.get<User>('/auth/me');
      set({ user: data, ready: true });
    } catch {
      tokenStore.clear();
      set({ user: null, ready: true });
    }
  },
  refresh: async () => {
    if (!tokenStore.get()) return;
    const { data } = await api.get<User>('/auth/me');
    set({ user: data });
  },
  setSession: async (token, user) => {
    tokenStore.set(token);
    set({ user });
    // Move the guest cart into the account
    const guest = cartTokenStore.peek();
    if (guest) {
      try {
        await api.post('/cart/merge', { guestToken: guest });
      } catch {
        /* ignore – the guest cart may be empty */
      }
      cartTokenStore.reset();
    }
    await get().refresh();
  },
  logout: () => {
    tokenStore.clear();
    cartTokenStore.reset();
    set({ user: null });
  },
  can: (permission) => {
    const u = get().user;
    return !!u && (u.roles.includes('admin') || u.permissions.includes(permission));
  },
}));
