'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Package, RotateCcw } from 'lucide-react';
import { get } from '@/lib/api';
import { useOrderActions } from '@/hooks/use-order-actions';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Order, Paged } from '@/types';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Pagination, SmartImage, Tabs } from '@/components/ui/misc';
import { StatusPill } from '@/components/shop/order-timeline';

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang chuẩn bị' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'returned', label: 'Hoàn trả' },
];

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['my-orders', status, page], queryFn: () => get<Paged<Order> & { counts: Record<string, number> }>('/orders', { status, page }), placeholderData: keepPreviousData });
  const { reorder, askCancel, retry } = useOrderActions(() => q.refetch());
  const counts = q.data?.counts ?? {};

  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h1 className="mb-4 text-2xl">Đơn hàng của tôi</h1>
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={TABS.map((t) => ({ ...t, count: t.value === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[t.value] ?? 0 }))} />
      <div className="mt-5">
        {q.isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div>
        ) : q.isError ? (
          <ErrorState onRetry={() => q.refetch()} />
        ) : !q.data?.data.length ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="Chưa có đơn hàng nào" description="Đơn hàng của bạn sẽ xuất hiện ở đây." action={<ButtonLink href="/products">Mua sắm ngay</ButtonLink>} />
        ) : (
          <ul className="space-y-4">
            {q.data.data.map((o) => (
              <li key={o.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div className="text-sm"><Link href={`/account/orders/${o.id}`} className="font-mono font-bold hover:text-forest-700">{o.orderNumber}</Link><span className="ml-2 text-muted">{formatDate(o.placedAt, true)}</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted">{o.paymentStatusLabel}</span><StatusPill status={o.status} label={o.statusLabel} /></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 py-3">
                  {o.items.slice(0, 4).map((it) => <SmartImage key={it.id} src={it.image} alt={it.name} width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />)}
                  <div className="min-w-0 flex-1 text-sm"><div className="line-clamp-1 font-medium">{o.items.map((i) => i.name).join(', ')}</div><div className="text-muted">{o.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm</div></div>
                  <div className="text-right"><div className="text-xs text-muted">Tổng tiền</div><div className="font-bold text-forest-700">{formatPrice(o.pricing.totalAmount)}</div></div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {o.canRetryPayment && <Button size="sm" variant="accent" loading={retry.isPending} onClick={() => retry.mutate(o.orderNumber)}>Thanh toán lại</Button>}
                  {o.canCancel && <Button size="sm" variant="outline" onClick={() => askCancel(o)}>Hủy đơn</Button>}
                  {o.items.some((i) => i.canReview) && <ButtonLink size="sm" variant="secondary" href={`/account/orders/${o.id}`}>Đánh giá</ButtonLink>}
                  <Button size="sm" variant="outline" loading={reorder.isPending && reorder.variables === o.id} onClick={() => reorder.mutate(o.id)}><RotateCcw className="h-4 w-4" /> Mua lại</Button>
                  <ButtonLink size="sm" href={`/account/orders/${o.id}`}>Xem chi tiết</ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
        {q.data && <div className="mt-6"><Pagination page={page} totalPages={q.data.meta.totalPages} onChange={setPage} /></div>}
      </div>
    </div>
  );
}
