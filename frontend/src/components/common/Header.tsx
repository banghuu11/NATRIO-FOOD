'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Leaf, 
  Search, 
  ShoppingBag, 
  Activity, 
  User, 
  Menu, 
  X,
  Sparkles,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useHealthStore } from '@/stores/useHealthStore';

interface HeaderProps {
  onOpenCart?: () => void;
  onOpenHealthModal?: () => void;
}

export default function Header({ onOpenCart, onOpenHealthModal }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = useCartStore((state) => state.getTotalItems());
  const profile = useHealthStore((state) => state.profile);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 text-white transition-all duration-300">
      {/* Top Banner Thông Điệp Sức Khỏe Trong Suốt */}
      <div className="bg-emerald-950/60 border-b border-white/10 text-slate-200 text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>🌰 Miễn phí vận chuyển cho đơn hàng từ <strong>299.000đ</strong> | 100% Hạt Sấy Mộc Tự Nhiên Không Tẩm Đường</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. Logo Thương hiệu */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                NUTRIO<span className="text-amber-400">.</span>
              </span>
              <span className="block text-[10px] font-bold tracking-wider text-emerald-300 uppercase -mt-1">
                Premium Nuts & Granola
              </span>
            </div>
          </Link>

          {/* 2. Thanh Tìm kiếm Trong Suốt */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm hạt macca, hạnh nhân, óc chó, granola, bơ hạt..."
                className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-full text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 focus:bg-white/15 transition-all backdrop-blur-md"
              />
              <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 3. Action Buttons & Health Profile Widget */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Health Target Indicator */}
            <button
              onClick={onOpenHealthModal}
              className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold hover:bg-white/20 hover:border-emerald-400/50 transition-all cursor-pointer backdrop-blur-md"
              title="Xem & Tùy chỉnh hồ sơ sức khỏe"
            >
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Mục tiêu: {profile.targetCalories || 2200} kcal/ngày</span>
            </button>

            {/* Nút Giỏ Hàng với Badge Realtime */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2.5 text-white hover:text-emerald-300 hover:bg-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-sm"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-scale shadow-md">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Tài khoản */}
            <button
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Tài khoản</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 4. Navigation Links Bar Trong Suốt */}
        <nav className="hidden md:flex items-center gap-8 py-2.5 border-t border-white/10 text-sm font-semibold text-slate-200">
          <Link href="/" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
            Trang Chủ
          </Link>
          <a href="#products" className="hover:text-emerald-300 transition-colors">
            Danh Mục Hạt Dinh Dưỡng
          </a>
          <a href="#health-calculator" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
            <span>Tính BMI & Calo (TDEE)</span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">Hot</span>
          </a>
          <a href="#meal-plan" className="hover:text-emerald-300 transition-colors">
            Khẩu Phần 7 Ngày
          </a>
          <a href="#origin" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nguồn Gốc & Chứng Nhận</span>
          </a>
        </nav>
      </div>

      {/* Mobile Drawer Navigation Trong Suốt */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <div className="relative w-full mb-3">
            <input
              type="text"
              placeholder="Tìm hạt dinh dưỡng..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-200">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-emerald-400">
              Trang Chủ
            </Link>
            <a href="#products" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-emerald-300">
              Danh Mục Sản Phẩm
            </a>
            <a href="#health-calculator" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-emerald-300">
              Máy Tính BMI & TDEE
            </a>
            <a href="#meal-plan" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-emerald-300">
              Khẩu Phần 7 Ngày
            </a>
            <a href="#origin" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-emerald-300">
              Truy Xuất Nguồn Gốc
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
