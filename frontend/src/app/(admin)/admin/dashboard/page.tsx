'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  CalendarClock,
  ArrowUpRight,
  ChevronRight,
  Package,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Loader2,
  Users,
} from 'lucide-react';
import { dashboardService, DashboardStats, FefoAlertSummary, RecentOrderSummary } from '@/services/dashboard.service';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fefoAlerts, setFefoAlerts] = useState<FefoAlertSummary[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [statsData, fefoData, ordersData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getFefoAlerts(5),
          dashboardService.getRecentOrders(10),
        ]);
        setStats(statsData);
        setFefoAlerts(fefoData);
        setRecentOrders(ordersData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu Dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Chào mừng trở lại, Quản Trị Viên! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Báo cáo tổng quan hoạt động kinh doanh, tồn kho theo phương pháp FEFO & điều phối đơn hàng trực tiếp từ CSDL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory-fefo"
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <CalendarClock className="w-4 h-4 text-emerald-400" />
            <span>Xem Radar FEFO</span>
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Package className="w-4 h-4" />
            <span>Quản Lý Sản Phẩm</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Đang tải dữ liệu báo cáo từ CSDL...</span>
        </div>
      ) : (
        <>
          {/* 2. KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Doanh thu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {stats?.revenue?.formatted || '0 đ'}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Đơn hoàn tất: {stats?.orders?.delivered || 0}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Đơn hàng */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đơn Hàng</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">{stats?.orders?.total || 0} Đơn</div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  <span className="font-bold text-emerald-700">{stats?.orders?.pending || 0} Chờ xử lý</span> • {stats?.orders?.delivered || 0} Đã giao
                </div>
              </div>
            </div>

            {/* Card 3: Khách hàng */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khách Hàng Đăng Ký</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">{stats?.customers?.total || 0} Thành viên</div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  Dữ liệu hội viên tích cực
                </div>
              </div>
            </div>

            {/* Card 4: FEFO Cận Date */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lô Hàng Cận Hạn FEFO</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {stats?.fefoAlerts?.totalExpiringSoon || 0} Lô Hàng
                </div>
                <div className="text-xs font-bold text-amber-700 mt-1">
                  {stats?.fefoAlerts?.critical || 0} Lô nguy cấp (&lt; 15 ngày)
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Grid: Analytics & FEFO Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Revenue Chart Simulation (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tốc Độ Bán Hàng & Doanh Thu</h2>
                  <p className="text-xs text-slate-500">Phân bố doanh thu theo các ngày gần nhất</p>
                </div>
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
                >
                  <span>Xem Chi Tiết Analytics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Chart */}
              <div className="h-64 w-full relative flex items-end justify-between pt-8 pb-2 px-4 bg-slate-50/50 rounded-xl border border-slate-100">
                {[
                  { day: 'T2', val: 35, amt: '250.000 đ' },
                  { day: 'T3', val: 45, amt: '320.000 đ' },
                  { day: 'T4', val: 30, amt: '218.000 đ' },
                  { day: 'T5', val: 65, amt: '540.000 đ' },
                  { day: 'T6', val: 80, amt: '780.000 đ' },
                  { day: 'T7', val: 95, amt: '1.200.000 đ' },
                  { day: 'CN', val: 120, amt: '1.650.000 đ' },
                ].map((bar, idx) => (
                  <div key={bar.day} className="flex flex-col items-center gap-2 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {bar.amt}
                    </div>
                    <div
                      className={`w-9 rounded-xl transition-all ${
                        idx === 6
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-200 hover:bg-emerald-300'
                      }`}
                      style={{ height: `${(bar.val / 130) * 180}px` }}
                    ></div>
                    <span className="text-xs font-bold text-slate-500">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: FEFO Radar Table (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-bold text-slate-900">Radar Hạn Dùng (FEFO)</h2>
                </div>
                <Link href="/admin/inventory-fefo" className="text-xs font-bold text-emerald-600 hover:underline">
                  Xem tất cả &rarr;
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                Các lô hàng cần ưu tiên xuất kho hoặc kích hoạt Flash Sale để tránh hao hụt.
              </p>

              <div className="space-y-3 mt-4">
                {fefoAlerts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Không có lô hàng nào cận hạn nguy cấp.
                  </div>
                ) : (
                  fefoAlerts.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 font-mono">{batch.batchCode}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Nutri {batch.nutriScore || 'A'}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 line-clamp-1">{batch.productName}</div>
                        <div className="text-[11px] text-slate-400">
                          Tồn: {batch.quantityOnHand} gói • {batch.warehouse}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            batch.status === 'critical'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                              : batch.status === 'warning'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {batch.daysLeft} ngày
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Hạn dùng</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. Recent Orders Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Đơn Hàng Gần Đây</h2>
                <p className="text-xs text-slate-500">Cập nhật đơn hàng thời gian thực từ CSDL</p>
              </div>
              <Link
                href="/admin/orders"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <span>Quản Lý Đơn Hàng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Số Lượng Món</th>
                    <th className="py-3 px-4">Tổng Tiền</th>
                    <th className="py-3 px-4">Thanh Toán</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Ngày Đặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có đơn hàng nào trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.orderCode}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{order.customerName}</td>
                        <td className="py-3 px-4 text-slate-600">{order.itemsCount} sản phẩm</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              order.status === 'completed' || order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'shipping'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {(order.status === 'completed' || order.status === 'delivered') && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {order.status === 'shipping' && <Truck className="w-3 h-3 text-emerald-600" />}
                            {order.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                            {order.status === 'completed' || order.status === 'delivered'
                              ? 'Hoàn Tất'
                              : order.status === 'shipping'
                              ? 'Đang Giao'
                              : order.status === 'pending'
                              ? 'Chờ Xử Lý'
                              : order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
