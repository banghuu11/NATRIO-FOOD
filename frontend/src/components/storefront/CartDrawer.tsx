'use client';

import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Flame, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useHealthStore } from '@/stores/useHealthStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalCalories, getTotalProtein, getTotalCarbs, getTotalFat } = useCartStore();
  const targetCalories = useHealthStore((state) => state.profile.targetCalories || 2450);

  if (!isOpen) return null;

  const totalCalories = getTotalCalories();
  const totalPrice = getTotalPrice();
  const caloPercentage = Math.min(100, Math.round((totalCalories / targetCalories) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#2C3E30]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#FBF8F3] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-[#EFE8DE]">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#EFE8DE] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] text-[#3D5A45] flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#2C3E30]">Giỏ Hàng Dinh Dưỡng</h2>
              <p className="text-xs text-stone-500">{items.length} sản phẩm</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-[#2C3E30] rounded-full hover:bg-[#F4EFE6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Calorie & Macro Target Progress */}
        <div className="p-4 bg-white border-b border-[#EFE8DE] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#2C3E30]">
            <div className="flex items-center gap-1.5 text-[#C5853B]">
              <Flame className="w-4 h-4 fill-[#C5853B]" />
              <span>{totalCalories} kcal</span>
              <span className="text-stone-400 font-normal">/ {targetCalories} kcal</span>
            </div>
            <span className="text-[11px] text-stone-500">{caloPercentage}% mục tiêu</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-[#F4EFE6] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#5F7E66] to-[#C5853B] transition-all duration-500 rounded-full"
              style={{ width: `${caloPercentage}%` }}
            />
          </div>

          {/* Macros mini summary */}
          <div className="flex justify-between text-[11px] text-stone-500 pt-1">
            <span>Đạm: <strong className="text-[#3D5A45]">{getTotalProtein()}g</strong></span>
            <span>Carb: <strong className="text-stone-700">{getTotalCarbs()}g</strong></span>
            <span>Béo tốt: <strong className="text-[#C5853B]">{getTotalFat()}g</strong></span>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F4EFE6] flex items-center justify-center text-stone-400">
                <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2C3E30]">Giỏ hàng của bạn đang trống</h3>
                <p className="text-xs text-stone-500 mt-1">Hãy thêm các món healthy yêu thích để cân đối khẩu phần dinh dưỡng.</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.product.id}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#EFE8DE] shadow-2xs"
              >
                {/* Product Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-[#FAF7F2] overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img 
                    src={item.product.thumbnail} 
                    alt={item.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#2C3E30] truncate">{item.product.name}</h4>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {item.product.calories} kcal • {item.product.protein}g protein
                  </div>
                  <div className="text-xs font-black text-[#C5853B] mt-1">
                    {(item.product.price * item.quantity).toLocaleString('vi-VN')}₫
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="text-stone-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 bg-[#F4EFE6] px-2 py-0.5 rounded-lg border border-[#EFE8DE]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="text-stone-600 hover:text-[#2C3E30] transition-colors p-0.5 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-[#2C3E30] min-w-3 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="text-stone-600 hover:text-[#2C3E30] transition-colors p-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Checkout Bar */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-[#EFE8DE] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 font-medium">Tạm tính</span>
              <span className="font-black text-lg text-[#2C3E30]">{totalPrice.toLocaleString('vi-VN')}₫</span>
            </div>

            <button
              type="button"
              className="w-full py-3.5 rounded-2xl bg-[#5F7E66] hover:bg-[#4E6B55] text-white font-black text-xs sm:text-sm tracking-wide uppercase shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>TIẾN HÀNH ĐẶT HÀNG</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5F7E66]" />
              <span>Giao hàng tươi trong ngày • Đổi trả miễn phí</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
