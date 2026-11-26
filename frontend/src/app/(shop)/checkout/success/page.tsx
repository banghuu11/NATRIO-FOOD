'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { useSessionValue } from '@/hooks/use-mounted';
import { CheckCircle2, Mail } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import type { BankTransfer } from '@/types';
import { ButtonLink } from '@/components/ui/button';
import { BankTransferBox } from '@/components/shop/order-timeline';
import { Spinner } from '@/components/ui/feedback';

interface Stored { order: { id: number; orderNumber: string; totalAmount: number; paymentMethod: string }; payment: { bankTransfer: BankTransfer | null } }

function Success() {
  const sp = useSearchParams();
  const number = sp.get('order') || '';
  const user = useAuth((s) => s.user);
  const raw = useSessionValue(`nutrio_order_${number}`);
  const data = useMemo<Stored | null>(() => (raw ? JSON.parse(raw) : null), [raw]);

  return (
    <div className="container-page max-w-3xl py-12">
      <div className="rounded-3xl border border-line bg-white p-6 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 animate-fade-up text-forest-600" />
        <h1 className="mt-4 text-3xl sm:text-4xl">Đặt hàng thành công!</h1>
        <p className="mt-2 text-muted">Cảm ơn bạn đã tin chọn NUTRIO. Mã đơn hàng của bạn:</p>
        <div className="mt-3 inline-block rounded-xl bg-sand-50 px-5 py-2 font-mono text-2xl font-bold tracking-wider text-forest-700">{number}</div>
        {data && <p className="mt-3 text-sm">Tổng thanh toán: <b>{formatPrice(data.order.totalAmount)}</b></p>}
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted"><Mail className="h-4 w-4" /> Thông tin đơn hàng được gửi tới email của bạn (nếu hệ thống email đã được cấu hình).</p>
        {data?.payment.bankTransfer && <div className="mt-6 text-left"><BankTransferBox info={data.payment.bankTransfer} /></div>}
        {data?.order.paymentMethod === 'cod' && <p className="mt-5 rounded-xl bg-forest-50 p-3 text-sm text-forest-800">Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng. NUTRIO sẽ gọi xác nhận đơn trong giờ làm việc.</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user && data ? <ButtonLink href={`/account/orders/${data.order.id}`}>Theo dõi đơn hàng</ButtonLink> : <ButtonLink href={`/track-order?order=${number}`}>Tra cứu đơn hàng</ButtonLink>}
          <ButtonLink href="/products" variant="outline">Tiếp tục mua sắm</ButtonLink>
        </div>
        {!user && <p className="mt-5 text-xs text-muted">Lưu lại mã đơn và số điện thoại để <Link href="/track-order" className="underline">tra cứu đơn hàng</Link> bất cứ lúc nào.</p>}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<Spinner className="py-32" />}><Success /></Suspense>;
}
