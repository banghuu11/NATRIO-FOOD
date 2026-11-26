'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { useCartActions } from '@/hooks/use-cart';
import { useUi } from '@/stores/ui';
import type { Order } from '@/types';

/** Cancel (with reason), reorder and retry-payment actions shared by order list & detail. */
export function useOrderActions(onDone: () => void) {
  const ask = useUi((s) => s.ask);
  const router = useRouter();
  const { refetch } = useCartActions();
  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.post(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng');
      onDone();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const reorder = useMutation({
    mutationFn: async (id: number) => (await api.post<{ added: string[]; skipped: { name: string; reason: string }[] }>(`/orders/${id}/reorder`)).data,
    onSuccess: (r) => {
      refetch();
      if (r.added.length) toast.success(`Đã thêm ${r.added.length} sản phẩm vào giỏ`, { action: { label: 'Xem giỏ', onClick: () => router.push('/cart') } });
      if (r.skipped.length) toast.warning(`Không thêm được: ${r.skipped.map((s) => s.name).join(', ')}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const retry = useMutation({
    mutationFn: async (orderNumber: string) => (await api.post<{ redirectUrl: string }>(`/payments/retry/${orderNumber}`)).data,
    onSuccess: (r) => (window.location.href = r.redirectUrl),
    onError: (e) => toast.error(apiError(e)),
  });
  const askCancel = async (o: Order) => {
    const r = await ask({ title: `Hủy đơn ${o.orderNumber}?`, description: 'Sản phẩm sẽ được hoàn lại kho, điểm thưởng đã dùng sẽ được hoàn trả.', confirmLabel: 'Hủy đơn', cancelLabel: 'Giữ đơn', tone: 'danger', input: { label: 'Lý do hủy', placeholder: 'VD: Tôi muốn đổi sản phẩm khác', required: true } });
    if (r.ok) cancel.mutate({ id: o.id, reason: r.value! });
  };
  return { cancel, reorder, retry, askCancel };
}
