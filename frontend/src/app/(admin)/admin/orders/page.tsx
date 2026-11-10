'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  X,
  Check,
  PackageCheck,
  Send,
  Calendar,
} from 'lucide-react';
import { orderService, AdminOrderListItem } from '@/services/order.service';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShipmentOpen, setIsShipmentOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);

  const [newStatus, setNewStatus] = useState('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [carrier, setCarrier] = useState('GHN (Giao Hàng Nhanh)');
  const [trackingCode, setTrackingCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAdminOrders({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined,
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, searchTerm]);

  // Handle Update Status
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await orderService.updateOrderStatus(selectedOrder.id, newStatus, statusNote);
      showToast(`Đã chuyển trạng thái đơn #${selectedOrder.orderNumber} sang: ${newStatus}`);
      setIsStatusUpdateOpen(false);
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Shipment
  const handleCreateShipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const tracking = trackingCode.trim() || `TRK-${Date.now().toString().slice(-8)}`;
    setSubmitting(true);
    try {
      await orderService.createShipment(selectedOrder.id, {
        carrier,
        trackingCode: tracking,
      });
      showToast(`Đã tạo vận đơn giao hàng ${carrier} (${tracking}) thành công!`);
      setIsShipmentOpen(false);
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi tạo vận đơn:', err);
      alert(err.response?.data?.message || 'Không thể tạo vận đơn.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    pending: { label: 'Chờ xác nhận', bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-800', icon: Clock },
    confirmed: { label: 'Đã xác nhận', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2 },
    processing: { label: 'Đang đóng gói', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800', icon: PackageCheck },
    shipping: { label: 'Đang giao hàng', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800', icon: Truck },
    delivered: { label: 'Đã giao thành công', bg: 'bg-emerald-100 border border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2 },
    completed: { label: 'Hoàn tất', bg: 'bg-emerald-100 border border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy', bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-700', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Check className="w-5 h-5 bg-white/20 p-1 rounded-full" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Đơn Hàng & Vận Chuyển
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi quy trình tiếp nhận, đóng gói, điều phối kho FEFO và giao hàng cho khách trực tiếp từ CSDL.
          </p>
        </div>
      </div>

      {/* 2. Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { key: 'all', label: 'Tất cả đơn' },
          { key: 'pending', label: 'Chờ xác nhận' },
          { key: 'confirmed', label: 'Đã xác nhận' },
          { key: 'processing', label: 'Đang xử lý / Đóng gói' },
          { key: 'shipping', label: 'Đang giao hàng' },
          { key: 'delivered', label: 'Hoàn tất' },
          { key: 'cancelled', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedStatus === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        <div className="text-xs text-slate-400 font-semibold">
          Tổng cộng: <strong className="text-slate-900">{orders.length}</strong> đơn hàng
        </div>
      </div>

      {/* 4. Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Đang tải danh sách đơn hàng từ CSDL...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Không tìm thấy đơn hàng nào phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn & Ngày</th>
                  <th className="py-3.5 px-4">Khách Hàng & SĐT</th>
                  <th className="py-3.5 px-4">Sản Phẩm Đặt Mua</th>
                  <th className="py-3.5 px-4">Tổng Tiền</th>
                  <th className="py-3.5 px-4">Thanh Toán</th>
                  <th className="py-3.5 px-4">Trạng Thái Đơn</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((order) => {
                  const st = statusMap[order.status] || {
                    label: order.status,
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    icon: Clock,
                  };
                  const StatusIcon = st.icon;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      {/* Order Code & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.placedAt).toLocaleString('vi-VN')}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.recipient?.name || order.customer?.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.recipient?.phone || order.customer?.phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 line-clamp-1 font-semibold">{order.itemsSummary}</div>
                        <div className="text-[11px] text-slate-400">{order.itemsCount} sản phẩm</div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900">{order.totalAmount.toLocaleString('vi-VN')} đ</div>
                        {order.shippingFee > 0 && (
                          <div className="text-[10px] text-slate-400">
                            (Ship: {order.shippingFee.toLocaleString('vi-VN')} đ)
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                          {order.paymentMethod}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          {order.paymentStatus === 'paid' ? '● Đã thanh toán' : '○ Chờ thanh toán'}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{st.label}</span>
                        </span>
                        {order.carrier && (
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-sky-600" />
                            <span>{order.carrier}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Xem chi tiết đơn hàng"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="Đổi trạng thái đơn"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setIsStatusUpdateOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="Tạo vận đơn giao hàng"
                            onClick={() => {
                              setSelectedOrder(order);
                              setTrackingCode(`TRK-${Date.now().toString().slice(-8)}`);
                              setIsShipmentOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: CHI TIẾT ĐƠN HÀNG ================= */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">CHI TIẾT ĐƠN HÀNG</span>
                <h3 className="text-lg font-black text-slate-900">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-800">Thông Tin Người Nhận</div>
                <div className="text-slate-700">Họ tên: {selectedOrder.recipient?.name}</div>
                <div className="text-slate-700">Điện thoại: {selectedOrder.recipient?.phone}</div>
                <div className="text-slate-700 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedOrder.recipient?.address}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="font-bold text-slate-800">Sản Phẩm Đã Đặt:</div>
                <div className="text-slate-700 font-semibold">{selectedOrder.itemsSummary}</div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/50 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Tiền hàng:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.subtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Phí giao hàng:</span>
                  <span className="font-bold text-slate-900">
                    {selectedOrder.shippingFee === 0 ? 'Miễn phí' : `${selectedOrder.shippingFee.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-emerald-200/50">
                  <span className="font-black text-slate-900">Tổng thanh toán:</span>
                  <span className="font-black text-emerald-700">
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CẬP NHẬT TRẠNG THÁI ================= */}
      {isStatusUpdateOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Cập Nhật Trạng Thái Đơn</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusUpdateOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái mới *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value="pending">Chờ xác nhận (Pending)</option>
                  <option value="confirmed">Đã xác nhận đơn (Confirmed)</option>
                  <option value="processing">Đang đóng gói hàng (Processing)</option>
                  <option value="shipping">Đang giao hàng (Shipping)</option>
                  <option value="delivered">Đã giao thành công (Delivered)</option>
                  <option value="completed">Hoàn tất (Completed)</option>
                  <option value="cancelled">Hủy đơn hàng (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú trạng thái</label>
                <input
                  type="text"
                  placeholder="VD: Khách đã xác nhận qua điện thoại, chuẩn bị đóng hàng..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusUpdateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Cập Nhật Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: TẠO VẬN ĐƠN GIAO HÀNG ================= */}
      {isShipmentOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tạo Vận Đơn Giao Hàng</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShipmentOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipmentSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Đơn vị vận chuyển *</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value="GHN (Giao Hàng Nhanh)">GHN (Giao Hàng Nhanh)</option>
                  <option value="Ahamove 2H">Ahamove 2H (Giao nhanh nội thành)</option>
                  <option value="ViettelPost">ViettelPost</option>
                  <option value="GrabExpress">GrabExpress</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã Vận Đơn Tracking Code *</label>
                <input
                  type="text"
                  required
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1 border border-slate-200">
                <span className="font-bold block text-slate-800">Địa chỉ nhận hàng:</span>
                <div>{selectedOrder.recipient?.address}</div>
                <div className="font-semibold text-slate-900 mt-1">
                  Người nhận: {selectedOrder.recipient?.name} ({selectedOrder.recipient?.phone})
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShipmentOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Bàn Giao Vận Chuyển</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
