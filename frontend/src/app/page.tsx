'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import BotanicalBackground from '@/components/common/BotanicalBackground';
import HeroBanner from '@/components/storefront/HeroBanner';
import CartDrawer from '@/components/storefront/CartDrawer';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const FooterSpillingBowl3D = dynamic(
  () => import('@/components/storefront/FooterSpillingBowl3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
      </div>
    ),
  }
);

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 overflow-x-hidden transition-colors duration-200">
      
      {/* 0. Subtle Botanical Background */}
      <BotanicalBackground />

      {/* 0.1 3D Nut Scrolling Animation along side margin
      <ScrollNut3D /> */}

      {/* 1. Header (Navbar with Search, Page links & Theme Toggle) */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="relative z-10 flex-1">
        
        {/* ======================================================== */}
        {/* 1. TOP 3D HERO BANNER: TÔ HẠT MỘC TƯƠNG TÁC 3D          */}
        {/* ======================================================== */}
        <FooterSpillingBowl3D />

        {/* ======================================================== */}
        {/* 2. CÔNG CỤ TÍNH CALO TDEE & THỰC ĐƠN CÁ NHÂN HÓA         */}
        {/* ======================================================== */}
        <HeroBanner />

        {/* ======================================================== */}
        {/* 3. TRIẾT LÝ DINH DƯỠNG MỘC (MINIMALIST PHILOSOPHY)       */}
        {/* ======================================================== */}
        <section className="py-20 bg-white dark:bg-[#090D16] border-t border-slate-100 dark:border-slate-800/80">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-widest uppercase">
                Triết Lý Sản Phẩm
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                Dinh Dưỡng Thuần Khiết Từ Sự Tối Giản
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                Chúng tôi không thêm phụ gia để làm hạt ngon hơn. Chúng tôi giữ nguyên vị mộc tự nhiên vốn có của nông sản đất Việt.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pt-8 border-t border-slate-100 dark:border-slate-800">
              
              <div className="space-y-3">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400">01</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Không Đường Tinh Luyện
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Vị ngọt thanh tự nhiên được tạo nên hoàn toàn từ quả sấy mộc và mật ong hoa rừng Tây Nguyên.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400">02</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sấy Nhiệt Thấp 60°C
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Phương pháp sấy đối lưu gió nhiệt thấp giữ trọn vẹn chất béo lành mạnh Omega-3 và vitamin E.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400">03</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Không Chất Bảo Quản
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bảo quản tự nhiên bằng công nghệ túi màng nhôm 3 lớp bơm khí nitơ, giữ hạt luôn giòn thơm tươi mới.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. NGUỒN GỐC & NÔNG TRẠI (ORIGIN STORY)                 */}
        {/* ======================================================== */}
        <section className="py-20 bg-white dark:bg-[#090D16] border-t border-slate-100 dark:border-slate-800/80">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-widest uppercase">
                  Nguồn Gốc Xuất Xứ
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Từng Hạt Mộc Đều Có Câu Chuyện Riêng
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nutrio hợp tác trực tiếp cùng các hộ nông dân tại Đắk Lắk, Lâm Đồng và Bình Phước. Chúng tôi chọn lọc những hạt chắc mẩy, đạt chuẩn kích thước loại 1 và tiến hành sơ chế ngay sau thu hoạch để giữ trọn vẹn độ tươi mới.
                </p>

                <div className="pt-2">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-700 underline underline-offset-4 transition-colors"
                  >
                    <span>Tìm hiểu thêm về hành trình Nutrio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=85"
                    alt="Nông trại sạch Nutrio"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. CALL TO ACTION DẪN SANG TRANG SẢN PHẨM               */}
        {/* ======================================================== */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sẵn Sàng Cho Bữa Ăn Lành Mạnh Của Bạn?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Khám phá toàn bộ thực đơn hạt sấy mộc, granola cao cấp và chia pudding dinh dưỡng được cá nhân hóa theo từng mục tiêu calo.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs hover:shadow-md transition-all"
              >
                <span>Xem Tất Cả Sản Phẩm</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <Footer />

    </div>
  );
}
