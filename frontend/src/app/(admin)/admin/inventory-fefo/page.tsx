'use client';

import React from 'react';
import {
  CalendarClock,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Warehouse,
  Plus,
  ArrowDownRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

const mockBatchesFull = [
  {
    batchCode: 'LOT-GRA-2601-OLD',
    qrCode: 'NUTRIO-OLD-GRA400',
    productName: 'Granola Không Đường (Túi 400g)',
    farmName: 'Nông Trại Đà Lạt Xanh',
    receivedDate: '2026-01-10',
    expiryDate: '2026-10-17',
    daysLeft: 12,
    quantityOnHand: 20,
    quantityReserved: 5,
    unitCost: 105000,
    warehouse: 'HCM-01 (Thường)',
    isCold: false,
    status: 'critical', // < 15 days
  },
  {
    batchCode: 'LOT-CHK-2602',
    qrCode: 'NUTRIO-CHK-200',
    productName: 'Ức Gà Áp Chảo Sốt Tiêu (Hộp 200g)',
    farmName: 'Nông Trại Đà Lạt Xanh',
    receivedDate: '2026-10-01',
    expiryDate: '2026-10-10',
    daysLeft: 5,
    quantityOnHand: 45,
    quantityReserved: 0,
    unitCost: 40000,
    warehouse: 'HCM-COLD (Kho Lạnh)',
    isCold: true,
    status: 'critical',
  },
  {
    batchCode: 'LOT-ALM-2603',
    qrCode: 'NUTRIO-ALM-250',
    productName: 'Hạnh Nhân Rang Mộc (Hũ 250g)',
    farmName: 'Nông Trại Đà Lạt Xanh',
    receivedDate: '2026-02-15',
    expiryDate: '2026-10-29',
    daysLeft: 24,
    quantityOnHand: 70,
    quantityReserved: 12,
    unitCost: 90000,
    warehouse: 'HCM-01 (Thường)',
    isCold: false,
    status: 'warning',
  },
  {
    batchCode: 'LOT-OAT-2604',
    qrCode: 'NUTRIO-OAT-500',
    productName: 'Yến Mạch Cán Dẹt Organic (Túi 500g)',
    farmName: 'Trang Trại Yến Mạch Mộc Châu',
    receivedDate: '2026-03-01',
    expiryDate: '2027-04-01',
    daysLeft: 180,
    quantityOnHand: 350,
    quantityReserved: 15,
    unitCost: 60000,
    warehouse: 'HCM-01 (Thường)',
    isCold: false,
    status: 'good',
  },
];

export default function AdminFefoInventoryPage() {
  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold mb-2">
            <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
            <span>QUẢN LÝ TỒN KHO THÔNG MINH THEO HẠN DÙNG (FEFO)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Radar Lô Hàng & Hạn Sử Dụng FEFO
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nguyên tắc <strong>First-Expired, First-Out</strong>: Tự động trừ kho từ lô hết hạn sớm nhất khi khách đặt hàng.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Nhập Lô Hàng Mới</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Cận Date Nguy Cấp (&lt; 15 Ngày)</span>
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-900">2 Lô Hàng</div>
          <div className="text-xs text-rose-700 font-medium mt-1">Khuyến nghị: Kích hoạt Flash Sale 20%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Cần Chú Ý (15 - 30 Ngày)</span>
            <CalendarClock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">1 Lô Hàng</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Ưu tiên xuất đơn hàng sỉ / combo</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Hạn Dùng Tươi Mới (&gt; 60 Ngày)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">18 Lô Hàng</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Đảm bảo tiêu chuẩn chất lượng cao</div>
        </div>
      </div>

      {/* 3. Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Danh Sách Lô Hàng Trong Kho</h2>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Lọc mã lô, sản phẩm..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Lô & QR Nguồn Gốc</th>
                <th className="py-3.5 px-4">Sản Phẩm</th>
                <th className="py-3.5 px-4">Kho Lưu Trữ</th>
                <th className="py-3.5 px-4">Ngày Hết Hạn (HSD)</th>
                <th className="py-3.5 px-4">Radar FEFO</th>
                <th className="py-3.5 px-4">Tồn Kho / Đã Giữ</th>
                <th className="py-3.5 px-4">Giá Vốn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {mockBatchesFull.map((batch) => (
                <tr key={batch.batchCode} className="hover:bg-slate-50/80 transition">
                  {/* Batch & QR */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900">{batch.batchCode}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{batch.qrCode}</div>
                      </div>
                    </div>
                  </td>

                  {/* Product & Farm */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{batch.productName}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold">{batch.farmName}</div>
                  </td>

                  {/* Warehouse & Cold Storage */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {batch.isCold ? (
                        <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
                      ) : (
                        <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className="font-semibold text-slate-700">{batch.warehouse}</span>
                    </div>
                  </td>

                  {/* Expiry Date */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{batch.expiryDate}</td>

                  {/* FEFO Radar Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        batch.status === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          : batch.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {batch.daysLeft} ngày nữa
                    </span>
                  </td>

                  {/* Stock Availability */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {batch.quantityOnHand - batch.quantityReserved} <span className="text-[11px] text-slate-400 font-normal">khả dụng</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Tổng: {batch.quantityOnHand} | Giữ: {batch.quantityReserved}
                    </div>
                  </td>

                  {/* Unit Cost */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                    {batch.unitCost.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
