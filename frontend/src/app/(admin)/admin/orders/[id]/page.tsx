'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BadgeDollarSign, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import type { BankTransfer } from '@/types';
import { Card, PageHeader } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/misc';
import { Logo } from '@/components/layout/logo';
import { BankTransferBox, StatusPill } from '@/components/shop/order-timeline';

interface D {
  id: number; orderNumber: string; status: string; statusLabel: string; nextStatuses: { status: string; label: string }[];
  paymentMethodLabel: string; paymentStatus: string; paymentStatusLabel: string; canConfirmPayment: boolean; placedAt: string; cancelReason: string | null;
  customer: { id: number | null; name: string; email: string | null; phone: string | null; guest?: boolean };
  shipping: { recipientName: string; phone: string; address: string; note: string | null; method: string | null };
  pricing: { subtotal: number; discountAmount: number; couponCode: string | null; pointsUsed: number; pointsDiscount: number; shippingFee: number; totalAmount: number; pointsEarned: number };
  items: { id: number; name: string; variantName: string | null; sku: string | null; unitPrice: number; quantity: number; lineTotal: number; allocations: { batchCode: string; expiresOn: string | null; warehouse: string; quantity: number; state: string }[] }[];
  history: { status: string; label: string; note: string | null; by: string; at: string }[];
  payments: { method: string; status: string; amount: number; paidAt: string | null; providerTxnId: string | null }[];
  shipments: { carrier: string | null; trackingNumber: string | null; status: string }[];
  bankTransfer: BankTransfer | null;
}
const ALLOC: Record<string, string> = { reserved: 'Đang giữ', shipped: 'Đã xuất kho', released: 'Đã nhả', returned: 'Đã nhập lại' };

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const ask = useUi((s) => s.ask);
  const can = useAuth((s) => s.can);
  const q = useQuery({ queryKey: ['admin-order', id], queryFn: () => get<D>(`/admin/orders/${id}`) });
  const status = useMutation({
    mutationFn: (v: { status: string; note?: string }) => api.patch(`/admin/orders/${id}/status`, v),
    onSuccess: () => { toast.success('Đã cập nhật trạng thái'); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const pay = useMutation({ mutationFn: () => api.post(`/admin/orders/${id}/confirm-payment`), onSuccess: () => { toast.success('Đã xác nhận thanh toán'); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });

  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorState message={apiError(q.error)} />;
  const o = q.data;

  const change = async (s: { status: string; label: string }) => {
    const danger = ['cancelled', 'returned'].includes(s.status);
    const r = await ask({
      title: `Chuyển đơn sang “${s.label}”?`,
      description: s.status === 'shipping' ? 'Hàng sẽ được trừ khỏi kho theo các lô đã giữ và tạo mã vận đơn.' : s.status === 'cancelled' ? 'Hàng giữ sẽ được nhả về kho, điểm và mã giảm giá được hoàn lại.' : s.status === 'returned' ? 'Hàng được nhập lại kho, khoản thanh toán được ghi nhận hoàn tiền.' : undefined,
      tone: danger ? 'danger' : 'default',
      confirmLabel: s.label,
      input: { label: danger ? 'Lý do' : 'Ghi chú (không bắt buộc)', required: danger },
    });
    if (r.ok) status.mutate({ status: s.status, note: r.value || undefined });
  };

  return (
    <div>
      <div className="no-print"><Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-700"><ArrowLeft className="h-4 w-4" /> Danh sách đơn</Link></div>
      <PageHeader
        title={`Đơn ${o.orderNumber}`}
        description={<>Đặt lúc {formatDate(o.placedAt, true)} · <StatusPill status={o.status} label={o.statusLabel} /></>}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> In hóa đơn</Button>}
      />

      {/* Printable invoice header */}
      <div className="mb-6 hidden print:block">
        <div className="flex items-center justify-between"><Logo /><div className="text-right text-sm"><b>HÓA ĐƠN BÁN HÀNG</b><br />{o.orderNumber} · {formatDate(o.placedAt, true)}</div></div>
        <p className="mt-2 text-xs">NUTRIO Food · 123 Lê Lợi, Q.1, TP.HCM · Hotline 1900 6868</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {can('order.update') && o.nextStatuses.length > 0 && (
            <Card title="Xử lý đơn hàng" className="no-print">
              <div className="flex flex-wrap gap-2">
                {o.nextStatuses.map((s) => <Button key={s.status} variant={['cancelled', 'returned'].includes(s.status) ? 'outline' : 'primary'} className={['cancelled', 'returned'].includes(s.status) ? 'text-danger' : ''} loading={status.isPending && status.variables?.status === s.status} onClick={() => change(s)}>{s.label}</Button>)}
              </div>
              {o.status === 'pending' && o.paymentStatus !== 'paid' && o.paymentMethodLabel !== 'Thanh toán khi nhận hàng (COD)' && <p className="mt-3 text-xs text-warning">Lưu ý: đơn thanh toán trước nhưng chưa nhận tiền.</p>}
            </Card>
          )}
          <Card title="Sản phẩm" padded={false}>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line bg-sand-50/60 text-left text-xs text-muted uppercase"><th className="px-4 py-2.5">Sản phẩm</th><th className="px-4">Đơn giá</th><th className="px-4">SL</th><th className="px-4 text-right">Thành tiền</th></tr></thead>
              <tbody className="divide-y divide-line">
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3"><div className="font-medium">{i.name}</div><div className="text-xs text-muted">{i.variantName} · {i.sku}</div>
                      <div className="no-print mt-1 flex flex-wrap gap-1">{i.allocations.map((a, k) => <Badge key={k} tone={a.state === 'shipped' ? 'green' : a.state === 'reserved' ? 'warning' : 'neutral'}>{a.batchCode} ×{a.quantity} · {ALLOC[a.state]}{a.expiresOn && ` · HSD ${formatDate(a.expiresOn)}`}</Badge>)}</div>
                    </td>
                    <td className="px-4">{formatPrice(i.unitPrice)}</td><td className="px-4">{i.quantity}</td><td className="px-4 text-right font-semibold">{formatPrice(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto max-w-xs space-y-1.5 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd>{formatPrice(o.pricing.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Giảm giá {o.pricing.couponCode && `(${o.pricing.couponCode})`}</dt><dd>-{formatPrice(o.pricing.discountAmount)}</dd></div>
              {o.pricing.pointsDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Điểm ({o.pricing.pointsUsed})</dt><dd>-{formatPrice(o.pricing.pointsDiscount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Phí vận chuyển</dt><dd>{formatPrice(o.pricing.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Tổng cộng</dt><dd className="text-forest-700">{formatPrice(o.pricing.totalAmount)}</dd></div>
            </dl>
          </Card>
          <Card title="Lịch sử trạng thái" className="no-print">
            <ul className="space-y-3 text-sm">
              {[...o.history].reverse().map((h, k) => <li key={k} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest-500" /><div><b>{h.label}</b> <span className="text-muted">· {formatDate(h.at, true)} · {h.by}</span>{h.note && <div className="text-ink/80">{h.note}</div>}</div></li>)}
            </ul>
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Khách hàng">
            <div className="text-sm">
              <div className="font-semibold">{o.customer.name} {o.customer.guest && <Badge>Khách vãng lai</Badge>}</div>
              <div className="text-muted">{o.customer.email}</div><div className="text-muted">{o.customer.phone}</div>
              {o.customer.id && can('customer.read') && <Link href={`/admin/customers/${o.customer.id}`} className="no-print mt-2 inline-block text-xs font-semibold text-forest-700">Xem hồ sơ khách →</Link>}
            </div>
          </Card>
          <Card title="Giao hàng">
            <div className="space-y-1 text-sm"><div className="font-semibold">{o.shipping.recipientName} · {o.shipping.phone}</div><div>{o.shipping.address}</div><div className="text-muted">{o.shipping.method}</div>{o.shipping.note && <div className="rounded-lg bg-sand-50 p-2 text-xs">“{o.shipping.note}”</div>}{o.shipments.map((s) => <div key={s.trackingNumber} className="text-xs">Mã vận đơn: <b className="font-mono">{s.trackingNumber}</b> ({s.carrier})</div>)}</div>
          </Card>
          <Card title="Thanh toán">
            <div className="space-y-2 text-sm">
              <div>{o.paymentMethodLabel}</div>
              <Badge tone={o.paymentStatus === 'paid' ? 'green' : o.paymentStatus === 'refunded' ? 'brown' : 'warning'}>{o.paymentStatusLabel}</Badge>
              {o.payments.filter((p) => p.paidAt).map((p, k) => <div key={k} className="text-xs text-muted">Đã nhận {formatPrice(p.amount)} lúc {formatDate(p.paidAt!, true)} {p.providerTxnId && `· ${p.providerTxnId}`}</div>)}
              {o.canConfirmPayment && can('payment.confirm') && (
                <Button className="no-print mt-2 w-full" variant="secondary" loading={pay.isPending} onClick={async () => (await ask({ title: 'Xác nhận đã nhận tiền?', description: `Chỉ xác nhận khi đã kiểm tra tài khoản nhận được ${formatPrice(o.pricing.totalAmount)} với nội dung ${o.orderNumber}.`, confirmLabel: 'Đã nhận tiền' })).ok && pay.mutate()}>
                  <BadgeDollarSign className="h-4 w-4" /> Xác nhận thanh toán
                </Button>
              )}
            </div>
          </Card>
          {o.bankTransfer && o.paymentStatus !== 'paid' && <div className="no-print"><BankTransferBox info={o.bankTransfer} /></div>}
          {o.cancelReason && <Card title="Lý do hủy / hoàn"><p className="text-sm">{o.cancelReason}</p></Card>}
        </div>
      </div>
    </div>
  );
}
