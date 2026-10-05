'use client';

import React, { useState } from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/stores/useCartStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

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
    <div className="bg-white rounded-[26px] border border-[#EBE4D8] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-[#5F7E66]/40 transition-all duration-300 group">
      
      {/* 1. Image Container with Heart Wishlist Icon */}
      <div>
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF7F2] mb-3 flex items-center justify-center p-2">
          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
              if (!isLiked) {
                toast.info(`Đã thêm "${product.name}" vào mục yêu thích`);
              }
            }}
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 shadow-xs flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-white transition-colors cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'stroke-[1.8]'}`}
            />
          </button>

          {/* High-res Clean Product Image */}
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e: any) => {
              e.target.src = 'https://images.unsplash.com/photo-1517093707765-a895311f9f25?auto=format&fit=crop&w=500&q=80';
            }}
          />
        </div>

        {/* 2. Brand & Title & Price */}
        <div className="mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            NUTRIO
          </div>
          
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <h3 className="font-extrabold text-[#2C3E30] text-sm truncate group-hover:text-[#5F7E66] transition-colors">
              {product.name}
            </h3>
            <div className="text-sm font-black text-[#2C3E30] shrink-0">
              {typeof product.price === 'number' && product.price > 1000
                ? `${product.price.toLocaleString('vi-VN')}₫`
                : `$${product.price || '12.99'}`}
            </div>
          </div>
        </div>

        {/* 3. Official Nutri-Score Bar + Calories */}
        <div className="flex items-center justify-between gap-1.5 my-2.5">
          {/* Nutri-Score 5-segment pill */}
          <div className="inline-flex items-center rounded overflow-hidden text-[9px] font-black tracking-tight shadow-2xs">
            <span
              className={`px-1.5 py-0.5 ${
                nutriGrade === 'A' ? 'bg-[#00813D] text-white font-extrabold' : 'bg-stone-200 text-stone-400'
              }`}
            >
              A
            </span>
            <span
              className={`px-1.5 py-0.5 ${
                nutriGrade === 'B' ? 'bg-[#84B82C] text-stone-900 font-extrabold' : 'bg-stone-200 text-stone-400'
              }`}
            >
              B
            </span>
            <span
              className={`px-1.5 py-0.5 ${
                nutriGrade === 'C' ? 'bg-[#FFCE00] text-stone-900 font-extrabold' : 'bg-stone-200 text-stone-400'
              }`}
            >
              C
            </span>
            <span
              className={`px-1.5 py-0.5 ${
                nutriGrade === 'D' ? 'bg-[#EF7C00] text-white font-extrabold' : 'bg-stone-200 text-stone-400'
              }`}
            >
              D
            </span>
            <span
              className={`px-1.5 py-0.5 ${
                nutriGrade === 'E' ? 'bg-[#E63E11] text-white font-extrabold' : 'bg-stone-200 text-stone-400'
              }`}
            >
              E
            </span>
          </div>

          {/* Calories label */}
          <div className="text-[11px] text-stone-500 font-medium text-right whitespace-nowrap">
            <span className="text-[10px] text-stone-400">Calories</span>{' '}
            <strong className="text-[#2C3E30]">{product.calories} kcal/100g</strong>
          </div>
        </div>

        {/* 4. Protein Tag */}
        <div className="text-[11px] text-[#5F7E66] font-bold mb-3.5">
          {product.protein}g | High Protein
        </div>
      </div>

      {/* 5. Full-width Solid Olive Green Button: ADD TO CART + */}
      <button
        type="button"
        onClick={handleAddToCart}
        className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
          isAdded
            ? 'bg-[#3D5A45] text-white'
            : 'bg-[#5F7E66] hover:bg-[#4D6953] active:scale-98 text-white'
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>ĐÃ THÊM</span>
          </>
        ) : (
          <>
            <span>ADD TO CART</span>
            <span className="font-extrabold text-sm leading-none">+</span>
          </>
        )}
      </button>

    </div>
  );
}
