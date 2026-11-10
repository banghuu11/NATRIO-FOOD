'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Loader2,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { dashboardService, AnalyticsData } from '@/services/dashboard.service';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await dashboardService.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Lỗi khi tải báo cáo phân tích:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const paymentMethodLabels: Record<string, { name: string; color: string }> = {
    cod: { name: 'Thanh Toán Khi Nhận (COD)', color: 'bg-emerald-600' },
    vnpay: { name: 'Ví VNPAY / Thẻ Ngân Hàng', color: 'bg-emerald-500' },
    momo: { name: 'Ví Điện Tử MoMo', color: 'bg-emerald-400' },
    bank_transfer: { name: 'Chuyển Khoản Trực Tiếp', color: 'bg-slate-400' },
  };

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    completed: { label: 'Hoàn tất', color: 'bg-emerald-500', icon: CheckCircle2 },
    delivered: { label: 'Đã giao thành công', color: 'bg-emerald-500', icon: CheckCircle2 },
    shipping: { label: 'Đang vận chuyển', color: 'bg-emerald-600', icon: Truck },
    processing: { label: 'Đang đóng gói', color: 'bg-emerald-400', icon: Clock },
    pending: { label: 'Chờ duyệt', color: 'bg-amber-500', icon: Clock },
    cancelled: { label: 'Đã hủy', color: 'bg-rose-500', icon: XCircle },
  };

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>TRUNG TÂM PHÂN TÍCH DOANH THU & KINH DOANH THỜI GIAN THỰC</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Báo Cáo Doanh Thu & Hiệu Quả Kinh Doanh
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Số liệu thống kê tự động từ CSDL: Doanh thu thực nhận, cơ cấu thanh toán, sản phẩm bán chạy và hiệu suất đơn hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-slate-900/20"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Xem Đơn Hàng</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Đang tổng hợp dữ liệu báo cáo từ CSDL...</span>
        </div>
      ) : data ? (
        <>
          {/* 2. Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Doanh thu thực nhận */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {data.summary.totalRevenue.toLocaleString('vi-VN')} đ
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Từ {data.summary.totalOrders} đơn hàng ghi nhận</span>
                </div>
              </div>
            </div>

            {/* Card 2: Giá trị đơn trung bình (AOV) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đơn Trung Bình (AOV)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {data.summary.averageOrderValue.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  Chi tiêu trung bình mỗi giỏ hàng
                </div>
              </div>
            </div>

            {/* Card 3: Khuyến mãi đã tài trợ */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Voucher Đã Giảm</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {data.summary.totalDiscountGiven.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-xs font-bold text-amber-700 mt-1">
                  Tài trợ từ ngân sách khuyến mãi
                </div>
              </div>
            </div>

            {/* Card 4: Tổng khách & Sản phẩm */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quy Mô Sản Phẩm</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">{data.summary.totalProducts} Sản Phẩm</div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  Phục vụ {data.summary.totalCustomers} khách hàng
                </div>
              </div>
            </div>
          </div>

          {/* 3. Deep Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Top Selling Products (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Top Sản Phẩm Dinh Dưỡng Bán Chạy</h2>
                  <p className="text-xs text-slate-500">Xếp hạng theo số lượng xuất bán và đóng góp doanh thu</p>
                </div>
              </div>

              {data.topSellingProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Chưa có sản phẩm nào phát sinh đơn hàng hoàn tất.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {data.topSellingProducts.map((prod, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            index === 0
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{prod.name}</div>
                          <div className="text-[11px] text-slate-400">Đã bán: {prod.quantity} gói</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-slate-900 text-xs">
                          {prod.revenue.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Doanh thu</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Payment Method Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Cơ Cấu Phương Thức Thanh Toán</h2>
                <p className="text-xs text-slate-500">Tỷ lệ khách chọn COD, VNPay, MoMo và Chuyển khoản</p>
              </div>

              <div className="space-y-3">
                {Object.entries(data.paymentMethodDistribution).map(([pmKey, pmData]) => {
                  const meta = paymentMethodLabels[pmKey] || {
                    name: pmKey.toUpperCase(),
                    color: 'bg-slate-400',
                  };
                  const percent =
                    data.summary.totalRevenue > 0
                      ? Math.round((pmData.total / data.summary.totalRevenue) * 100)
                      : 0;

                  return (
                    <div key={pmKey} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{meta.name}</span>
                        <span className="font-black text-slate-900">{pmData.total.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 ${meta.color} rounded-full`} style={{ width: `${percent}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{pmData.count} giao dịch</span>
                        <span>{percent}% tổng doanh thu</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Order Status Breakdown Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hiệu Suất & Tiến Độ Vận Hành Đơn Hàng</h2>
                <p className="text-xs text-slate-500">Phân loại đơn hàng theo trạng thái xử lý</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(data.statusDistribution).map(([stKey, count]) => {
                const meta = statusLabels[stKey] || {
                  label: stKey,
                  color: 'bg-slate-500',
                  icon: Clock,
                };
                const StatusIcon = meta.icon;

                return (
                  <div key={stKey} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <StatusIcon className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                    <div className="text-xl font-black text-slate-900">{count}</div>
                    <div className="text-[11px] text-slate-500 font-semibold">{meta.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

