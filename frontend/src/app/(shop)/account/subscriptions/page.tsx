'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CalendarClock, Pause, Play, Repeat, SkipForward, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { useUi } from '@/stores/ui';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Badge, SmartImage } from '@/components/ui/misc';

interface Sub {
  id: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  statusLabel: string;
  plan: { name: string; discountPercent: number };
  nextDeliveryDate: string;
  pausedUntil: string | null;
  address: string | null;
  items: { variantId: number; name: string; variantName: string; image: string; quantity: number; unitPrice: number; inStock: boolean }[];
  estimatedTotal: number;
  recentOrders: { id: number; orderNumber: string; status: string; placedAt: string; total: number }[];
}

export default function SubscriptionsPage() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['subs'], queryFn: () => get<Sub[]>('/subscriptions') });
  const act = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: string; reason?: string }) => api.patch(`/subscriptions/${id}`, { action, reason }),
    onSuccess: () => {
      toast.success('Đã cập nhật gói giao định kỳ');
      q.refetch();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h1 className="text-2xl">Giao hàng định kỳ</h1>
      <p className="mt-1 mb-5 text-sm text-muted">NUTRIO tự tạo đơn COD theo lịch, giảm 5–10%. Đăng ký từ trang chi tiết sản phẩm (nút “Giao định kỳ”).</p>
      {q.isLoading ? <Spinner /> : !q.data?.length ? (
        <EmptyState icon={<Repeat className="h-8 w-8" />} title="Bạn chưa có gói giao định kỳ" description="Không bao giờ hết hạt ăn hằng ngày – tạm dừng hoặc hủy bất cứ lúc nào." action={<ButtonLink href="/products?category=mix-hat-dinh-duong">Chọn sản phẩm</ButtonLink>} />
      ) : (
        <ul className="space-y-4">
          {q.data.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{s.plan.name} <Badge tone="sale" className="ml-1">-{s.plan.discountPercent}%</Badge></div>
                <Badge tone={s.status === 'active' ? 'green' : s.status === 'paused' ? 'warning' : 'neutral'}>{s.statusLabel}</Badge>
              </div>
              {s.status !== 'cancelled' && <div className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CalendarClock className="h-4 w-4" /> {s.status === 'paused' && s.pausedUntil ? `Tạm dừng đến ${formatDate(s.pausedUntil)}` : `Lần giao tới: ${formatDate(s.nextDeliveryDate)}`}</div>}
              <ul className="mt-3 space-y-2">
                {s.items.map((it) => (
                  <li key={it.variantId} className="flex items-center gap-3 text-sm">
                    <SmartImage src={it.image} alt="" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" />
                    <span className="flex-1">{it.name} – {it.variantName} × {it.quantity} {!it.inStock && <span className="text-xs text-danger">(đang hết hàng)</span>}</span>
                    <span>{formatPrice(it.unitPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-sm">Dự kiến mỗi kỳ: <b className="text-forest-700">{formatPrice(s.estimatedTotal)}</b> <span className="text-muted">· {s.address}</span></div>
              {s.recentOrders.length > 0 && <div className="mt-2 text-xs text-muted">Đơn gần đây: {s.recentOrders.map((o) => <Link key={o.id} href={`/account/orders/${o.id}`} className="mr-2 underline">{o.orderNumber}</Link>)}</div>}
              {s.status !== 'cancelled' && (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {s.status === 'active' ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act.mutate({ id: s.id, action: 'skip' })}><SkipForward className="h-4 w-4" /> Bỏ qua kỳ tới</Button>
                      <Button size="sm" variant="outline" onClick={() => act.mutate({ id: s.id, action: 'pause' })}><Pause className="h-4 w-4" /> Tạm dừng 2 tuần</Button>
                    </>
                  ) : <Button size="sm" onClick={() => act.mutate({ id: s.id, action: 'resume' })}><Play className="h-4 w-4" /> Tiếp tục</Button>}
                  <Button size="sm" variant="ghost" className="text-danger" onClick={async () => { const r = await ask({ title: 'Hủy gói giao định kỳ?', tone: 'danger', confirmLabel: 'Hủy gói', input: { label: 'Lý do (không bắt buộc)' } }); if (r.ok) act.mutate({ id: s.id, action: 'cancel', reason: r.value }); }}><XCircle className="h-4 w-4" /> Hủy gói</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
