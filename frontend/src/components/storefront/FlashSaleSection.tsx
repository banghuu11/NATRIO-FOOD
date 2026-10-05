'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Clock, Sparkles, ArrowRight, Plus, ShieldCheck, Zap } from 'lucide-react';
import { promotionService } from '@/services/quiz.service';
import { useCartStore } from '@/stores/useCartStore';
import { toast } from 'sonner';

export default function FlashSaleSection() {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });
  const addItem = useCartStore((state) => state.addItem);

  // Live countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const flashSaleItems = [
    {
      id: 'fs-1',
      name: 'Granola Siêu Hạt Ăn Kiêng Không Đường (500g)',
      slug: 'granola-sieu-hat-500g',
      price: 119000,
      originalPrice: 165000,
      discount: '-28%',
      soldPercent: 78,
      soldCount: 39,
      totalCount: 50,
      thumbnail: 'https://images.unsplash.com/photo-1517093707765-a895311f9f25?auto=format&fit=crop&w=500&q=80',
      nutriScore: 'A',
      calories: 140,
      protein: 6.2,
      fat: 8.5,
      carbs: 12.0,
      unit: '500g',
      note: 'Lô sản xuất mới - Hạn dùng 12 tháng',
    },
    {
      id: 'fs-2',
      name: 'Hạt Macca Đắk Lắk Sấy Nứt Vỏ Loại 1 (500g)',
      slug: 'macca-dak-lak-500g',
      price: 148000,
      originalPrice: 195000,
      discount: '-24%',
      soldPercent: 86,
      soldCount: 43,
      totalCount: 50,
      thumbnail: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=500&q=80',
      nutriScore: 'A',
      calories: 190,
      protein: 2.2,
      fat: 19.5,
      carbs: 3.8,
      unit: '500g',
      note: 'Tặng kềm bóc vỏ kim loại đi kèm',
    },
    {
      id: 'fs-3',
      name: 'Hạt Điều Rang Củi Bình Phước Nguyên Lụa (500g)',
      slug: 'hat-dieu-binh-phuoc-500g',
      price: 125000,
      originalPrice: 160000,
      discount: '-22%',
      soldPercent: 62,
      soldCount: 31,
      totalCount: 50,
      thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
      nutriScore: 'A',
      calories: 165,
      protein: 5.5,
      fat: 13.0,
      carbs: 9.0,
      unit: '500g',
      note: 'Hạt tuyển chọn size A+ bùi béo tự nhiên',
    },
  ];

  const handleAddToCart = (item: any) => {
    addItem(
      {
        id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        originalPrice: item.originalPrice,
        unit: item.unit,
        thumbnail: item.thumbnail,
        category: { id: '1', name: 'Hạt Dinh Dưỡng', slug: 'hat-dinh-duong' },
        categoryId: 'hat-dinh-duong',
        servingSize: '30g',
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        nutriScore: item.nutriScore as any,
        badges: ['FLASH SALE', 'ORGANIC'],
        allergens: [],
        rating: 5.0,
        reviewCount: 38,
        isAvailable: true,
        stock: 50,
      },
      1
    );
    toast.success(`Đã thêm "${item.name}" vào giỏ hàng với giá Flash Sale!`, {
      description: `Tiết kiệm ${(item.originalPrice - item.price).toLocaleString('vi-VN')}₫`,
    });
  };

  return (
    <section className="py-8 bg-gradient-to-b from-amber-500/5 via-emerald-500/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flash Sale Banner Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-6">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md mb-2">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
                <span>GIỜ VÀNG SỨC KHỎE • ƯU ĐÃI CHỚP NHOÁNG</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Flash Sale Thực Phẩm Hữu Cơ
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg uppercase">
                  Giảm Đến 50%
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-xl">
                Cơ hội trải nghiệm hạt sấy mộc Nutri-Score A cao cấp với giá độc quyền trong ngày.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mr-2">
                <Clock className="w-4 h-4" />
                <span>KẾT THÚC SAU:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="bg-slate-900 text-white font-black text-base sm:text-lg px-2.5 py-1 rounded-lg shadow-inner min-w-[36px] text-center">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="font-bold text-amber-300">:</span>
                <div className="bg-slate-900 text-white font-black text-base sm:text-lg px-2.5 py-1 rounded-lg shadow-inner min-w-[36px] text-center">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="font-bold text-amber-300">:</span>
                <div className="bg-slate-900 text-amber-400 font-black text-base sm:text-lg px-2.5 py-1 rounded-lg shadow-inner min-w-[36px] text-center">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flash Sale Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {flashSaleItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 hover:border-amber-500/60 p-4 sm:p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden mb-4 bg-slate-100">
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>{item.discount}</span>
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                    Nutri {item.nutriScore}
                  </div>
                </div>

                <div className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                  {item.note}
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </h3>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-red-600 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-red-500" />
                      Đã bán {item.soldCount}/{item.totalCount}
                    </span>
                    <span className="text-slate-400">Còn {item.totalCount - item.soldCount} suất</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${item.soldPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-red-600">
                    {item.price.toLocaleString('vi-VN')}₫
                  </div>
                  <div className="text-xs text-slate-400 line-through font-medium">
                    {item.originalPrice.toLocaleString('vi-VN')}₫
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Mua Ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
