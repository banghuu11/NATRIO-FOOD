'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ProductCard from '@/components/common/ProductCard';
import HeroBanner from '@/components/storefront/HeroBanner';
import HealthCalculator from '@/components/storefront/HealthCalculator';
import CartDrawer from '@/components/storefront/CartDrawer';
import { mockProducts, categories } from '@/lib/mockData';
import { useCartStore } from '@/stores/useCartStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { 
  Sparkles, 
  CalendarDays, 
  ArrowRight, 
  QrCode, 
  ShieldCheck, 
  Flame,
  Award,
  Nut,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const userAllergens = useHealthStore((state) => state.profile.allergens);
  const targetCalories = useHealthStore((state) => state.profile.targetCalories || 2000);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return mockProducts;
    return mockProducts.filter((p) => p.categoryId === selectedCategory);
  }, [selectedCategory]);

  // Handler to add entire 7-day nut mix combo
  const handleAddNutPackCombo = () => {
    // Add Macca, Almonds, Daily Mix
    mockProducts.slice(0, 3).forEach((product) => {
      addItem(product, 1);
    });
    toast.success('Đã thêm Combo Hạt Định Lượng 7 Ngày vào giỏ hàng!', {
      description: 'Gồm Macca Tây Nguyên + Hạnh nhân Mỹ + Granola Chocolate',
    });
    setIsCartOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Header with Cart Trigger */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 space-y-12">
        {/* 2. Hero Banner: Nut-focused branding */}
        <HeroBanner />

        {/* 3. Personalized Health Calculator Engine (Nhóm 1) */}
        <HealthCalculator />

        {/* 4. Products Section with Category Tabs */}
        <section id="products" className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                  <Nut className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CỬA HÀNG HẠT DINH DƯỠNG & GRANOLA</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Bộ Sưu Tập Hạt Hữu Cơ Tuyển Chọn
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Sấy mộc nhiệt thấp giữ 100% tinh chất Omega 3-6-9, định lượng Calo chính xác theo khẩu phần 30g.
                </p>
              </div>

              {/* Quick Allergen Status */}
              {userAllergens.length > 0 && (
                <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-medium">
                  Đang lọc {userAllergens.length} chất dị ứng đã chọn
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.name}
                  {cat.itemCount && (
                    <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.itemCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          </div>
        </section>

        {/* 5. Smart 7-Day Nut Daily Pack Section */}
        <section id="meal-plan" className="py-16 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-amber-950 rounded-3xl p-6 sm:p-10 text-white overflow-hidden relative shadow-xl">
              
              <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                
                {/* Info */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>LỘ TRÌNH HẠT ĐỊNH LƯỢNG 7 NGÀY (DAILY NUT PACK)</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                    Giải Pháp Ăn Vặt Lành Mạnh <br />
                    <span className="text-amber-400">Chuẩn 30g / Gói (~175 kcal)</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
                    Không còn nỗi lo ăn hạt quá đà gây thừa calo. NUTRIO chia sẵn 7 gói nhỏ định lượng cho 7 ngày, mix hoàn hảo giữa <strong>Macca, Hạnh nhân, Óc chó, Hạt điều và Bí xanh</strong>.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
                    <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                      <div className="text-xs text-amber-300">Năng lượng</div>
                      <div className="text-sm font-bold text-white mt-0.5">175 kcal/gói</div>
                      <div className="text-[10px] text-emerald-200">Chuẩn bữa phụ</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                      <div className="text-xs text-amber-300">Chất béo tốt</div>
                      <div className="text-sm font-bold text-white mt-0.5">Omega 3-6-9</div>
                      <div className="text-[10px] text-emerald-200">Bảo vệ tim mạch</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                      <div className="text-xs text-amber-300">Đạm thực vật</div>
                      <div className="text-sm font-bold text-white mt-0.5">5.5g Protein</div>
                      <div className="text-[10px] text-emerald-200">No lâu, giảm thèm ăn</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleAddNutPackCombo}
                      className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg hover:shadow-amber-400/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Đặt Ngay Combo 7 Ngày Ăn Sạch (1-Click)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Visual Image */}
                <div className="lg:col-span-5 hidden sm:block">
                  <div className="relative rounded-2xl overflow-hidden aspect-4/3 border-2 border-white/20 shadow-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                      alt="7-Day Nut Daily Pack"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Chứng nhận không phẩm màu, không chất bảo quản</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 6. Traceability & Trust Section */}
        <section id="origin" className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NGUỒN GỐC NÔNG TRƯỜNG MINH BẠCH</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Truy Xuất Nguồn Gốc Từng Hạt Bằng Mã QR
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Liên kết trực tiếp cùng nông trường Macca Đắk Lắk, Hạt điều Bình Phước và trang trại Hạnh nhân California (USA).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Quét Mã QR Lô Hạt</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Xem ngay vùng trồng, niên vụ thu hoạch và chứng nhận kiểm dịch thực vật an toàn.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">100% Sấy Mộc Nhiệt Thấp</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Không chiên dầu, không tẩm đường hóa học, bảo toàn trọn vẹn chất béo không bão hòa đơn.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Định Lượng Calo Chuẩn Xác</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kiểm nghiệm dinh dưỡng theo tiêu chuẩn Eurofins, giúp bạn kiểm soát năng lượng nạp vào chặt chẽ.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* 7. Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
