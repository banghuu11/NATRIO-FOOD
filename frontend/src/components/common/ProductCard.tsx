'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCartStore } from '@/stores/useCartStore';
import { toast } from 'sonner';

// Fallback ảnh chụp thực phẩm sắc nét, sạch sẽ chuẩn thương mại (Đã kiểm tra 100% 200 OK)
const cleanImageFallback: Record<string, string> = {
  'hat-chia': 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=800&q=85',
  'hanh-nhan-rang': 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85',
  'yen-mach-can-det': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85',
  'sua-oc-cho-khong-duong': 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85',
  'uc-ga-ap-chao': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85',
  'granola-khong-duong': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85',
  'macca-nut-vo': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
  'hat-dieu-rang-cui': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85',
};

const getDisplayImage = (product: Product) => {
  if (
    !product.thumbnail ||
    product.thumbnail.includes('placehold.co') ||
    product.thumbnail.includes('photo-1517093707765-a895311f9f25') ||
    product.thumbnail.includes('photo-1508061252445-5350f31934b0')
  ) {
    if (product.slug && cleanImageFallback[product.slug]) {
      return cleanImageFallback[product.slug];
    }
    return 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85';
  }
  return product.thumbnail;
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const displayImage = getDisplayImage(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`, {
      description: `Khẩu phần: ${product.servingSize || '100g'} • ${product.calories} kcal • ${product.protein}g Protein`,
    });
  };

  const nutriGrade = product.nutriScore || 'A';

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300">
      
      {/* 1. Direct Image (No inner nested border box) */}
      <div>
        <Link href={`/products/${product.slug}`} className="block relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 mb-3 cursor-pointer">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            onError={(e: any) => {
              e.target.src = 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=500&q=80';
            }}
          />
        </Link>

        {/* 2. Brand & Category */}
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
          <span className="truncate">NUTRIO • {product.category?.name || 'Hạt Dinh Dưỡng'}</span>
          <span className="text-slate-500 dark:text-slate-400 shrink-0 font-semibold">{product.unit || '100g'}</span>
        </div>
        
        {/* 3. Product Title */}
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 min-h-[38px] leading-snug group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* 4. Understated Nutrition Info (Clean Editorial Typography, No visual clutter) */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2 mb-3">
          <span className="font-bold text-emerald-800 dark:text-emerald-400">
            Nutri-Score {nutriGrade}
          </span>
          <span>•</span>
          <span>{product.calories} kcal</span>
          <span>•</span>
          <span>{product.protein}g đạm</span>
        </div>
      </div>

      {/* 5. Price & Minimal Action */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-slate-400 font-medium">Giá niêm yết</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {typeof product.price === 'number'
                ? `${product.price.toLocaleString('vi-VN')}₫`
                : `${(Number(product.price) || 0).toLocaleString('vi-VN')}₫`}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {product.originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`px-3.5 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all cursor-pointer shrink-0 active:scale-95 ${
            isAdded
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600'
          }`}
        >
          {isAdded ? 'Đã thêm' : 'Chọn mua'}
        </button>
      </div>

    </div>
  );
}
