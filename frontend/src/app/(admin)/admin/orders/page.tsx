'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  Filter,
  ArrowRight,
  Phone,
  MapPin,
} from 'lucide-react';

const mockAdminOrders = [
  {
    id: 1,
    orderNumber: 'NT261005000001',
    customerName: 'Nguyễn Thị Lan',
    phone: '0900000002',
    address: '12 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
    items: [
      { name: 'Yến Mạch Cán Dẹt (Túi 500g)', qty: 1, price: 89000 },
      { name: 'Hạnh Nhân Rang Mộc (Hũ 250g)', qty: 1, price: 129000 },
    ],
    totalAmount: 218000,
    shippingFee: 0,
    paymentMethod: 'COD',
    paymentStatus: 'paid',
    status: 'completed',
    carrier: 'GHN (Giao Hàng Nhanh)',
    placedAt: '2026-10-02 14:30',
  },
  {
    id: 2,
    orderNumber: 'NT261005000002',
    customerName: 'Trần Quang Minh',
    phone: '0900000003',
    address: '45 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM',
    items: [
      { name: 'Combo Ăn Sáng Eat Clean 7 Ngày', qty: 1, price: 319000 },
    ],
    totalAmount: 319000,
    shippingFee: 0,
    paymentMethod: 'VNPay',
    paymentStatus: 'paid',
    status: 'shipping',
    carrier: 'Ahamove 2H',
    placedAt: '2026-10-05 09:15',
  },
  {
    id: 3,
    orderNumber: 'NT261005000003',
    customerName: 'Phạm Hồng Nhung',
    phone: '0988776655',
    address: '280 Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM',
    items: [
      { name: 'Sữa Óc Chó Không Đường 1L', qty: 2, price: 79000 },
      { name: 'Granola Không Đường 400g', qty: 1, price: 159000 },
    ],
    totalAmount: 317000,
    shippingFee: 25000,
    paymentMethod: 'MoMo',
    paymentStatus: 'pending',
    status: 'pending',
    carrier: 'Ahamove 2H',
    placedAt: '2026-10-05 11:20',
  },
];

export default function AdminOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filtered = mockAdminOrders.filter((order) => {
    if (selectedStatus === 'all') return true;
    return order.status === selectedStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Đơn Hàng & Vận Chuyển
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi quy trình tiếp nhận, đóng gói, phân bổ kho FEFO và giao hàng cho khách.
          </p>
        </div>
      </div>

      {/* 2. Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { key: 'all', label: 'Tất cả đơn', count: 3 },
          { key: 'pending', label: 'Chờ xác nhận', count: 1 },
          { key: 'shipping', label: 'Đang giao hàng', count: 1 },
          { key: 'completed', label: 'Đã hoàn tất', count: 1 },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              selectedStatus === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                selectedStatus === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn & Ngày Đặt</th>
                <th className="py-3.5 px-4">Khách Hàng & Địa Chỉ</th>
                <th className="py-3.5 px-4">Sản Phẩm Đặt</th>
                <th className="py-3.5 px-4">Tổng Tiền & Thanh Toán</th>
                <th className="py-3.5 px-4">Đơn Vị Giao</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((order) => (
                <tr key={order.orderNumber} className="hover:bg-slate-50/80 transition">
                  {/* Order ID & Placed Time */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">{order.placedAt}</div>
                  </td>

                  {/* Customer Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{order.customerName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{order.phone}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{order.address}</div>
                  </td>

                  {/* Items */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-slate-700">
                          <span className="font-bold text-emerald-700">{item.qty}x</span> {item.name}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Total & Payment */}
                  <td className="py-3.5 px-4">
                    <div className="font-black text-slate-900 text-sm">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] text-slate-500">
                      PT: <strong className="uppercase">{order.paymentMethod}</strong> •{' '}
                      <span className={order.paymentStatus === 'paid' ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                  </td>

                  {/* Carrier */}
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{order.carrier}</td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'shipping'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {order.status === 'shipping' && <Truck className="w-3.5 h-3.5 text-blue-600" />}
                      {order.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {order.status === 'completed'
                        ? 'Hoàn Tất'
                        : order.status === 'shipping'
                        ? 'Đang Giao'
                        : 'Chờ Xác Nhận'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <span>Xử Lý</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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
