'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService, UserAddress } from '@/services/user.service';
import { orderService } from '@/services/order.service';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  Tag,
  Loader2,
  CheckCircle2,
  Flame,
  Leaf,
  Sparkles,
  MapPin,
  Check,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    items,
    clearCart,
    getTotalPrice,
    getTotalCalories,
    getTotalProtein,
    getTotalCarbs,
    getTotalFat,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Saved addresses and autofill state
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'custom' | null>(null);
  const [isAutofilled, setIsAutofilled] = useState(false);

  // Form State
  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    email: '',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '',
    note: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cod',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  useEffect(() => {
    setMounted(true);

    async function loadUserDataAndAddresses() {
      // 1. Tự động điền tức thì từ Zustand user profile nếu đã đăng nhập
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setForm((prev) => ({
          ...prev,
          recipientName: prev.recipientName || currentUser.fullName || '',
          phone: prev.phone || currentUser.phone || '',
          email: prev.email || currentUser.email || '',
        }));
        setIsAutofilled(true);
      }

      // 2. Tải sổ địa chỉ và profile mới nhất từ server
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      try {
        const [profile, addrs] = await Promise.all([
          userService.getMyProfile().catch(() => null),
          userService.getAddresses().catch(() => [] as UserAddress[]),
        ]);

        if (addrs && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a: UserAddress) => a.isDefault) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
          setForm((prev) => ({
            ...prev,
            recipientName: defaultAddr.recipientName || profile?.fullName || prev.recipientName,
            phone: defaultAddr.phone || profile?.phone || prev.phone,
            email: profile?.email || prev.email,
            province: defaultAddr.province || prev.province,
            district: defaultAddr.district || prev.district,
            ward: defaultAddr.ward || prev.ward,
            street: defaultAddr.street || prev.street,
            note: defaultAddr.note || prev.note,
          }));
          setIsAutofilled(true);
        } else if (profile) {
          setForm((prev) => ({
            ...prev,
            recipientName: profile.fullName || prev.recipientName,
            phone: profile.phone || prev.phone,
            email: profile.email || prev.email,
          }));
          setIsAutofilled(true);
        }
      } catch (err) {
        console.warn('Không thể tự động tải địa chỉ người dùng:', err);
      }
    }

    loadUserDataAndAddresses();
  }, []);

  const handleSelectAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      recipientName: addr.recipientName || prev.recipientName,
      phone: addr.phone || prev.phone,
      province: addr.province || 'TP. Hồ Chí Minh',
      district: addr.district || 'Quận 1',
      ward: addr.ward || 'Phường Bến Nghé',
      street: addr.street || '',
      note: addr.note || prev.note,
    }));
    toast.info(`Đã chọn địa chỉ: ${addr.label || addr.recipientName}`);
  };

  const subtotal = mounted ? getTotalPrice() : 0;
  const shippingFee = subtotal >= 300000 || subtotal === 0 ? 0 : 25000;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  const handleApplyCoupon = () => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    if (trimmed === 'NUTRIO2026' || trimmed === 'WELCOME10') {
      const discount = Math.round(subtotal * 0.1);
      setAppliedCoupon({ code: trimmed, discount });
      toast.success(`Đã áp dụng mã ${trimmed} (-10%)!`);
    } else if (trimmed === 'FREESHIP') {
      setAppliedCoupon({ code: trimmed, discount: 25000 });
      toast.success('Đã áp dụng mã Miễn phí vận chuyển!');
    } else {
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống');
      return;
    }

    if (!form.recipientName.trim()) {
      toast.error('Vui lòng nhập họ tên người nhận');
      return;
    }

    if (!form.phone.trim() || !/^[0-9]{9,11}$/.test(form.phone.trim())) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ (9-11 chữ số)');
      return;
    }

    if (!form.street.trim()) {
      toast.error('Vui lòng nhập địa chỉ cụ thể nhận hàng');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Tạo payload đặt hàng
      const orderPayload = {
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        province: form.province,
        district: form.district,
        ward: form.ward,
        street: form.street.trim(),
        note: form.note.trim() || undefined,
        paymentMethod: form.paymentMethod,
        couponCode: appliedCoupon?.code,
        items: items.map((item) => ({
          variantId: Number(item.product.id) || 1,
          quantity: item.quantity,
        })),
      };

      const response = await orderService.createOrder(orderPayload);
      const orderData = response.order;

      // 2. Xử lý theo phương thức thanh toán
      if (form.paymentMethod === 'bank_transfer') {
        toast.info('Đang chuyển đến cổng thanh toán VietQR SePay...', { duration: 3000 });

        // Lấy thông tin phiên SePay
        let sepayData = response.sepayCheckout;
        if (!sepayData) {
          sepayData = await orderService.createSepayCheckout(orderData.id);
        }

        if (sepayData && sepayData.checkoutUrl && sepayData.fields) {
          // Lưu trạng thái trước khi chuyển hướng
          clearCart();

          // Tạo form ẩn và submit tới SePay Checkout Gateway
          const checkoutForm = document.createElement('form');
          checkoutForm.method = 'POST';
          checkoutForm.action = sepayData.checkoutUrl;

          Object.entries(sepayData.fields || {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = name;
              input.value = String(value);
              checkoutForm.appendChild(input);
            }
          });

          document.body.appendChild(checkoutForm);
          checkoutForm.submit();
          return;
        } else {
          // Fallback nếu không mở được gateway SePay
          clearCart();
          router.push(`/checkout/success?orderCode=${orderData.orderNumber}&gateway=sepay`);
        }
      } else {
        // Thanh toán COD
        clearCart();
        toast.success('Đặt hàng thành công!');
        router.push(`/checkout/success?orderCode=${orderData.orderNumber}&paymentMethod=cod`);
      }
    } catch (error: any) {
      console.error('Lỗi khi đặt hàng:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#064e3b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-stone-800">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 mb-8">
          <Link href="/" className="hover:text-emerald-800 transition-colors">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/products" className="hover:text-emerald-800 transition-colors">
            Thực Đơn
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-semibold text-stone-800">Thanh Toán Đơn Hàng</span>
        </nav>

        {items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Giỏ hàng của bạn đang trống</h2>
            <p className="text-sm text-stone-500 mb-6">
              Hãy chọn cho mình các sản phẩm hạt dinh dưỡng sấy mộc hoặc bữa ăn healthy thanh lành nhé!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#064e3b] text-white font-medium text-sm hover:bg-[#053d2e] transition-all shadow-sm"
            >
              <span>Khám phá thực đơn</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* ============================================================== */}
            {/* CỘT TRÁI (7 CỘT): THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN */}
            {/* ============================================================== */}
            <div className="lg:col-span-7 space-y-8">
              {/* 1. THÔNG TIN KHÁCH HÀNG */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 pb-5 mb-5 border-b border-stone-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900">Thông Tin Nhận Hàng</h2>
                    <p className="text-xs text-stone-500">Địa chỉ giao hàng tươi sạch đến tận tay bạn</p>
                  </div>
                </div>

                {/* Banner tự động điền */}
                

                

                {/* Sổ địa chỉ đã lưu (nếu có) */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#064e3b]" />
                        Chọn nhanh từ sổ địa chỉ đã lưu ({savedAddresses.length}):
                      </span>
                      <Link
                        href="/profile"
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Quản lý địa chỉ →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                              isSelected
                                ? 'border-[#064e3b] bg-white ring-2 ring-[#064e3b]/20 shadow-xs'
                                : 'border-stone-200 hover:border-emerald-300 bg-white/60 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                                {addr.recipientName}
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                    Mặc định
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] font-mono text-stone-600 font-semibold">{addr.phone}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                              {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                            </p>
                            {isSelected && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#064e3b]">
                                <Check className="w-3 h-3" />
                                <span>Đang áp dụng</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Họ và tên người nhận <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0901234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Email nhận hóa đơn (không bắt buộc)
                    </label>
                    <input
                      type="email"
                      placeholder="Ví dụ: vanan@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Tỉnh / Thành phố</label>
                    <input
                      type="text"
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Quận / Huyện</label>
                    <input
                      type="text"
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Phường / Xã</label>
                    <input
                      type="text"
                      value={form.ward}
                      onChange={(e) => setForm({ ...form, ward: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Địa chỉ cụ thể (Số nhà, tên đường) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 120 Hai Bà Trưng"
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Ghi chú giao hàng</label>
                    <textarea
                      rows={2}
                      placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi giao 15 phút..."
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:border-[#064e3b] transition-all resize-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. PHƯƠNG THỨC THANH TOÁN (SEPAY VIETQR & COD) */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 pb-5 mb-5 border-b border-stone-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900">Phương Thức Thanh Toán</h2>
                    <p className="text-xs text-stone-500">Tích hợp cổng thanh toán trực tiếp SePay VietQR an toàn</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* Option 1: SePay VietQR */}
                  <label
                    onClick={() => setForm({ ...form, paymentMethod: 'bank_transfer' })}
                    className={`block p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      form.paymentMethod === 'bank_transfer'
                        ? 'border-[#064e3b] bg-emerald-50/40 shadow-xs'
                        : 'border-stone-200/80 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={form.paymentMethod === 'bank_transfer'}
                            onChange={() => setForm({ ...form, paymentMethod: 'bank_transfer' })}
                            className="w-4 h-4 text-[#064e3b] focus:ring-[#064e3b]"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-stone-900">
                              Chuyển khoản QR Ngân Hàng (VietQR SePay)
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#064e3b] text-white text-[10px] font-bold tracking-wide">
                              KHUYÊN DÙNG
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Quét mã QR tự động trên ứng dụng của 40+ ngân hàng (Vietcombank, MB, Techcombank, ACB...). Hệ thống SePay tự động ghi nhận thanh toán trong 3 giây.
                          </p>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-[#064e3b] flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                    </div>

                    {form.paymentMethod === 'bank_transfer' && (
                      <div className="mt-3.5 pt-3.5 border-t border-emerald-100 flex items-center gap-3 text-xs text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Mã QR sinh riêng cho đơn hàng, đúng số tiền và nội dung chuyển khoản tự động.</span>
                      </div>
                    )}
                  </label>

                  {/* Option 2: COD */}
                  <label
                    onClick={() => setForm({ ...form, paymentMethod: 'cod' })}
                    className={`block p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      form.paymentMethod === 'cod'
                        ? 'border-[#064e3b] bg-emerald-50/40 shadow-xs'
                        : 'border-stone-200/80 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={form.paymentMethod === 'cod'}
                            onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                            className="w-4 h-4 text-[#064e3b] focus:ring-[#064e3b]"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-sm text-stone-900">
                            Thanh toán khi nhận hàng (COD)
                          </span>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Nhận hàng tại nhà, đồng kiểm gói sản phẩm dinh dưỡng rồi thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.
                          </p>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CỘT PHẢI (5 CỘT): TÓM TẮT ĐƠN HÀNG, DINH DƯỠNG & NÚT THANH TOÁN*/}
            {/* ============================================================== */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-6 sticky top-24">
                <div>
                  <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
                    <span>Đơn Hàng ({items.length} món)</span>
                    <Link href="/products" className="text-xs font-semibold text-emerald-800 hover:underline">
                      Sửa giỏ hàng
                    </Link>
                  </h3>

                  {/* Danh sách items */}
                  <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto pr-1 my-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60">
                          <img
                            src={item.product.thumbnail || item.product.images?.[0] || 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=200&q=80'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 px-1.5 py-0.5 rounded-tl-md bg-[#064e3b] text-white text-[10px] font-bold">
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Khẩu phần: {item.product.unit || '250g'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-stone-900">
                            {(item.product.price * item.quantity).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutri-Facts Tổng Thể Đơn Hàng */}
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#064e3b]">
                    <span>Dinh dưỡng tổng thể đơn hàng</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white border border-emerald-100/60">
                      <div className="text-[10px] text-stone-500">Calories</div>
                      <div className="font-bold text-[#064e3b]">{getTotalCalories()} kcal</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-emerald-100/60">
                      <div className="text-[10px] text-stone-500">Đạm</div>
                      <div className="font-bold text-[#064e3b]">{getTotalProtein()}g</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-emerald-100/60">
                      <div className="text-[10px] text-stone-500">Carbs</div>
                      <div className="font-bold text-[#064e3b]">{getTotalCarbs()}g</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-emerald-100/60">
                      <div className="text-[10px] text-stone-500">Chất béo</div>
                      <div className="font-bold text-[#064e3b]">{getTotalFat()}g</div>
                    </div>
                  </div>
                </div>

                {/* Mã Giảm Giá */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã (ví dụ: NUTRIO2026)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs uppercase font-medium focus:outline-hidden focus:border-[#064e3b]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                      <span>Mã: <strong>{appliedCoupon.code}</strong></span>
                      <span>-{appliedCoupon.discount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                </div>

                {/* Bảng Chi Tiết Giá */}
                <div className="space-y-2.5 text-xs text-stone-600 border-t border-stone-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span>Tạm tính</span>
                    <span className="font-medium text-stone-900">{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Giảm giá</span>
                      <span>-{couponDiscount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span>Phí vận chuyển</span>
                      {subtotal >= 300000 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          FREESHIP
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-stone-900">
                      {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-3 border-t border-stone-200 text-sm">
                    <span className="font-bold text-stone-900">Tổng thanh toán</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#064e3b]">
                        {finalTotal.toLocaleString('vi-VN')}₫
                      </span>
                      <p className="text-[10px] text-stone-400">Đã bao gồm VAT</p>
                    </div>
                  </div>
                </div>

                {/* NÚT HOÀN TẤT ĐẶT HÀNG */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-[#064e3b] hover:bg-[#053d2e] disabled:opacity-60 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ĐANG XỬ LÝ ĐƠN HÀNG...</span>
                    </>
                  ) : form.paymentMethod === 'bank_transfer' ? (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>THANH TOÁN QUA VIETQR SEPAY</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>XÁC NHẬN ĐẶT HÀNG COD</span>
                    </>
                  )}
                </button>

                {/* Cam kết thương hiệu */}
                <div className="space-y-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Nông sản sạch 100% tự nhiên sấy mộc nhiệt thấp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Bảo hành đổi trả miễn phí trong 7 ngày nếu lỗi</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
