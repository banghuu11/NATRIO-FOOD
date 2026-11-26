'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, Copy, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { get } from '@/lib/api';
import { cn, formatDate, formatNumber, formatPrice } from '@/lib/utils';
import { Spinner } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/misc';

interface Loyalty {
  pointsBalance: number;
  lifetimePoints: number;
  tier: { code: string; name: string; discountPercent: number; multiplier: number } | null;
  nextTier: { name: string; minPoints: number; pointsNeeded: number } | null;
  tiers: { code: string; name: string; minPoints: number; discountPercent: number; multiplier: number; benefits: { free_ship_min?: number } }[];
  totalSpent: number;
  completedOrders: number;
  transactions: { id: number; type: string; points: number; description: string; orderNumber: string | null; createdAt: string }[];
}
interface Voucher { code: string; description: string | null; discountType: string; discountValue: number; maxDiscountAmount: number | null; minOrderAmount: number; endsAt: string | null; minTier: string | null; usable: boolean; reason: string | null }

const TIER_STYLE: Record<string, string> = { member: 'from-latte-600 to-latte-400', silver: 'from-slate-500 to-slate-300', gold: 'from-amber-500 to-yellow-300' };

export default function LoyaltyPage() {
  const l = useQuery({ queryKey: ['loyalty'], queryFn: () => get<Loyalty>('/account/loyalty') });
  const v = useQuery({ queryKey: ['vouchers-mine'], queryFn: () => get<Voucher[]>('/account/vouchers') });
  if (l.isLoading || !l.data) return <Spinner />;
  const d = l.data;
  const progress = d.nextTier ? Math.min(100, (d.lifetimePoints / d.nextTier.minPoints) * 100) : 100;

  return (
    <div className="space-y-5">
      <section className={cn('rounded-3xl bg-gradient-to-br p-6 text-white', TIER_STYLE[d.tier?.code ?? 'member'])}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Award className="h-5 w-5" /> Hạng thành viên</div>
            <div className="mt-1 font-display text-4xl font-bold">{d.tier?.name ?? 'Bronze'}</div>
            <div className="mt-1 text-sm opacity-90">Giảm {d.tier?.discountPercent ?? 0}% mọi đơn · Nhân {d.tier?.multiplier ?? 1}× điểm</div>
          </div>
          <div className="text-right"><div className="text-sm opacity-90">Điểm khả dụng</div><div className="font-display text-4xl font-bold">{formatNumber(d.pointsBalance)}</div><div className="text-sm opacity-90">≈ {formatPrice(d.pointsBalance * 100)}</div></div>
        </div>
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-semibold"><span>{formatNumber(d.lifetimePoints)} điểm tích lũy</span><span>{d.nextTier ? `Còn ${formatNumber(d.nextTier.pointsNeeded)} điểm lên ${d.nextTier.name}` : 'Hạng cao nhất'}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} /></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {d.tiers.map((t) => (
          <div key={t.code} className={cn('rounded-2xl border bg-white p-4 text-sm', d.tier?.code === t.code ? 'border-forest-600 ring-2 ring-forest-100' : 'border-line')}>
            <div className="font-semibold">{t.name} {d.tier?.code === t.code && <Badge tone="green">Hạng của bạn</Badge>}</div>
            <div className="text-xs text-muted">Từ {formatNumber(t.minPoints)} điểm</div>
            <ul className="mt-2 space-y-1 text-ink/80"><li>• Giảm {t.discountPercent}% mọi đơn</li><li>• Nhân {t.multiplier}× điểm thưởng</li><li>• Freeship từ {t.benefits.free_ship_min === 0 ? 'mọi đơn' : formatPrice(t.benefits.free_ship_min ?? 300000)}</li></ul>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted">Quy đổi: 1.000₫ = 1 điểm (nhân theo hạng) · 1 điểm = 100₫ khi thanh toán, dùng tối đa 50% giá trị đơn. Điểm được cộng khi đơn giao thành công. Tổng chi tiêu: {formatPrice(d.totalSpent)} ({d.completedOrders} đơn).</p>

      <section className="rounded-3xl border border-line bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold"><Ticket className="h-5 w-5 text-latte-500" /> Voucher của bạn</h2>
        {v.isLoading ? <Spinner /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {v.data?.map((c) => (
              <div key={c.code} className={cn('flex overflow-hidden rounded-2xl border', c.usable ? 'border-latte-300' : 'border-line opacity-60')}>
                <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-latte-500/10 p-2 text-center text-latte-700">
                  <div className="text-lg leading-tight font-bold">{c.discountType === 'percent' ? `${c.discountValue}%` : c.discountType === 'free_shipping' ? 'FREE SHIP' : `${c.discountValue / 1000}K`}</div>
                </div>
                <div className="flex-1 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><b className="font-mono">{c.code}</b><button onClick={() => { navigator.clipboard.writeText(c.code); toast.success(`Đã sao chép ${c.code}`); }} className="cursor-pointer text-muted hover:text-forest-700" aria-label="Sao chép"><Copy className="h-4 w-4" /></button></div>
                  <div className="text-ink/80">{c.description}</div>
                  <div className="mt-1 text-xs text-muted">Đơn từ {formatPrice(c.minOrderAmount)}{c.endsAt && ` · HSD ${formatDate(c.endsAt)}`}</div>
                  {!c.usable && c.reason && <div className="mt-1 text-xs text-danger">{c.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-white p-5">
        <h2 className="mb-3 font-sans text-lg font-semibold">Lịch sử điểm</h2>
        {!d.transactions.length ? <p className="text-sm text-muted">Chưa có giao dịch điểm.</p> : (
          <ul className="divide-y divide-line text-sm">
            {d.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div><div>{t.description}</div><div className="text-xs text-muted">{formatDate(t.createdAt, true)}</div></div>
                <b className={t.points > 0 ? 'text-forest-700' : 'text-sale'}>{t.points > 0 ? '+' : ''}{t.points}</b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
