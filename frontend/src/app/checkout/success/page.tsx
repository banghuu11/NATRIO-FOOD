'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { orderService } from '@/services/order.service';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Phone,
  Mail,
  QrCode,
  Loader2,
  ChevronRight,
} from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode') || searchParams.get('orderNumber');
  const gateway = searchParams.get('gateway');
  const isSepay = gateway === 'sepay';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderByOrderNumber(orderCode);
        setOrder(data);

        // Nếu là SePay và chưa ghi nhận paid, tiếp tục polling 3s/lần trong vòng 30s
        if (isSepay && data.paymentStatus !== 'paid' && pollingCount < 10) {
          interval = setTimeout(() => {
            setPollingCount((prev) => prev + 1);
          }, 3000);
        }
      } catch (err) {
        console.error('Lỗi tra cứu đơn hàng:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [orderCode, pollingCount, isSepay]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#064e3b] mx-auto" />
            <p className="text-sm font-medium text-stone-600">Đang tải thông tin đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = order?.paymentStatus === 'paid';

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-stone-800">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
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
          <span className="font-semibold text-stone-800">Xác Nhận Đơn Hàng</span>
        </nav>

        {/* THẺ TRẠNG THÁI THÀNH CÔNG */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-10 shadow-xs text-center space-y-4 mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#064e3b]" />
          </div>

          <div className="space-y-1.5 max-w-xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase">
              {isPaid ? 'Thanh toán thành công' : 'Đặt hàng thành công'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Cảm ơn bạn đã tin chọn NATRIOFOOD!
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Mã đơn hàng của bạn là{' '}
              <strong className="text-stone-900 font-mono text-sm sm:text-base">
                #{order?.orderNumber || orderCode || 'NT2611...'}
              </strong>
              . Đơn hàng đang được chuẩn bị và đóng gói chuẩn lạnh giữ nhiệt.
            </p>
          </div>

          {/* Badge phương thức thanh toán */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700">
            {order?.paymentMethod === 'bank_transfer' ? (
              <>
                <QrCode className="w-4 h-4 text-[#064e3b]" />
                <span>
                  Thanh toán qua <strong>VietQR SePay</strong> •{' '}
                  <span className={isPaid ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
                    {isPaid ? 'Đã xác nhận thanh toán' : 'Đang đồng bộ giao dịch...'}
                  </span>
                </span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 text-[#064e3b]" />
                <span>
                  Thanh toán khi nhận hàng (<strong>COD</strong>) •{' '}
                  <span className="text-stone-600 font-medium">Thanh toán tiền mặt cho shipper</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* CHI TIẾT ĐƠN HÀNG */}
        {order && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Cột trái: Thông tin nhận hàng */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
                <Package className="w-4 h-4 text-[#064e3b]" />
                <span>Địa Chỉ Giao Hàng</span>
              </h3>
              <div className="text-xs space-y-1.5 text-stone-600">
                <p>
                  <strong className="text-stone-900 font-medium">Người nhận:</strong>{' '}
                  {order.shippingAddress?.recipientName}
                </p>
                <p>
                  <strong className="text-stone-900 font-medium">Số điện thoại:</strong>{' '}
                  {order.shippingAddress?.phone}
                </p>
                <p>
                  <strong className="text-stone-900 font-medium">Địa chỉ:</strong>{' '}
                  {order.shippingAddress?.street}, {order.shippingAddress?.ward},{' '}
                  {order.shippingAddress?.district}, {order.shippingAddress?.province}
                </p>
                {order.shippingAddress?.note && (
                  <p className="italic text-stone-500 pt-1">
                    Ghi chú: &ldquo;{order.shippingAddress?.note}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Cột phải: Tóm tắt thanh toán */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
                <Clock className="w-4 h-4 text-[#064e3b]" />
                <span>Tóm Tắt Thanh Toán</span>
              </h3>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-medium text-stone-900">
                    {order.pricing?.subtotal?.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                {order.pricing?.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá</span>
                    <span>-{order.pricing?.discountAmount?.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí giao hàng</span>
                  <span className="font-medium text-stone-900">
                    {order.pricing?.shippingFee === 0
                      ? 'Miễn phí'
                      : `${order.pricing?.shippingFee?.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-100 font-bold text-sm text-stone-900">
                  <span>Tổng cộng</span>
                  <span className="text-base text-[#064e3b] font-black">
                    {order.pricing?.totalAmount?.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DANH SÁCH MÓN ĐÃ ĐẶT */}
        {order?.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs mb-8">
            <h3 className="font-bold text-sm text-stone-900 pb-3 mb-3 border-b border-stone-100">
              Sản Phẩm Trong Đơn Hàng ({order.items.length})
            </h3>
            <div className="divide-y divide-stone-100">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-stone-900">{item.productName}</h4>
                    <p className="text-stone-500">
                      Quy cách: {item.variantName} • Số lượng: <strong>x{item.quantity}</strong>
                    </p>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    {item.lineTotal?.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HÀNH ĐỘNG TIẾP THEO */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#064e3b] hover:bg-[#053d2e] text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>Tiếp Tục Mua Sắm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Về Trang Chủ</span>
          </Link>
        </div>

        {/* HỖ TRỢ KHÁCH HÀNG */}
        <div className="mt-12 text-center text-xs text-stone-500 space-y-1">
          <p>Cần hỗ trợ về đơn hàng? Đội ngũ chuyên viên dinh dưỡng NATRIOFOOD luôn sẵn sàng:</p>
          <p className="font-semibold text-stone-800">
            Hotline: 1900 6868 (8:00 - 21:00) • Email: support@natriofood.vn
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A7C59]" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </React.Suspense>
  );
}
