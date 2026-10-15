'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User, Heart, ShoppingCart, Menu, X, Sun, Moon } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

interface HeaderProps {
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function Header({
  onOpenCart,
  searchQuery = '',
  onSearchChange,
}: HeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const totalCalories = useCartStore((state) => state.getTotalCalories());
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { label: 'Trang Chủ', href: '/' },
    { label: 'Sản Phẩm', href: '/products' },
    { label: 'Về Nutrio', href: '/about' },
    { label: 'Liên Hệ', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. CỤC BÊN TRÁI: LOGO (GIỮ NGUYÊN) */}
          <Link href="/" className="flex items-center gap-1 shrink-0 group">
            <span className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-emerald-800 dark:text-emerald-400 group-hover:text-emerald-700 transition-colors">
              NUTRIO
            </span>
          </Link>

          {/* 2. CỤC Ở GIỮA: TRANG CHỦ, SẢN PHẨM, VỀ NUTRIO, LIÊN HỆ & NÚT TÌM KIẾM */}
          <div className="hidden lg:flex items-center gap-7 flex-1 justify-center max-w-2xl mx-auto">
            {/* Navigation Links (Mỗi cái là 1 page riêng biệt) */}
            <nav className="flex items-center gap-7">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-bold transition-all relative py-1 ${
                      isActive
                        ? 'text-emerald-800 dark:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-emerald-400 after:scale-x-100'
                        : 'text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Nút & Thanh Tìm Kiếm */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs w-60 animate-in fade-in zoom-in duration-200">
                  <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    placeholder="Tìm granola, macca..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                  title="Tìm kiếm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. CỤC BÊN PHẢI: THEME TOGGLE, USER, WISHLIST, GIỎ HÀNG (GIỮ NGUYÊN) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-400 stroke-[2] animate-in fade-in zoom-in duration-200" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-700 stroke-[2] animate-in fade-in zoom-in duration-200" />
                )}
              </button>
            )}

            {/* User Profile */}
            <Link
              href="/admin/dashboard"
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Tài khoản / Quản trị"
            >
              <User className="w-5 h-5 stroke-[1.8]" />
            </Link>

            {/* Wishlist Heart */}
            <button
              type="button"
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
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
              className="lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation & Search */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm font-bold py-1.5 ${
                      isActive
                        ? 'text-emerald-800 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300 hover:text-emerald-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-800 dark:text-slate-100"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
