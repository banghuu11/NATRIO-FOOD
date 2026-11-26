'use client';

import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  /** Optional free-text input (e.g. cancellation reason). */
  input?: { label: string; placeholder?: string; required?: boolean };
}

interface UiState {
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  confirm: (ConfirmOptions & { id: number; resolve: (v: { ok: boolean; value?: string }) => void }) | null;
  openCart: () => void;
  closeCart: () => void;
  setMobileMenu: (v: boolean) => void;
  /** Promise-based confirmation dialog: `if ((await ask({...})).ok) ...` */
  ask: (o: ConfirmOptions) => Promise<{ ok: boolean; value?: string }>;
  closeConfirm: (result: { ok: boolean; value?: string }) => void;
}

export const useUi = create<UiState>((set, get) => ({
  cartOpen: false,
  mobileMenuOpen: false,
  confirm: null,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  setMobileMenu: (v) => set({ mobileMenuOpen: v }),
  ask: (o) => new Promise((resolve) => set((s) => ({ confirm: { ...o, id: (s.confirm?.id ?? 0) + 1 + Date.now(), resolve } }))),
  closeConfirm: (result) => {
    get().confirm?.resolve(result);
    set({ confirm: null });
  },
}));
