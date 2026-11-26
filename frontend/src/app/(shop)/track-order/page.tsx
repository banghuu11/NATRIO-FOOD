'use client';

import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Notice, Spinner } from '@/components/ui/feedback';
import { BankTransferBox, OrderItemsTable, OrderTimeline, StatusPill } from '@/components/shop/order-timeline';

function Track() {
  const sp = useSearchParams();
  const [orderNumber, setOrder] = useState(sp.get('order') || '');
  const [phone, setPhone] = useState('');
  const track = useMutation({ mutationFn: async () => (await api.post<Order>('/orders/track', { orderNumber: orderNumber.trim(), phone: phone.trim() })).data });
  return (
    <div className="container-page max-w-3xl py-10">
      <div className="text-center">
        <PackageSearch className="mx-auto h-12 w-12 text-forest-600" />
        <h1 className="mt-3 text-3xl sm:text-4xl">Tra cứu đơn hàng</h1>
        <p className="mt-2 text-muted">Nhập mã đơn hàng (VD: NT261031000034) và số điện thoại nhận hàng.</p>
      </div>
      <form className="mt-8 grid gap-3 rounded-3xl border border-line bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); if (orderNumber && phone) track.mutate(); }}>
        <Field label="Mã đơn hàng"><Input value={orderNumber} onChange={(e) => setOrder(e.target.value.toUpperCase())} placeholder="NT…" required /></Field>
        <Field label="Số điện thoại"><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required /></Field>
        <Button type="submit" loading={track.isPending}>Tra cứu</Button>
      </form>
      {track.isError && <Notice tone="danger" className="mt-5">{apiError(track.error)}</Notice>}
      {track.data && (
        <div className="mt-6 space-y-5 rounded-3xl border border-line bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="font-mono text-lg font-bold">{track.data.orderNumber}</div><div className="text-sm text-muted">Đặt lúc {formatDate(track.data.placedAt, true)} · {track.data.paymentMethodLabel} · {track.data.paymentStatusLabel}</div></div>
            <StatusPill status={track.data.status} label={track.data.statusLabel} />
          </div>
          <OrderTimeline order={track.data} />
          {track.data.bankTransfer && <BankTransferBox info={track.data.bankTransfer} />}
          <OrderItemsTable order={track.data} />
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return <Suspense fallback={<Spinner />}><Track /></Suspense>;
}
