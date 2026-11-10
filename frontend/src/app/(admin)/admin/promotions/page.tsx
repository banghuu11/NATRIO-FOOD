'use client';

import React, { useState, useEffect } from 'react';
import {
  TicketPercent,
  Zap,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Loader2,
  X,
  Check,
  Percent,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  promotionService,
  CouponItem,
  CreateCouponPayload,
  FlashSaleAdminItem,
} from '@/services/promotion.service';
import { productService, ProductItem } from '@/services/product.service';

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'coupons' | 'flash_sales'>('coupons');
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSaleAdminItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
  const [isEditCouponOpen, setIsEditCouponOpen] = useState(false);
  const [isDeleteCouponOpen, setIsDeleteCouponOpen] = useState(false);
  const [isCreateFlashSaleOpen, setIsCreateFlashSaleOpen] = useState(false);

  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [couponForm, setCouponForm] = useState<CreateCouponPayload>({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 15,
    minOrderAmount: 200000,
    maxDiscountAmount: 50000,
    usageLimit: 100,
    firstOrderOnly: false,
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [flashSaleForm, setFlashSaleForm] = useState<{
    name: string;
    startsAt: string;
    endsAt: string;
    variantId: number;
    salePrice: number;
    quantityLimit: number;
  }>({
    name: 'Flash Sale Giờ Vàng Sức Khỏe',
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    variantId: 1,
    salePrice: 99000,
    quantityLimit: 50,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [couponsRes, flashSalesRes, prodsRes] = await Promise.all([
        promotionService.getAdminCoupons(),
        promotionService.getAdminFlashSales(),
        productService.getProducts({ limit: 50 }),
      ]);
      setCoupons(couponsRes || []);
      setFlashSales(flashSalesRes || []);
      setProducts(prodsRes.data || []);

      if (prodsRes.data?.[0]?.defaultVariant?.id) {
        setFlashSaleForm((prev) => ({
          ...prev,
          variantId: prodsRes.data[0].defaultVariant!.id,
          salePrice: Math.round((prodsRes.data[0].defaultVariant!.price * 0.8) / 1000) * 1000,
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải khuyến mãi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    setSubmitting(true);
    try {
      await promotionService.createCoupon(couponForm);
      showToast(`Đã tạo mã khuyến mãi ${couponForm.code.toUpperCase()} thành công!`);
      setIsCreateCouponOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Lỗi tạo mã giảm giá:', err);
      alert(err.response?.data?.message || 'Không thể tạo mã giảm giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoupon) return;
    setSubmitting(true);
    try {
      await promotionService.updateCoupon(selectedCoupon.id, couponForm);
      showToast(`Đã cập nhật mã giảm giá ${selectedCoupon.code} thành công!`);
      setIsEditCouponOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Lỗi cập nhật mã giảm giá:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật mã.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCouponConfirm = async () => {
    if (!selectedCoupon) return;
    setSubmitting(true);
    try {
      await promotionService.deleteCoupon(selectedCoupon.id);
      showToast(`Đã xóa mã giảm giá ${selectedCoupon.code} khỏi hệ thống!`);
      setIsDeleteCouponOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Lỗi xóa mã giảm giá:', err);
      alert(err.response?.data?.message || 'Không thể xóa mã giảm giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFlashSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await promotionService.createFlashSale({
        name: flashSaleForm.name,
        startsAt: new Date(flashSaleForm.startsAt).toISOString(),
        endsAt: new Date(flashSaleForm.endsAt).toISOString(),
        items: [
          {
            variantId: flashSaleForm.variantId,
            salePrice: flashSaleForm.salePrice,
            quantityLimit: flashSaleForm.quantityLimit,
          },
        ],
      });
      showToast(`Đã tạo chiến dịch Flash Sale: ${flashSaleForm.name}!`);
      setIsCreateFlashSaleOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Lỗi tạo Flash Sale:', err);
      alert(err.response?.data?.message || 'Không thể tạo Flash Sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFlashSale = async (id: number, currentStatus: boolean) => {
    try {
      await promotionService.toggleFlashSale(id, !currentStatus);
      showToast(`Đã ${!currentStatus ? 'bật' : 'tắt'} chiến dịch Flash Sale!`);
      loadData();
    } catch (err) {
      console.error('Lỗi đổi trạng thái Flash Sale:', err);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

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
            Quản Lý Khuyến Mãi & Flash Sale
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập mã giảm giá Voucher, chương trình Flash Sale giờ vàng và Combo tiết kiệm kết nối trực tiếp CSDL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'coupons' ? (
            <button
              type="button"
              onClick={() => {
                setCouponForm({
                  code: '',
                  description: '',
                  discountType: 'percent',
                  discountValue: 15,
                  minOrderAmount: 200000,
                  maxDiscountAmount: 50000,
                  usageLimit: 100,
                  firstOrderOnly: false,
                  endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });
                setIsCreateCouponOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Mã Voucher Mới</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateFlashSaleOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>+ Tạo Chiến Dịch Flash Sale</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'coupons'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TicketPercent className="w-4 h-4" />
          <span>Mã Giảm Giá Voucher ({coupons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flash_sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'flash_sales'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Chiến Dịch Flash Sale ({flashSales.length})</span>
        </button>
      </div>

      {/* 3. Tab 1: Coupons Table */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã voucher, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              Hiện có <strong className="text-slate-900">{filteredCoupons.length}</strong> mã trong hệ thống
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Đang tải mã giảm giá từ CSDL...</span>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Chưa có mã giảm giá nào. Hãy bấm "+ Tạo Mã Voucher Mới".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Mã Voucher</th>
                      <th className="py-3.5 px-4">Mô Tả & Loại Giảm</th>
                      <th className="py-3.5 px-4">Giá Trị Giảm</th>
                      <th className="py-3.5 px-4">Đơn Tối Thiểu</th>
                      <th className="py-3.5 px-4">Giới Hạn / Đã Dùng</th>
                      <th className="py-3.5 px-4">Hạn Sử Dụng</th>
                      <th className="py-3.5 px-4">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black font-mono border border-emerald-200 text-xs tracking-wide">
                            {coupon.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{coupon.description || 'Giảm giá mua sắm'}</div>
                          <div className="text-[11px] text-slate-400 capitalize">
                            Loại: {coupon.discountType === 'percent' ? 'Phần trăm (%)' : coupon.discountType === 'fixed_amount' ? 'Số tiền cố định' : 'Miễn phí vận chuyển'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {coupon.discountType === 'percent'
                            ? `${coupon.discountValue}%`
                            : coupon.discountType === 'free_shipping'
                            ? 'Freeship 100%'
                            : `${coupon.discountValue.toLocaleString('vi-VN')} đ`}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {coupon.minOrderAmount ? `${coupon.minOrderAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{coupon.usedCount}</span>
                          <span className="text-slate-400"> / {coupon.usageLimit ? coupon.usageLimit : '∞'} lượt</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              coupon.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {coupon.isActive ? 'Đang bật' : 'Đã tắt'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Chỉnh sửa mã"
                              onClick={() => {
                                setSelectedCoupon(coupon);
                                setCouponForm({
                                  code: coupon.code,
                                  description: coupon.description || '',
                                  discountType: coupon.discountType,
                                  discountValue: coupon.discountValue,
                                  minOrderAmount: coupon.minOrderAmount,
                                  maxDiscountAmount: coupon.maxDiscountAmount || undefined,
                                  usageLimit: coupon.usageLimit || undefined,
                                  firstOrderOnly: coupon.firstOrderOnly,
                                  endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString().split('T')[0] : '',
                                });
                                setIsEditCouponOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Xóa mã giảm giá"
                              onClick={() => {
                                setSelectedCoupon(coupon);
                                setIsDeleteCouponOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Tab 2: Flash Sales Cards */}
      {activeTab === 'flash_sales' && (
        <div className="space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-500">Đang tải danh sách Flash Sale...</span>
            </div>
          ) : flashSales.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Zap className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Chưa có chiến dịch Flash Sale nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tạo chiến dịch Flash Sale để xả các lô hàng cận date (FEFO) hoặc đẩy mạnh doanh số các mặt hàng healthy hot.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateFlashSaleOpen(true)}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Flash Sale Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {flashSales.map((fs) => (
                <div
                  key={fs.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-amber-300 transition"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{fs.name}</h3>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(fs.startsAt).toLocaleDateString('vi-VN')} -{' '}
                            {new Date(fs.endsAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFlashSale(fs.id, fs.isActive)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                        fs.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {fs.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      <span>{fs.isActive ? 'Đang Chạy' : 'Tạm Dừng'}</span>
                    </button>
                  </div>

                  {/* Flash Sale Items */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">Sản phẩm tham gia:</span>
                    {fs.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs line-clamp-1">{item.productName}</div>
                            <div className="text-[11px] text-slate-400">{item.variantName}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-rose-600 text-xs">
                            {item.salePrice.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-slate-400 line-through">
                            {item.originalPrice.toLocaleString('vi-VN')} đ
                          </div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                            -{item.discountPercent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL 1: TẠO MÃ GIẢM GIÁ ================= */}
      {isCreateCouponOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TicketPercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tạo Mã Khuyến Mãi Mới</h3>
                  <p className="text-xs text-slate-500">Lưu trực tiếp vào bảng coupons trong CSDL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCouponOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã Voucher *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: HEALTHY2026"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Loại Giảm Giá *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e: any) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="percent">Giảm theo % (Phần trăm)</option>
                    <option value="fixed_amount">Giảm tiền cố định (VND)</option>
                    <option value="free_shipping">Miễn phí vận chuyển (Freeship)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả hiển thị</label>
                <input
                  type="text"
                  placeholder="VD: Giảm 15% cho đơn hàng ngũ cốc từ 200.000đ"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Giá trị giảm *</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Giảm tối đa (đ)</label>
                  <input
                    type="number"
                    value={couponForm.maxDiscountAmount || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số lượt dùng tối đa</label>
                  <input
                    type="number"
                    placeholder="Bỏ trống nếu không giới hạn"
                    value={couponForm.usageLimit || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={couponForm.endsAt}
                    onChange={(e) => setCouponForm({ ...couponForm, endsAt: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCouponOpen(false)}
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
                  <span>Lưu Mã Vào CSDL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SỬA MÃ GIẢM GIÁ ================= */}
      {isEditCouponOpen && selectedCoupon && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Sửa Mã Voucher {selectedCoupon.code}</h3>
                <p className="text-xs text-slate-500">Cập nhật thông tin voucher</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCouponOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCouponSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả hiển thị</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Giá trị giảm</label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ngày hết hạn</label>
                <input
                  type="date"
                  value={couponForm.endsAt}
                  onChange={(e) => setCouponForm({ ...couponForm, endsAt: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCouponOpen(false)}
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
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: XÓA VOUCHER ================= */}
      {isDeleteCouponOpen && selectedCoupon && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Xóa Mã Giảm Giá?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mã voucher <strong>{selectedCoupon.code}</strong> sẽ bị xóa vĩnh viễn khỏi CSDL.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteCouponOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteCouponConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: TẠO FLASH SALE ================= */}
      {isCreateFlashSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tạo Chiến Dịch Flash Sale Mới</h3>
                  <p className="text-xs text-slate-500">Giảm giá chớp nhoáng kích cầu & xả kho FEFO</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateFlashSaleOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFlashSaleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Chiến Dịch *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giờ Vàng Eat Clean Cuối Tuần"
                  value={flashSaleForm.name}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bắt đầu từ *</label>
                  <input
                    type="date"
                    required
                    value={flashSaleForm.startsAt}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, startsAt: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kết thúc lúc *</label>
                  <input
                    type="date"
                    required
                    value={flashSaleForm.endsAt}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endsAt: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/50 space-y-3">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sản Phẩm Flash Sale</span>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Chọn sản phẩm</label>
                  <select
                    value={flashSaleForm.variantId}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, variantId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {products.map((p) =>
                      p.defaultVariant ? (
                        <option key={p.defaultVariant.id} value={p.defaultVariant.id}>
                          {p.name} - Giá gốc: {p.defaultVariant.price.toLocaleString('vi-VN')} đ
                        </option>
                      ) : null,
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">Giá Flash Sale (VND) *</label>
                    <input
                      type="number"
                      required
                      value={flashSaleForm.salePrice}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, salePrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">Số lượng giới hạn (Gói) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={flashSaleForm.quantityLimit}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, quantityLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateFlashSaleOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-600/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Kích Hoạt Flash Sale</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

