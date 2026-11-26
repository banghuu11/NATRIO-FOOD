'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { useAuth } from '@/stores/auth';

export function useWishlist() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const router = useRouter();
  const ids = useQuery({
    queryKey: ['wishlist-ids', user?.id],
    queryFn: async () => new Set((await api.get<number[]>('/account/wishlist/ids')).data),
    enabled: !!user,
    staleTime: 60_000,
  });

  const toggle = useMutation({
    mutationFn: async ({ productId, on }: { productId: number; on: boolean }) => {
      if (on) await api.post('/account/wishlist', { productId });
      else await api.delete(`/account/wishlist/${productId}`);
      return on;
    },
    onSuccess: (on) => {
      toast.success(on ? 'Đã thêm vào yêu thích – bạn sẽ được báo khi giảm giá' : 'Đã bỏ khỏi yêu thích');
      qc.invalidateQueries({ queryKey: ['wishlist-ids'] });
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return {
    has: (id: number) => !!ids.data?.has(id),
    toggle: (productId: number) => {
      if (!user) {
        toast.info('Đăng nhập để lưu sản phẩm yêu thích');
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      toggle.mutate({ productId, on: !ids.data?.has(productId) });
    },
    pending: toggle.isPending,
  };
}
