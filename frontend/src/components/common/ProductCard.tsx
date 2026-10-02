'use client';

import React, { useState } from 'react';
import { Plus, Flame, AlertTriangle, Star, ShieldCheck, Nut } from 'lucide-react';
import { Product, NutriScoreGrade } from '@/types';
import { useCartStore } from '@/stores/useCartStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const getNutriScoreColor = (score: NutriScoreGrade) => {
  switch (score) {
    case 'A': return 'bg-emerald-600 text-white';
    case 'B': return 'bg-lime-500 text-slate-900';
    case 'C': return 'bg-yellow-400 text-slate-900';
    case 'D': return 'bg-orange-500 text-white';
    case 'E': return 'bg-rose-600 text-white';
    default: return 'bg-slate-500 text-white';
  }
};

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const userAllergens = useHealthStore((state) => state.profile.allergens);

  const hasAllergenWarning = product.allergens.some((a) => userAllergens.includes(a));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`, {
      description: `Khẩu phần 30g: +${product.calories} kcal • ${product.protein}g Protein`,
    });
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-500/50 overflow-hidden shadow-xs hover:shadow-2xl hover:shadow-emerald-950/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* 1. Image & Badges */}
      <div className="relative aspect-4/3 w-full bg-gradient-to-tr from-amber-50 to-emerald-50 overflow-hidden">
        {!imgError ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-amber-950 text-amber-200 p-4 text-center">
            <Nut className="w-12 h-12 text-amber-400 mb-2 opacity-80" />
            <span className="text-xs font-bold text-white line-clamp-1">{product.name}</span>
            <span className="text-[10px] text-amber-300 mt-1">100% Organic Sấy Mộc</span>
          </div>
        )}

        {/* Nutri-Score Badge Top-Left */}
        <div className="absolute top-3 left-3 flex items-center shadow-lg rounded-lg overflow-hidden text-[11px] font-black backdrop-blur-md">
          <span className="bg-slate-900/90 text-slate-100 px-2 py-0.5 uppercase tracking-tighter text-[9px]">
            NUTRI
          </span>
          <span className={`px-2 py-0.5 font-black ${getNutriScoreColor(product.nutriScore)}`}>
            {product.nutriScore}
          </span>
        </div>

        {/* Cảnh báo dị ứng */}
        {hasAllergenWarning && (
          <div className="absolute top-3 right-3 bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>Có chất dị ứng</span>
          </div>
        )}

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </div>
        )}
      </div>

      {/* 2. Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Badges tag */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {product.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md"
              >
                {badge}
              </span>
            ))}
            <span className="text-[11px] text-slate-500 font-semibold ml-auto flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {product.rating}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors mb-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 font-medium mb-3">{product.unit}</p>

          {/* Macro Nutrition Pills Bar (30g serving) */}
          <div className="bg-slate-50 rounded-2xl p-2.5 mb-4 border border-slate-100 flex items-center justify-between text-center">
            <div className="flex items-center gap-1 text-slate-800 font-black text-xs">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>{product.calories}</span>
              <span className="text-[10px] text-slate-400 font-normal">kcal</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="text-[11px] text-slate-700">
              <span className="font-extrabold text-emerald-700">{product.protein}g</span> <span className="text-slate-400 text-[10px]">Đạm</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="text-[11px] text-slate-700">
              <span className="font-extrabold text-amber-700">{product.fat}g</span> <span className="text-slate-400 text-[10px]">Béo tốt</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="text-[11px] text-slate-700">
              <span className="font-extrabold text-sky-700">{product.carbs}g</span> <span className="text-slate-400 text-[10px]">Carb</span>
            </div>
          </div>
        </div>

        {/* 3. Price & Add to Cart Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-slate-900">
              {product.price.toLocaleString('vi-VN')}₫
            </div>
            {product.originalPrice && (
              <div className="text-xs text-slate-400 line-through font-medium">
                {product.originalPrice.toLocaleString('vi-VN')}₫
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            title="Thêm vào giỏ hàng"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
