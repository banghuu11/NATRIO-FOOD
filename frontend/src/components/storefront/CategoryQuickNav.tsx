'use client';

import React from 'react';
import {
  Nut,
  Salad,
  Apple,
  Milk,
  CalendarDays,
  Cookie,
  Flame,
  Sparkles,
} from 'lucide-react';

interface CategoryQuickNavProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export default function CategoryQuickNav({
  selectedCategory,
  onSelectCategory,
}: CategoryQuickNavProps) {
  const quickCategories = [
    {
      slug: 'all',
      name: 'Tất Cả Sản Phẩm',
      icon: Sparkles,
      desc: 'Toàn bộ danh mục',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      slug: 'hat-dinh-duong',
      name: 'Hạt & Granola Sấy',
      icon: Nut,
      desc: 'Macca, Hạnh nhân, Yến mạch',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      slug: 'rau-cu-organic',
      name: 'Rau Quả Hữu Cơ',
      icon: Salad,
      desc: 'Chứng nhận VietGAP & USDA',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      slug: 'sua-hat-nguyen-chat',
      name: 'Sữa Hạt & Bơ Tươi',
      icon: Milk,
      desc: 'Không đường tinh luyện',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      slug: 'khau-phan-7-ngay',
      name: 'Combo 7 Ngày Chuẩn Calo',
      icon: CalendarDays,
      desc: 'Gói định lượng 30g/ngày',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      slug: 'banh-an-kieng',
      name: 'Biscotti & Snack Healthy',
      icon: Cookie,
      desc: 'Eat Clean & Kỷ Luật',
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              DANH MỤC THỰC PHẨM CHUẨN SẠCH
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Khám Phá Theo Nhu Cầu Dinh Dưỡng
            </h2>
          </div>
          <a
            href="#products"
            className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            Xem tất cả &rarr;
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.slug);
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-4 rounded-3xl text-left border transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-lg shadow-emerald-800/20 ring-2 ring-emerald-600/30 -translate-y-1'
                    : 'bg-white text-slate-800 border-slate-200/80 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h3
                    className={`text-xs sm:text-sm font-extrabold line-clamp-1 leading-snug ${
                      isSelected ? 'text-white' : 'text-slate-900 group-hover:text-emerald-700'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p
                    className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {cat.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
