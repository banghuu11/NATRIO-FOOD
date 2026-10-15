'use client';

import React, { useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CartDrawer from '@/components/storefront/CartDrawer';
import dynamic from 'next/dynamic';

const ScrollNut3D = dynamic(() => import('@/components/storefront/ScrollNut3D'), {
  ssr: false,
});

export default function AboutPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* 3D Nut Scroll Animation */}
      <ScrollNut3D />

      {/* Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 pb-20">
        
        {/* Hero Section */}
        <section className="pt-16 pb-16 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-widest uppercase">
              Về Chúng Tôi
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
              Khởi Nguồn Từ Niềm Đam Mê Nông Sản Mộc Thuần Khiết
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              NUTRIO được thành lập với tôn chỉ: Đưa các loại hạt dinh dưỡng tự nhiên của Việt Nam và thế giới đến tay người tiêu dùng ở trạng thái tươi mới, nguyên bản nhất mà không cần đến phụ gia công nghiệp.
            </p>
          </div>
        </section>

        {/* 3 Trụ Cột Sứ Mệnh */}
        <section className="py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pt-8 border-t border-slate-100 dark:border-slate-800">
              
              <div className="space-y-3">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400">01</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Nông Trại Hữu Cơ</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Liên kết chặt chẽ với các hộ nông dân tại vùng thổ nhưỡng bazan Đắk Lắk, Lâm Đồng, cam kết không sử dụng thuốc trừ sâu hóa học và hóa chất kích thích sinh trưởng.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400">02</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Công Nghệ Sấy Mộc 60°C</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Công nghệ sấy nhiệt thấp đối lưu giữ nguyên lớp dầu tự nhiên giàu Omega-3, vitamin E và chất chống oxy hóa, đảm bảo hạt giòn tan tự nhiên không qua dầu chiên.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400">03</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Minh Bạch Định Lượng</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Toàn bộ sản phẩm được kiểm nghiệm bởi viện Eurofins, dán nhãn Nutri-Score A & B theo tiêu chuẩn Châu Âu và hiển thị rõ ràng lượng calo, protein, chất béo trên từng bao bì.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Câu Chuyện Nông Trại Hình Ảnh */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-6 relative">
                <div className="aspect-4/3 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=85"
                    alt="Nutrio Farm Harvest"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-widest uppercase">
                  Vùng Nguyên Liệu
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Đồng Hành Cùng Nông Dân Việt Nam
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Chúng tôi tin rằng sự bền vững bắt đầu từ mảnh đất gieo trồng. Bằng việc thu mua trực tiếp với giá cao hơn thị trường 15-20%, Nutrio đồng hành cùng nông dân Tây Nguyên chuyển đổi sang mô hình nông nghiệp tái sinh, bảo vệ nguồn nước và đất mẹ.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-2xl font-black text-emerald-800 dark:text-emerald-400">120+</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Hộ nông dân liên kết</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-2xl font-black text-emerald-800 dark:text-emerald-400">100%</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Chứng nhận kiểm định sạch</div>
                  </div>
                </div>
              </div>

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
