'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Printer, RotateCcw } from 'lucide-react';
import { apiError, get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { useOrderActions } from '@/hooks/use-order-actions';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { SmartImage } from '@/components/ui/misc';
import { BankTransferBox, OrderTimeline, StatusPill } from '@/components/shop/order-timeline';
import { ReviewForm } from '@/components/shop/reviews';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['my-order', id], queryFn: () => get<Order>(`/orders/${id}`), retry: false });
  const { reorder, askCancel, retry } = useOrderActions(() => q.refetch());
  const [reviewing, setReviewing] = useState<Order['items'][number] | null>(null);

  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorState message={apiError(q.error)} />;
  const o = q.data;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-forest-700"><ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi</Link>
        <div className="flex flex-wrap gap-2">
          {o.canRetryPayment && <Button size="sm" variant="accent" loading={retry.isPending} onClick={() => retry.mutate(o.orderNumber)}>Thanh toán lại</Button>}
          {o.canCancel && <Button size="sm" variant="outline" onClick={() => askCancel(o)}>Hủy đơn</Button>}
          <Button size="sm" variant="outline" loading={reorder.isPending} onClick={() => reorder.mutate(o.id)}><RotateCcw className="h-4 w-4" /> Mua lại</Button>
          <Button size="sm" variant="ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> In hóa đơn</Button>
        </div>
      </div>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold">{o.orderNumber}</h1>
            <div className="text-sm text-muted">Đặt lúc {formatDate(o.placedAt, true)}</div>
          </div>
          <div className="text-right"><StatusPill status={o.status} label={o.statusLabel} /><div className="mt-1 text-xs text-muted">{o.paymentMethodLabel} · <b>{o.paymentStatusLabel}</b></div></div>
        </div>
        <OrderTimeline order={o} />
      </section>

      {o.bankTransfer && <BankTransferBox info={o.bankTransfer} />}

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5 text-sm">
          <h2 className="mb-2 font-sans font-semibold">Địa chỉ nhận hàng</h2>
          <div className="font-medium">{o.shipping.recipientName} · {o.shipping.phone}</div>
          <div className="text-ink/80">{o.shipping.address}</div>
          {o.note && <div className="mt-2 text-muted">Ghi chú: {o.note}</div>}
        </section>
        <section className="rounded-3xl border border-line bg-white p-5 text-sm">
          <h2 className="mb-2 font-sans font-semibold">Vận chuyển</h2>
          <div>{o.shipping.method ?? '—'}</div>
          {o.shipments.map((s) => <div key={s.trackingNumber} className="text-ink/80">{s.carrier} · Mã vận đơn <b className="font-mono">{s.trackingNumber}</b>{s.estimatedDeliveryAt && o.status === 'shipping' && <> · Dự kiến {formatDate(s.estimatedDeliveryAt)}</>}</div>)}
          {o.pricing.pointsEarned > 0 && <div className="mt-2 text-latte-700">{['delivered', 'completed'].includes(o.status) ? 'Đã cộng' : 'Sẽ cộng'} {o.pricing.pointsEarned} điểm thưởng</div>}
        </section>
      </div>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-7">
        <h2 className="mb-3 font-sans text-lg font-semibold">Sản phẩm</h2>
        <ul className="divide-y divide-line">
          {o.items.map((it) => (
            <li key={it.id} className="flex flex-wrap items-center gap-3 py-3">
              <SmartImage src={it.image} alt="" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                {it.slug ? <Link href={`/products/${it.slug}`} className="font-medium hover:text-forest-700">{it.name}</Link> : <span className="font-medium">{it.name}</span>}
                <div className="text-xs text-muted">{it.variantName} · {formatPrice(it.unitPrice)} × {it.quantity}</div>
              </div>
              <div className="font-semibold">{formatPrice(it.lineTotal)}</div>
              {it.canReview && <Button size="sm" variant="secondary" className="no-print" onClick={() => setReviewing(it)}>Viết đánh giá</Button>}
              {it.reviewed && <span className="text-xs font-medium text-forest-700">✓ Đã đánh giá</span>}
            </li>
          ))}
        </ul>
        <dl className="mt-3 ml-auto max-w-sm space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd>{formatPrice(o.pricing.subtotal)}</dd></div>
          {o.pricing.discountAmount > 0 && <div className="flex justify-between"><dt className="text-muted">Giảm giá {o.pricing.couponCode && `(${o.pricing.couponCode})`}</dt><dd className="text-sale">-{formatPrice(o.pricing.discountAmount)}</dd></div>}
          {o.pricing.pointsDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Điểm thưởng ({o.pricing.pointsUsed})</dt><dd className="text-sale">-{formatPrice(o.pricing.pointsDiscount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Phí vận chuyển</dt><dd>{o.pricing.shippingFee ? formatPrice(o.pricing.shippingFee) : 'Miễn phí'}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Tổng thanh toán</dt><dd className="text-forest-700">{formatPrice(o.pricing.totalAmount)}</dd></div>
        </dl>
      </section>

      {reviewing && (
        <ReviewForm
          item={{ orderItemId: reviewing.id, orderNumber: o.orderNumber, productId: reviewing.productId!, name: reviewing.name, variantName: reviewing.variantName, image: reviewing.image ?? '' }}
          onClose={() => setReviewing(null)}
          onDone={() => { q.refetch(); qc.invalidateQueries({ queryKey: ['review-eligible'] }); }}
        />
      )}
    </div>
  );
}
