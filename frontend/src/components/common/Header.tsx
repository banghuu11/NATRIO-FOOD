'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, User, Heart, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

interface HeaderProps {
  onOpenCart?: () => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function Header({
  onOpenCart,
  activeFilter = 'all',
  onFilterChange,
  searchQuery = '',
  onSearchChange,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalCalories = useCartStore((state) => state.getTotalCalories());
  const totalItems = useCartStore((state) => state.getTotalItems());

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'eat_clean', label: 'Eat Clean' },
    { id: 'keto', label: 'Keto' },
    { id: 'vegan', label: 'Thuần Chay' },
    { id: 'gluten_free', label: 'Không Gluten' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#EFE8DE] transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. Brand Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-[#3D5A45]">
              NUTRIO
            </span>
          </Link>

          {/* 2. Middle Search Bar & Diet Filters */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl mx-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#EFE8DE] rounded-full text-sm text-[#2C3E30] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5F7E66]/40 focus:border-[#5F7E66] shadow-2xs transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {filters.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onFilterChange && onFilterChange(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-[#5F7E66] text-white shadow-sm'
                        : 'bg-white text-[#2C3E30] border border-[#EFE8DE] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* User Profile */}
            <Link
              href="/admin/dashboard"
              className="p-2 text-[#3D5A45] hover:bg-white rounded-full transition-colors"
              title="Tài khoản / Quản trị"
            >
              <User className="w-5 h-5 stroke-[1.8]" />
            </Link>

            {/* Wishlist Heart */}
            <button
              type="button"
              className="p-2 text-[#3D5A45] hover:bg-white rounded-full transition-colors cursor-pointer"
              title="Yêu thích"
            >
              <Heart className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Cart Pill with Total Calories (Caramel Brown) */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C5853B] hover:bg-[#B4752E] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              <span>
                {totalCalories > 0
                  ? `${totalCalories.toLocaleString('vi-VN')} kcal`
                  : '2,450 kcal'}
              </span>
              {totalItems > 0 && (
                <span className="bg-white text-[#C5853B] text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#3D5A45] hover:bg-white rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Filters */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#EFE8DE] space-y-3">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#EFE8DE] rounded-full text-sm text-[#2C3E30]"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (onFilterChange) onFilterChange(f.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-[#5F7E66] text-white'
                        : 'bg-white text-[#2C3E30] border border-[#EFE8DE]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
