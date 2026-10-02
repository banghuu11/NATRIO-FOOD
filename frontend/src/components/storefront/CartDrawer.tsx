'use client';

import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
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
  const targetCalories = useHealthStore((state) => state.profile.targetCalories || 2000);

  if (!isOpen) return null;

  const totalCalories = getTotalCalories();
  const totalPrice = getTotalPrice();
  const caloPercentage = Math.min(100, Math.round((totalCalories / targetCalories) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Giỏ Hàng Dinh Dưỡng</h2>
              <p className="text-xs text-slate-500">{items.length} món trong giỏ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Cart Nutrition Widget */}
        <div className="bg-emerald-950 text-white p-4 border-b border-emerald-900 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-emerald-300">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              Tổng Calo Giỏ Hàng Realtime:
            </span>
            <span className="font-extrabold text-sm text-white">
              {totalCalories} / {targetCalories} kcal ({caloPercentage}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-emerald-900/80 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-lime-400 h-full transition-all duration-300"
              style={{ width: `${caloPercentage}%` }}
            />
          </div>

          {/* Macro Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] text-emerald-200">
            <div className="bg-white/10 rounded-md py-1">
              Đạm: <strong className="text-white">{getTotalProtein()}g</strong>
            </div>
            <div className="bg-white/10 rounded-md py-1">
              Carb: <strong className="text-white">{getTotalCarbs()}g</strong>
            </div>
            <div className="bg-white/10 rounded-md py-1">
              Béo: <strong className="text-white">{getTotalFat()}g</strong>
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Giỏ hàng của bạn đang trống</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Hãy khám phá các món ăn Eat-Clean và thực phẩm giàu dinh dưỡng của NUTRIO nhé.
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div 
                key={product.id}
                className="flex gap-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-100"
              >
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-18 h-18 rounded-xl object-cover shrink-0 border border-slate-200"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {product.calories * quantity} kcal • {product.protein * quantity}g Protein
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {(product.price * quantity).toLocaleString('vi-VN')}₫
                    </span>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Tạm tính:</span>
              <span className="text-lg font-black text-slate-900">
                {totalPrice.toLocaleString('vi-VN')}₫
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Được kiểm tra hàng trước khi nhận & Hoàn tiền nếu không tươi</span>
            </div>

            <button
              type="button"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
