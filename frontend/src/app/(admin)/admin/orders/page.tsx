'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Download, Repeat, Search } from 'lucide-react';
import { get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Paged } from '@/types';
import { Card, PageHeader, Table, download } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { Badge, Pagination, Tabs } from '@/components/ui/misc';
import { StatusPill } from '@/components/shop/order-timeline';

interface Row { id: number; orderNumber: string; customer: string; phone: string; email: string | null; isGuest: boolean; itemCount: number; total: number; status: string; statusLabel: string; paymentMethodLabel: string; paymentStatus: string; paymentStatusLabel: string; placedAt: string; isSubscription: boolean }
const STATUSES = [['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['processing', 'Đang chuẩn bị'], ['shipping', 'Đang giao'], ['delivered', 'Giao thành công'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy'], ['returned', 'Hoàn trả']];

function Orders() {
  const sp = useSearchParams();
  const router = useRouter();
  const [qText, setQ] = useState(sp.get('q') || '');
  const f = { status: sp.get('status') || 'all', q: sp.get('q') || '', paymentStatus: sp.get('paymentStatus') || '', paymentMethod: sp.get('paymentMethod') || '', from: sp.get('from') || '', to: sp.get('to') || '', page: Number(sp.get('page') || 1) };
  const set = (patch: Partial<typeof f>) => {
    const n = new URLSearchParams(sp.toString());
    Object.entries({ ...patch, page: patch.page ?? 1 }).forEach(([k, v]) => (v && v !== 'all' && !(k === 'page' && v === 1) ? n.set(k, String(v)) : n.delete(k)));
    router.push(`/admin/orders?${n}`);
  };
  const params = { ...f, status: f.status === 'all' ? undefined : f.status, q: f.q || undefined, paymentStatus: f.paymentStatus || undefined, paymentMethod: f.paymentMethod || undefined, from: f.from || undefined, to: f.to || undefined };
  const q = useQuery({ queryKey: ['admin-orders', f], queryFn: () => get<Paged<Row> & { counts: Record<string, number> }>('/admin/orders', params), placeholderData: keepPreviousData });
  const counts = q.data?.counts ?? {};

  return (
    <div>
      <PageHeader title="Đơn hàng" description="Tìm kiếm, lọc và xử lý đơn hàng." actions={<Button variant="outline" onClick={() => download('/admin/orders/export', params, `don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`)}><Download className="h-4 w-4" /> Xuất Excel</Button>} />
      <Card padded={false}>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <form className="min-w-56 flex-1" onSubmit={(e) => { e.preventDefault(); set({ q: qText }); }}><Input value={qText} onChange={(e) => setQ(e.target.value)} placeholder="Mã đơn, tên, SĐT, email…" leftIcon={<Search className="h-4 w-4" />} /></form>
            <Select className="w-44" value={f.paymentStatus} onChange={(e) => set({ paymentStatus: e.target.value })}><option value="">TT thanh toán</option><option value="unpaid">Chưa thanh toán</option><option value="pending">Chờ thanh toán</option><option value="paid">Đã thanh toán</option><option value="refunded">Đã hoàn tiền</option></Select>
            <Select className="w-40" value={f.paymentMethod} onChange={(e) => set({ paymentMethod: e.target.value })}><option value="">Phương thức</option><option value="cod">COD</option><option value="bank_transfer">Chuyển khoản</option><option value="vnpay">VNPay</option><option value="momo">MoMo</option></Select>
            <Input type="date" className="w-40" value={f.from} onChange={(e) => set({ from: e.target.value })} aria-label="Từ ngày" />
            <Input type="date" className="w-40" value={f.to} onChange={(e) => set({ to: e.target.value })} aria-label="Đến ngày" />
          </div>
        </div>
        <Tabs className="px-2" value={f.status} onChange={(v) => set({ status: v })} tabs={STATUSES.map(([v, l]) => ({ value: v, label: l, count: v === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[v] ?? 0 }))} />
        {q.isLoading ? <Spinner /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : (
          <Table head={['Mã đơn', 'Khách hàng', 'Ngày đặt', 'SP', 'Tổng tiền', 'Thanh toán', 'Trạng thái']} empty={!q.data?.data.length}>
            {q.data?.data.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-sand-50/60" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-forest-700">{o.orderNumber}</Link>{o.isSubscription && <Repeat className="ml-1 inline h-3.5 w-3.5 text-latte-500" aria-label="Đơn định kỳ" />}</td>
                <td className="px-4"><div className="font-medium">{o.customer} {o.isGuest && <Badge>Khách vãng lai</Badge>}</div><div className="text-xs text-muted">{o.phone}</div></td>
                <td className="px-4 whitespace-nowrap text-muted">{formatDate(o.placedAt, true)}</td>
                <td className="px-4">{o.itemCount}</td>
                <td className="px-4 font-semibold whitespace-nowrap">{formatPrice(o.total)}</td>
                <td className="px-4"><div className="text-xs">{o.paymentMethodLabel}</div><Badge tone={o.paymentStatus === 'paid' ? 'green' : o.paymentStatus === 'refunded' ? 'brown' : 'warning'}>{o.paymentStatusLabel}</Badge></td>
                <td className="px-4"><StatusPill status={o.status} label={o.statusLabel} /></td>
              </tr>
            ))}
          </Table>
        )}
        {q.data && <div className="border-t border-line p-4"><Pagination page={f.page} totalPages={q.data.meta.totalPages} onChange={(p) => set({ page: p })} /></div>}
      </Card>
    </div>
  );
}

export default function AdminOrdersPage() {
  return <Suspense fallback={<Spinner />}><Orders /></Suspense>;
}
