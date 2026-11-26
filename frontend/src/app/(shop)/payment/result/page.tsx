'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { get } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { ButtonLink } from '@/components/ui/button';
import { Spinner } from '@/components/ui/feedback';

/** Return page for VNPay / MoMo. The order is marked paid only after the API verifies the gateway signature. */
function Result() {
  const sp = useSearchParams();
  const gateway = sp.get('gateway') === 'momo' ? 'momo' : 'vnpay';
  const user = useAuth((s) => s.user);
  const params = Object.fromEntries(sp.entries());
  delete params.gateway;
  const { data, isLoading } = useQuery({ queryKey: ['pay-verify', sp.toString()], queryFn: () => get<{ ok: boolean; message: string; orderNumber?: string; orderId?: number }>(`/payments/${gateway}/verify`, params), retry: false });
  if (isLoading) return <Spinner className="py-32" label="Đang xác minh giao dịch…" />;
  const ok = !!data?.ok;
  return (
    <div className="container-page max-w-xl py-16 text-center">
      {ok ? <CheckCircle2 className="mx-auto h-16 w-16 text-forest-600" /> : <XCircle className="mx-auto h-16 w-16 text-danger" />}
      <h1 className="mt-4 text-3xl">{ok ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}</h1>
      <p className="mt-2 text-muted">{data?.message || 'Không xác minh được giao dịch.'}{data?.orderNumber && ` · Đơn ${data.orderNumber}`}</p>
      {!ok && <p className="mt-2 text-sm text-muted">Đơn hàng vẫn được giữ trong 60 phút – bạn có thể thanh toán lại trong mục Đơn hàng.</p>}
      <div className="mt-8 flex justify-center gap-3">
        {data?.orderId && user ? <ButtonLink href={`/account/orders/${data.orderId}`}>Xem đơn hàng</ButtonLink> : <ButtonLink href="/track-order">Tra cứu đơn hàng</ButtonLink>}
        <ButtonLink href="/" variant="outline">Về trang chủ</ButtonLink>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return <Suspense fallback={<Spinner className="py-32" />}><Result /></Suspense>;
}
