'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ProductCard as PC } from '@/types';
import { ProductCard } from '@/components/shop/product-card';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ProductGridSkeleton } from '@/components/ui/feedback';

type W = PC & { priceAlert: boolean; alertTargetPrice: number | null };

export default function WishlistPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['wishlist'], queryFn: () => get<W[]>('/account/wishlist') });
  const alert = useMutation({
    mutationFn: ({ id, on }: { id: number; on: boolean }) => api.post(`/account/wishlist/${id}/price-alert?active=${on}`),
    onSuccess: (_, v) => {
      toast.success(v.on ? 'Đã bật thông báo giảm giá' : 'Đã tắt thông báo giảm giá');
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h1 className="text-2xl">Sản phẩm yêu thích</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Bật chuông để nhận thông báo ngay khi sản phẩm giảm giá.</p>
      {q.isLoading ? <ProductGridSkeleton count={3} /> : !q.data?.length ? (
        <EmptyState icon={<Heart className="h-8 w-8" />} title="Chưa có sản phẩm yêu thích" description="Nhấn biểu tượng trái tim trên sản phẩm để lưu lại." action={<ButtonLink href="/products">Khám phá sản phẩm</ButtonLink>} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {q.data.map((p) => (
            <div key={p.id}>
              <ProductCard product={p} />
              <button onClick={() => alert.mutate({ id: p.id, on: !p.priceAlert })} className={cn('mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold', p.priceAlert ? 'bg-forest-50 text-forest-700' : 'bg-sand-50 text-muted')}>
                {p.priceAlert ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />} {p.priceAlert ? 'Đang theo dõi giảm giá' : 'Bật thông báo giảm giá'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
