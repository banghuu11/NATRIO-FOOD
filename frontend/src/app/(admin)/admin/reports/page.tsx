'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { get } from '@/lib/api';
import { formatDate, formatNumber, formatPrice } from '@/lib/utils';
import { Card, PageHeader, Stat, Table, download } from '@/components/admin/kit';
import { RankedBars, TimeSeries } from '@/components/admin/charts';
import { Button } from '@/components/ui/button';
import { ChipGroup, Input } from '@/components/ui/form';
import { ErrorState, Skeleton } from '@/components/ui/feedback';

interface Rep {
  range: { from: string; to: string };
  summary: { totalOrders: number; completedOrders: number; cancelledOrders: number; returnedOrders: number; revenue: number; grossSales: number; discounts: number; shippingCollected: number; averageOrderValue: number; successRate: number };
  daily: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; sku: string; units: number; revenue: number }[];
  topCustomers: { userId: number; name: string; email: string; orders: number; spent: number }[];
  paymentMethods: { method: string; orders: number; amount: number }[];
}
const PM: Record<string, string> = { cod: 'COD', bank_transfer: 'Chuyển khoản', vnpay: 'VNPay', momo: 'MoMo' };
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function ReportsPage() {
  const [preset, setPreset] = useState<string | null>('30');
  const [range, setRange] = useState(() => ({ from: iso(new Date(Date.now() - 29 * 864e5)), to: iso(new Date()) }));
  const q = useQuery({ queryKey: ['admin-report', range], queryFn: () => get<Rep>('/admin/reports', range) });
  const pick = (days: string | null) => {
    setPreset(days);
    if (days) setRange({ from: iso(new Date(Date.now() - (Number(days) - 1) * 864e5)), to: iso(new Date()) });
  };
  const r = q.data;
  return (
    <div>
      <PageHeader
        title="Báo cáo thống kê"
        description={r ? `Từ ${formatDate(r.range.from)} đến ${formatDate(r.range.to)} · doanh thu tính trên đơn giao thành công` : ''}
        actions={<><Button variant="outline" onClick={() => download('/admin/reports/export', range, `bao-cao-nutrio-${range.from}_${range.to}.xlsx`)}><Download className="h-4 w-4" /> Xuất Excel</Button><Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> In / Lưu PDF</Button></>}
      />
      <div className="no-print mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <ChipGroup value={preset} onChange={pick} options={[{ value: '7', label: '7 ngày' }, { value: '30', label: '30 ngày' }, { value: '90', label: '90 ngày' }, { value: '365', label: '12 tháng' }]} />
        <div className="flex items-center gap-2 text-sm"><Input type="date" className="w-40" value={range.from} max={range.to} onChange={(e) => { setPreset(null); setRange({ ...range, from: e.target.value }); }} /> → <Input type="date" className="w-40" value={range.to} min={range.from} onChange={(e) => { setPreset(null); setRange({ ...range, to: e.target.value }); }} /></div>
      </div>
      {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : !r ? <Skeleton className="h-96" /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label="Doanh thu" value={formatPrice(r.summary.revenue)} hint={`Doanh số gộp ${formatPrice(r.summary.grossSales)}`} />
            <Stat label="Số đơn hàng" value={formatNumber(r.summary.totalOrders)} hint={`${r.summary.completedOrders} thành công`} />
            <Stat label="Giá trị đơn TB" value={formatPrice(r.summary.averageOrderValue)} />
            <Stat label="Tỷ lệ thành công" value={`${r.summary.successRate}%`} hint={`${r.summary.cancelledOrders} hủy · ${r.summary.returnedOrders} hoàn`} />
            <Stat label="Tổng giảm giá" value={formatPrice(r.summary.discounts)} hint={`Phí ship thu ${formatPrice(r.summary.shippingCollected)}`} />
          </div>
          <Card title="Doanh thu theo ngày"><TimeSeries data={r.daily.map((d) => ({ label: formatDate(d.day).replace(/ thg /, '/').slice(0, 6), revenue: d.revenue, orders: d.orders }))} dataKey="revenue" money /></Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Số đơn theo ngày"><TimeSeries data={r.daily.map((d) => ({ label: formatDate(d.day).slice(0, 6), revenue: d.revenue, orders: d.orders }))} dataKey="orders" height={220} /></Card>
            <Card title="Phương thức thanh toán (số đơn)"><RankedBars items={r.paymentMethods.map((p) => ({ label: PM[p.method] ?? p.method, value: p.orders }))} /></Card>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Sản phẩm bán chạy" padded={false}>
              <Table head={['#', 'Sản phẩm', 'SL', 'Doanh thu']} empty={!r.topProducts.length}>
                {r.topProducts.map((p, i) => <tr key={p.sku + i}><td className="px-4 py-2.5 text-muted">{i + 1}</td><td className="px-4">{p.name}<div className="font-mono text-[11px] text-muted">{p.sku}</div></td><td className="px-4 font-semibold">{p.units}</td><td className="px-4">{formatPrice(p.revenue)}</td></tr>)}
              </Table>
            </Card>
            <Card title="Khách hàng mua nhiều nhất" padded={false}>
              <Table head={['#', 'Khách hàng', 'Đơn', 'Chi tiêu']} empty={!r.topCustomers.length}>
                {r.topCustomers.map((c, i) => <tr key={c.userId}><td className="px-4 py-2.5 text-muted">{i + 1}</td><td className="px-4">{c.name}<div className="text-[11px] text-muted">{c.email}</div></td><td className="px-4">{c.orders}</td><td className="px-4 font-semibold">{formatPrice(c.spent)}</td></tr>)}
              </Table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
