'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import type { Cart } from '@/types';

export const CART_KEY = ['cart'];

export function useCart() {
  const userId = useAuth((s) => s.user?.id ?? 'guest');
  return useQuery({
    queryKey: [...CART_KEY, userId],
    queryFn: async () => (await api.get<Cart>('/cart')).data,
    staleTime: 15_000,
  });
}

export function useCartActions() {
  const qc = useQueryClient();
  const userId = useAuth((s) => s.user?.id ?? 'guest');
  const openCart = useUi((s) => s.openCart);
  const setCart = (c: Cart) => qc.setQueryData([...CART_KEY, userId], c);

  const add = useMutation({
    mutationFn: async (v: { variantId?: number; bundleId?: number; quantity: number; name?: string; silent?: boolean }) =>
      (await api.post<Cart>('/cart/items', { variantId: v.variantId, bundleId: v.bundleId, quantity: v.quantity })).data,
    onSuccess: (cart, v) => {
      setCart(cart);
      if (!v.silent) {
        toast.success(v.name ? `Đã thêm "${v.name}" vào giỏ` : 'Đã thêm vào giỏ hàng', { action: { label: 'Xem giỏ', onClick: openCart } });
      }
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const addMany = useMutation({
    mutationFn: async (items: { variantId?: number; bundleId?: number; quantity: number }[]) =>
      (await api.post<{ added: string[]; skipped: { name: string; reason: string }[]; cart: Cart }>('/cart/items/bulk', { items })).data,
    onSuccess: (r) => {
      setCart(r.cart);
      if (r.added.length) toast.success(`Đã thêm ${r.added.length} sản phẩm vào giỏ`, { action: { label: 'Xem giỏ', onClick: openCart } });
      if (r.skipped.length) toast.warning(`Không thêm được: ${r.skipped.map((s) => `${s.name} (${s.reason})`).join(', ')}`);
      if (!r.added.length && !r.skipped.length) toast.info('Không có sản phẩm nào để thêm');
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const update = useMutation({
    mutationFn: async (v: { id: number; quantity: number }) => (await api.patch<Cart>(`/cart/items/${v.id}`, { quantity: v.quantity })).data,
    onSuccess: setCart,
    onError: (e) => {
      toast.error(apiError(e));
      qc.invalidateQueries({ queryKey: CART_KEY });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete<Cart>(`/cart/items/${id}`)).data,
    onSuccess: (c) => {
      setCart(c);
      toast.success('Đã xóa sản phẩm khỏi giỏ');
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const applyCoupon = useMutation({
    mutationFn: async (code: string) => (await api.post<Cart>('/cart/coupon', { code })).data,
    onSuccess: (c) => {
      setCart(c);
      toast.success(`Đã áp dụng mã ${c.couponCode}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const removeCoupon = useMutation({
    mutationFn: async () => (await api.delete<Cart>('/cart/coupon')).data,
    onSuccess: setCart,
  });

  return { add, addMany, update, remove, applyCoupon, removeCoupon, refetch: () => qc.invalidateQueries({ queryKey: CART_KEY }) };
}
