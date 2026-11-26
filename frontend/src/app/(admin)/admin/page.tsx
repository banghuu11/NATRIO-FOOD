'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, CalendarClock, ClipboardList, Package, ShoppingCart, Users, Wallet, Loader } from 'lucide-react';
import { get } from '@/lib/api';
import { formatDate, formatNumber, formatPrice } from '@/lib/utils';
import { Card, PageHeader, Stat, Table } from '@/components/admin/kit';
import { RankedBars, TimeSeries } from '@/components/admin/charts';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { ChipGroup } from '@/components/ui/form';
import { StatusPill } from '@/components/shop/order-timeline';

interface Dash {
  kpis: { revenue: number; orders: number; customers: number; products: number; newOrders: number; processingOrders: number };
  revenueSeries: { label: string; date: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; label: string; count: number; amount: number }[];
  bestSellers: { productId: number; name: string; units: number; revenue: number }[];
  lowStock: { variantId: number; sku: string; productName: string; variantName: string; available: number; reorderLevel: number }[];
  nearExpiry: { batchId: number; batchCode: string; productName: string; variantName: string; expiresOn: string; daysLeft: number; quantity: number }[];
  recentOrders: { id: number; orderNumber: string; customer: string; total: number; status: string; statusLabel: string; placedAt: string }[];
}

export default function Dashboard() {
  const [g, setG] = useState<'day' | 'month' | 'year'>('day');
  const q = useQuery({ queryKey: ['admin-dash', g], queryFn: () => get<Dash>('/admin/dashboard', { granularity: g }) });
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data;
  return (
    <div>
      <PageHeader title="Tổng quan" description="Số liệu doanh thu tính trên đơn đã giao thành công." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {!d ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            <div className="col-span-2"><Stat label="Tổng doanh thu" value={formatPrice(d.kpis.revenue)} icon={<Wallet className="h-5 w-5" />} hint="Đơn giao thành công / hoàn tất" /></div>
            <Stat label="Tổng đơn hàng" value={formatNumber(d.kpis.orders)} icon={<ShoppingCart className="h-5 w-5" />} />
            <Stat label="Khách hàng" value={formatNumber(d.kpis.customers)} icon={<Users className="h-5 w-5" />} />
            <Stat label="Sản phẩm đang bán" value={formatNumber(d.kpis.products)} icon={<Package className="h-5 w-5" />} />
            <div className="grid gap-4">
              <Link href="/admin/orders?status=pending" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5"><div className="text-xs text-amber-800">Đơn mới chờ xác nhận</div><div className="text-xl font-bold text-amber-900">{d.kpis.newOrders}</div></Link>
              <div className="rounded-2xl border border-line bg-white px-4 py-2.5"><div className="flex items-center gap-1 text-xs text-muted"><Loader className="h-3 w-3" /> Đang xử lý / giao</div><div className="text-xl font-bold">{d.kpis.processingOrders}</div></div>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Doanh thu" actions={<ChipGroup value={g} onChange={(v) => v && setG(v)} options={[{ value: 'day', label: '30 ngày' }, { value: 'month', label: '12 tháng' }, { value: 'year', label: 'Theo năm' }]} />}>
          {!d ? <Skeleton className="h-72" /> : <TimeSeries data={d.revenueSeries} dataKey="revenue" money />}
        </Card>
        <Card title="Đơn hàng theo trạng thái">{!d ? <Skeleton className="h-72" /> : <RankedBars items={[...d.statusBreakdown].sort((a, b) => b.count - a.count).map((s) => ({ label: s.label, value: s.count }))} />}</Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card title="Số đơn theo thời gian" className="xl:col-span-2">{!d ? <Skeleton className="h-60" /> : <TimeSeries data={d.revenueSeries} dataKey="orders" height={220} />}</Card>
        <Card title="Sản phẩm bán chạy (30 ngày)">{!d ? <Skeleton className="h-60" /> : <RankedBars items={d.bestSellers.map((b) => ({ label: b.name, value: b.units, sub: 'sp' }))} />}</Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Sắp hết hàng</span>} actions={<Link href="/admin/inventory?filter=low" className="text-xs font-semibold text-forest-700">Xem kho →</Link>} padded={false}>
          <Table head={['Sản phẩm', 'SKU', 'Còn', 'Mức đặt lại']} empty={!!d && !d.lowStock.length}>
            {d?.lowStock.map((l) => <tr key={l.variantId}><td className="px-4 py-2.5">{l.productName} <span className="text-muted">– {l.variantName}</span></td><td className="px-4 font-mono text-xs">{l.sku}</td><td className="px-4 font-bold text-danger">{l.available}</td><td className="px-4 text-muted">{l.reorderLevel}</td></tr>)}
          </Table>
        </Card>
        <Card title={<span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-danger" /> Lô sắp hết hạn (30 ngày)</span>} actions={<Link href="/admin/inventory?tab=batches" className="text-xs font-semibold text-forest-700">Xem lô →</Link>} padded={false}>
          <Table head={['Lô', 'Sản phẩm', 'HSD', 'Còn ngày', 'SL']} empty={!!d && !d.nearExpiry.length}>
            {d?.nearExpiry.map((n) => <tr key={n.batchId}><td className="px-4 py-2.5 font-mono text-xs">{n.batchCode}</td><td className="px-4">{n.productName}</td><td className="px-4">{formatDate(n.expiresOn)}</td><td className="px-4 font-bold text-danger">{n.daysLeft}</td><td className="px-4">{n.quantity}</td></tr>)}
          </Table>
        </Card>
      </div>

      <Card className="mt-5" title={<span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Đơn hàng mới nhất</span>} actions={<Link href="/admin/orders" className="text-xs font-semibold text-forest-700">Tất cả →</Link>} padded={false}>
        <Table head={['Mã đơn', 'Khách hàng', 'Thời gian', 'Tổng tiền', 'Trạng thái']}>
          {d?.recentOrders.map((o) => <tr key={o.id} className="hover:bg-sand-50/60"><td className="px-4 py-2.5"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-forest-700">{o.orderNumber}</Link></td><td className="px-4">{o.customer}</td><td className="px-4 text-muted">{formatDate(o.placedAt, true)}</td><td className="px-4 font-semibold">{formatPrice(o.total)}</td><td className="px-4"><StatusPill status={o.status} label={o.statusLabel} /></td></tr>)}
        </Table>
      </Card>
    </div>
  );
}
