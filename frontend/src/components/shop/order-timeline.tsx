import { CheckCircle2, CircleDot, Package, PackageCheck, Truck, XCircle, RotateCcw, ClipboardCheck } from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import type { BankTransfer, Order } from '@/types';
import { SmartImage } from '@/components/ui/misc';

const FLOW = [
  { s: 'pending', label: 'Chờ xác nhận', icon: CircleDot },
  { s: 'confirmed', label: 'Đã xác nhận', icon: ClipboardCheck },
  { s: 'processing', label: 'Đang chuẩn bị hàng', icon: Package },
  { s: 'shipping', label: 'Đang giao', icon: Truck },
  { s: 'delivered', label: 'Giao thành công', icon: PackageCheck },
];

export const STATUS_TONE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-sky-50 text-sky-800',
  processing: 'bg-indigo-50 text-indigo-800',
  shipping: 'bg-violet-50 text-violet-800',
  delivered: 'bg-forest-50 text-forest-700',
  completed: 'bg-forest-50 text-forest-700',
  cancelled: 'bg-red-50 text-danger',
  returned: 'bg-sand-100 text-latte-700',
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_TONE[status] ?? 'bg-sand-100')}>{label}</span>;
}

/** Horizontal progress of the delivery flow + full dated history. */
export function OrderTimeline({ order }: { order: Order }) {
  const stopped = ['cancelled', 'returned'].includes(order.status);
  const idx = Math.max(0, FLOW.findIndex((f) => f.s === (order.status === 'completed' ? 'delivered' : order.status)));
  const at = (s: string) => order.history.find((h) => h.status === s)?.at;
  return (
    <div>
      {!stopped ? (
        <ol className="grid grid-cols-5 gap-1">
          {FLOW.map((f, i) => (
            <li key={f.s} className="flex flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div className={cn('h-0.5 flex-1', i === 0 ? 'invisible' : i <= idx ? 'bg-forest-500' : 'bg-sand-200')} />
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', i <= idx ? 'bg-forest-600 text-white' : 'bg-sand-100 text-muted')}><f.icon className="h-5 w-5" /></span>
                <div className={cn('h-0.5 flex-1', i === FLOW.length - 1 ? 'invisible' : i < idx ? 'bg-forest-500' : 'bg-sand-200')} />
              </div>
              <div className={cn('mt-2 text-[11px] font-semibold sm:text-xs', i <= idx ? 'text-ink' : 'text-muted')}>{f.label}</div>
              {at(f.s) && <div className="text-[10px] text-muted">{formatDate(at(f.s)!, true)}</div>}
            </li>
          ))}
        </ol>
      ) : (
        <div className={cn('flex items-center gap-3 rounded-2xl p-4', order.status === 'cancelled' ? 'bg-red-50 text-danger' : 'bg-sand-100 text-latte-700')}>
          {order.status === 'cancelled' ? <XCircle className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
          <div><div className="font-semibold">{order.statusLabel}</div>{order.cancelReason && <div className="text-sm">Lý do: {order.cancelReason}</div>}</div>
        </div>
      )}
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-semibold text-forest-700">Lịch sử trạng thái & vận chuyển</summary>
        <ul className="mt-3 space-y-3 border-l-2 border-sand-200 pl-5">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <CheckCircle2 className="absolute top-0.5 -left-[29px] h-4 w-4 bg-white text-forest-600" />
              <div className="font-medium">{h.label}</div>
              <div className="text-xs text-muted">{formatDate(h.at, true)}{h.note && ` · ${h.note}`}</div>
            </li>
          ))}
          {order.shipments.flatMap((s) => s.events.map((e, i) => (
            <li key={`${s.trackingNumber}-${i}`} className="relative">
              <Truck className="absolute top-0.5 -left-[29px] h-4 w-4 bg-white text-latte-500" />
              <div className="font-medium">{e.description}</div>
              <div className="text-xs text-muted">{formatDate(e.at, true)} · {e.location} · Mã vận đơn {s.trackingNumber}</div>
            </li>
          )))}
        </ul>
      </details>
    </div>
  );
}

export function BankTransferBox({ info }: { info: BankTransfer }) {
  return (
    <div className="grid gap-5 rounded-2xl border border-forest-200 bg-forest-50/60 p-5 sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto aspect-square w-44 overflow-hidden rounded-xl bg-white">
        <SmartImage src={info.qrUrl} alt="Mã VietQR" fill sizes="180px" className="object-contain" />
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="font-semibold text-forest-800">Quét mã VietQR bằng ứng dụng ngân hàng</div>
        <div>Ngân hàng: <b>{info.bankName}</b></div>
        <div>Số tài khoản: <b className="font-mono">{info.accountNo}</b></div>
        <div>Chủ tài khoản: <b>{info.accountName}</b></div>
        <div>Số tiền: <b className="text-forest-700">{formatPrice(info.amount)}</b></div>
        <div>Nội dung: <b className="rounded bg-white px-1.5 py-0.5 font-mono">{info.content}</b></div>
        <p className="pt-1 text-xs text-muted">Đơn hàng được xác nhận sau khi NUTRIO kiểm tra đã nhận tiền. Trạng thái thanh toán hiện tại: chưa thanh toán.</p>
      </div>
    </div>
  );
}

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 py-3">
            <SmartImage src={it.image} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
            <div className="min-w-0 flex-1"><div className="font-medium">{it.name}</div><div className="text-xs text-muted">{it.variantName} · {formatPrice(it.unitPrice)} × {it.quantity}</div></div>
            <div className="font-semibold">{formatPrice(it.lineTotal)}</div>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd>{formatPrice(order.pricing.subtotal)}</dd></div>
        {order.pricing.discountAmount > 0 && <div className="flex justify-between"><dt className="text-muted">Giảm giá{order.pricing.couponCode && ` (${order.pricing.couponCode})`}</dt><dd className="text-sale">-{formatPrice(order.pricing.discountAmount)}</dd></div>}
        {order.pricing.pointsDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Điểm thưởng ({order.pricing.pointsUsed})</dt><dd className="text-sale">-{formatPrice(order.pricing.pointsDiscount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Phí vận chuyển</dt><dd>{order.pricing.shippingFee ? formatPrice(order.pricing.shippingFee) : 'Miễn phí'}</dd></div>
        <div className="flex justify-between text-base font-bold"><dt>Tổng cộng</dt><dd className="text-forest-700">{formatPrice(order.pricing.totalAmount)}</dd></div>
      </dl>
    </div>
  );
}
