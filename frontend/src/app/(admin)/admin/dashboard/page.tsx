'use client';

import React from 'react';
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
} from 'lucide-react';

const mockFefoBatches = [
  {
    batchCode: 'LOT-GRA-2601-OLD',
    productName: 'Granola Không Đường (Túi 400g)',
    daysLeft: 12,
    status: 'critical', // < 15 days
    quantityOnHand: 20,
    nutriScore: 'A',
    warehouse: 'HCM-01',
  },
  {
    batchCode: 'LOT-CHK-2602',
    productName: 'Ức Gà Áp Chảo Sốt Tiêu (Hộp 200g)',
    daysLeft: 5,
    status: 'critical', // < 7 days fresh food
    quantityOnHand: 45,
    nutriScore: 'A',
    warehouse: 'HCM-COLD',
  },
  {
    batchCode: 'LOT-ALM-2603',
    productName: 'Hạnh Nhân Rang Mộc (Hũ 250g)',
    daysLeft: 24,
    status: 'warning', // < 30 days
    quantityOnHand: 70,
    nutriScore: 'B',
    warehouse: 'HCM-01',
  },
  {
    batchCode: 'LOT-OAT-2604',
    productName: 'Yến Mạch Cán Dẹt (Túi 500g)',
    daysLeft: 180,
    status: 'good',
    quantityOnHand: 350,
    nutriScore: 'A',
    warehouse: 'HCM-01',
  },
];

const mockRecentOrders = [
  {
    orderNumber: 'NT261005000001',
    customerName: 'Nguyễn Thị Lan',
    itemsSummary: 'Yến Mạch (500g) + Hạnh Nhân (250g)',
    totalAmount: '218.000 đ',
    status: 'completed',
    paymentMethod: 'COD',
    time: '10 phút trước',
  },
  {
    orderNumber: 'NT261005000002',
    customerName: 'Trần Quang Minh',
    itemsSummary: 'Combo Ăn Sáng Eat Clean 7 Ngày',
    totalAmount: '319.000 đ',
    status: 'shipping',
    paymentMethod: 'VNPay',
    time: '45 phút trước',
  },
  {
    orderNumber: 'NT261005000003',
    customerName: 'Lê Hoàng Nam',
    itemsSummary: 'Sữa Óc Chó 1L x 2',
    totalAmount: '158.000 đ',
    status: 'pending',
    paymentMethod: 'MoMo',
    time: '2 giờ trước',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Chào mừng trở lại, Quản Trị Viên! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Báo cáo tổng quan hoạt động kinh doanh, tồn kho theo phương pháp FEFO & điều phối đơn hàng hôm nay.
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
            <span>+ Thêm Sản Phẩm</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Doanh thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Hôm Nay</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">12.850.000 đ</div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.8%</span>
              <span className="text-slate-400 font-normal ml-1">so với tuần trước</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đơn hàng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đơn Hàng Chờ Xử Lý</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">24 Đơn</div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              <span className="font-bold text-blue-600">8 Đang giao</span> • 16 Đang đóng gói
            </div>
          </div>
        </div>

        {/* Card 3: Cảnh báo tồn kho */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cảnh Báo Tồn Kho Thấp</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">5 Mặt Hàng</div>
            <div className="text-xs font-bold text-rose-600 mt-1">
              Cần đặt nhà cung cấp sớm
            </div>
          </div>
        </div>

        {/* Card 4: FEFO Cận Date */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Lô Hàng Cận Hạn FEFO</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-900">2 Lô Hàng</div>
            <div className="text-xs font-bold text-amber-700 mt-1">
              &lt; 15 Ngày • Nên bật Flash Sale đẩy
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
              <h2 className="text-base font-bold text-slate-900">Biểu Đồ Doanh Thu & Đơn Hàng</h2>
              <p className="text-xs text-slate-500">Thống kê 7 ngày gần nhất theo thời gian thực</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                ● Doanh thu (VND)
              </span>
            </div>
          </div>

          {/* Simulated SVG Area Chart */}
          <div className="h-64 w-full relative flex items-end justify-between pt-8 pb-2 px-2">
            {[
              { day: 'T2', val: 45, amt: '4.5M' },
              { day: 'T3', val: 62, amt: '6.2M' },
              { day: 'T4', val: 58, amt: '5.8M' },
              { day: 'T5', val: 80, amt: '8.0M' },
              { day: 'T6', val: 72, amt: '7.2M' },
              { day: 'T7', val: 95, amt: '9.5M' },
              { day: 'CN', val: 128, amt: '12.8M' },
            ].map((bar, idx) => (
              <div key={bar.day} className="flex flex-col items-center gap-2 group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap">
                  {bar.amt}
                </div>
                {/* Bar */}
                <div
                  className={`w-9 rounded-xl transition-all ${
                    idx === 6
                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-100 hover:bg-emerald-200'
                  }`}
                  style={{ height: `${(bar.val / 140) * 180}px` }}
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
            Hệ thống tự động ưu tiên xuất các lô hàng sắp hết date trước để bảo đảm độ tươi mới.
          </p>

          <div className="space-y-3 mt-4">
            {mockFefoBatches.map((batch) => (
              <div
                key={batch.batchCode}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 font-mono">{batch.batchCode}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        batch.nutriScore === 'A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Nutri {batch.nutriScore}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-600 line-clamp-1">{batch.productName}</div>
                  <div className="text-[11px] text-slate-400">Tồn: {batch.quantityOnHand} gói • {batch.warehouse}</div>
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
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Đơn Hàng Gần Đây</h2>
            <p className="text-xs text-slate-500">Cập nhật đơn hàng mới nhất từ khách hàng</p>
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
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Thanh Toán</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {mockRecentOrders.map((order) => (
                <tr key={order.orderNumber} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{order.customerName}</td>
                  <td className="py-3 px-4 text-slate-600">{order.itemsSummary}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{order.totalAmount}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'shipping'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {order.status === 'shipping' && <Truck className="w-3 h-3 text-blue-600" />}
                      {order.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {order.status === 'completed'
                        ? 'Hoàn Tất'
                        : order.status === 'shipping'
                        ? 'Đang Giao'
                        : 'Chờ Xử Lý'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
