'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  User,
  Bell,
  ShoppingCart,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Package,
  Truck,
  CheckCircle2,
  Gift,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { removeVietnameseTones } from '@/lib/utils';

interface HeaderProps {
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  hideSearch?: boolean;
  isOverlay?: boolean;
}

export default function Header({
  onOpenCart,
  searchQuery = '',
  onSearchChange,
  hideSearch,
  isOverlay,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const shouldHideSearch = hideSearch ?? false;
  const shouldOverlay = isOverlay ?? isHomePage;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ================= NOTIFICATIONS STATE (Đơn hàng & Hệ thống) =================
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'orders' | 'system'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'order' as const,
      title: 'Đơn hàng #NUTRIO-2026-9812 đã tạo thành công!',
      message: 'NUTRIO đang chuẩn bị đóng gói hạt dinh dưỡng sấy mộc 60°C và bàn giao cho đơn vị vận chuyển.',
      time: '15 phút trước',
      isRead: false,
      link: '/checkout/success?orderCode=NUTRIO-2026-9812',
    },
    {
      id: 'notif-2',
      type: 'system' as const,
      title: 'Chào mừng bạn đến với NUTRIO Food!',
      message: 'Khám phá thế giới hạt mộc tự nhiên giữ trọn 100% tinh chất quý giá và dưỡng chất lành tính.',
      time: '1 giờ trước',
      isRead: false,
      link: '/products',
    },
    {
      id: 'notif-3',
      type: 'system' as const,
      title: 'Mã ưu đãi 10%: WELCOME10',
      message: 'Nhận ngay ưu đãi 10% cho đơn hàng đầu tiên của bạn. Nhập mã tại bước thanh toán.',
      time: '3 giờ trước',
      isRead: false,
      link: '/products',
    },
    {
      id: 'notif-4',
      type: 'order' as const,
      title: 'Đang vận chuyển kiện hàng #NUTRIO-2026-8874',
      message: 'Gói hàng dinh dưỡng đang trên đường giao đến địa chỉ nhận của bạn. Dự kiến giao hôm nay.',
      time: 'Hôm qua',
      isRead: true,
      link: '/checkout/success?orderCode=NUTRIO-2026-8874',
    },
    {
      id: 'notif-5',
      type: 'system' as const,
      title: 'Chứng nhận chất lượng OCOP & VietGAP 2026',
      message: '100% hạt điều Bình Phước và macca Đắk Lắk đạt chuẩn OCOP 4 sao và tiêu chuẩn xuất khẩu.',
      time: '3 ngày trước',
      isRead: true,
      link: '/products',
    },
  ]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const orderNotifs = useMemo(() => {
    return notifications.filter((n) => n.type === 'order');
  }, [notifications]);

  const systemNotifs = useMemo(() => {
    return notifications.filter((n) => n.type === 'system');
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (notificationTab === 'orders') return orderNotifs;
    if (notificationTab === 'system') return systemNotifs;
    return notifications;
  }, [notificationTab, notifications, orderNotifs, systemNotifs]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setIsNotificationOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const POPULAR_SEARCHES = [
    'Hạt điều',
    'Macca',
    'Hạt óc chó',
    'Granola mộc',
    'Hạnh nhân sấy',
    'Hạt chia',
    'Yến mạch cán dẹt',
    'Ức gà áp chảo',
    'Eat Clean',
  ];

  const ALL_SUGGESTED_PRODUCTS = [
    {
      id: 8,
      name: 'Hạt Điều Bình Phước Rang Củi',
      slug: 'hat-dieu-binh-phuoc',
      price: 185000,
      unit: '500g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 7,
      name: 'Hạt Macca Tây Nguyên Nứt Vỏ',
      slug: 'macca-nut-vo',
      price: 165000,
      unit: '500g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 9,
      name: 'Hạt Óc Chó Vàng Chandler Mỹ',
      slug: 'hat-oc-cho-my',
      price: 195000,
      unit: '450g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 2,
      name: 'Hạt Hạnh Nhân Sấy Mộc Mỹ',
      slug: 'hanh-nhan-rang',
      price: 129000,
      unit: '250g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 6,
      name: 'NUTRIO Granola Siêu Hạt Mộc',
      slug: 'granola-khong-duong',
      price: 159000,
      unit: '400g',
      category: 'Snack & Granola',
      image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 1,
      name: 'Hạt Chia Hữu Cơ Nhập Khẩu',
      slug: 'hat-chia',
      price: 95000,
      unit: '200g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 3,
      name: 'Yến Mạch Cán Dẹt Tươi',
      slug: 'yen-mach-can-det',
      price: 89000,
      unit: '500g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 10,
      name: 'Hạt Bí Xanh Ấn Độ Sấy Mộc',
      slug: 'hat-bi-xanh-an-do',
      price: 135000,
      unit: '500g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 11,
      name: 'Hạt Dinh Dưỡng Thập Cẩm Eat Clean',
      slug: 'hat-dinh-duong-mix',
      price: 210000,
      unit: '500g',
      category: 'Hạt & Ngũ Cốc',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 13,
      name: 'Sữa Hạt Điều Hạnh Nhân Nguyên Chất',
      slug: 'sua-hat-dieu-hanh-nhan',
      price: 85000,
      unit: '1 Lít',
      category: 'Sữa Hạt & Đồ Uống',
      image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 4,
      name: 'Sữa Hạt Óc Chó Không Đường',
      slug: 'sua-oc-cho-khong-duong',
      price: 79000,
      unit: '1 Lít',
      category: 'Sữa Hạt & Đồ Uống',
      image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 5,
      name: 'Ức Gà Áp Chảo Tiêu Đen Clean',
      slug: 'uc-ga-ap-chao',
      price: 65000,
      unit: '200g',
      category: 'Đạm Sạch Eat Clean',
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 15,
      name: 'Salad Ức Gà Sốt Mè Rang',
      slug: 'salad-uc-ga-sot-me-rang',
      price: 75000,
      unit: '300g',
      category: 'Đạm Sạch Eat Clean',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 16,
      name: 'Thịt Bò Áp Chảo Măng Tây Clean',
      slug: 'thit-bo-ap-chao-clean',
      price: 110000,
      unit: '250g',
      category: 'Đạm Sạch Eat Clean',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const filteredSuggestedProducts = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SUGGESTED_PRODUCTS.slice(0, 4);
    const rawQ = searchQuery.toLowerCase().trim();
    const cleanQ = removeVietnameseTones(searchQuery);
    const matches = ALL_SUGGESTED_PRODUCTS.filter((p) => {
      const rawName = p.name.toLowerCase();
      const cleanName = removeVietnameseTones(p.name);
      const rawCat = p.category.toLowerCase();
      const cleanCat = removeVietnameseTones(p.category);
      return (
        rawName.includes(rawQ) ||
        cleanName.includes(cleanQ) ||
        rawCat.includes(rawQ) ||
        cleanCat.includes(cleanCat)
      );
    });
    return matches.slice(0, 5);
  }, [searchQuery]);

  const handleSelectSuggestion = (text: string) => {
    if (onSearchChange) {
      onSearchChange(text);
    }
    setIsSearchSuggestionsOpen(false);
    router.push(`/products?search=${encodeURIComponent(text)}`);
  };

  const totalCalories = useCartStore((state) => state.getTotalCalories());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchSuggestionsOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <header
      className={`sticky top-0 z-50 transition-all duration-200 relative ${
        shouldOverlay ? '-mb-20' : ''
      }`}
    >
      {/* 1. LỚP NỀN KÍNH MỜ (Được cách ly 100% để chỉ làm mờ ảnh nền đằng sau) */}
      <div
        className="absolute inset-0 header-glass-blur pointer-events-none transition-colors duration-200"
        style={{
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          backgroundColor: shouldOverlay
            ? isDark
              ? 'rgba(9, 13, 22, 0.65)'
              : 'rgba(255, 255, 255, 0.55)'
            : isDark
            ? 'rgba(9, 13, 22, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          borderBottom: shouldOverlay
            ? isDark
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid rgba(255, 255, 255, 0.35)'
            : isDark
            ? '1px solid rgba(30, 41, 59, 0.60)'
            : '1px solid rgba(226, 232, 240, 0.60)',
        }}
      />

      {/* 2. LỚP NỘI DUNG SẮC NÉT (Logo, Menu, Nút bấm không bị ảnh hưởng bởi bộ lọc mờ) */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 header-content-crisp">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. CỤC BÊN TRÁI: LOGO (GIỮ NGUYÊN & SẮC NÉT) */}
          <Link href="/" className="flex items-center gap-1 shrink-0 group">
            <span className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-emerald-800 dark:text-emerald-400 group-hover:text-emerald-700 transition-colors drop-shadow-2xs">
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
                    className={`text-sm font-extrabold transition-all relative py-1 ${
                      isActive
                        ? 'text-emerald-800 dark:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-emerald-400 after:scale-x-100'
                        : 'text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Thanh Tìm Kiếm mở rộng mặc định kèm Popup gợi ý tìm kiếm */}
            {!shouldHideSearch && (
              <div ref={searchContainerRef} className="relative flex items-center">
                <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-1.5 shadow-2xs w-52 sm:w-64 focus-within:w-64 sm:focus-within:w-72 focus-within:border-emerald-600/60 dark:focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-600/10 transition-all duration-300">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchSuggestionsOpen(true)}
                    onChange={(e) => {
                      if (onSearchChange) onSearchChange(e.target.value);
                      setIsSearchSuggestionsOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsSearchSuggestionsOpen(false);
                      }
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setIsSearchSuggestionsOpen(false);
                        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    placeholder="Tìm kiếm..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSearchChange) onSearchChange('');
                        setIsSearchSuggestionsOpen(false);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 text-xs cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* DROPDOWN GỢI Ý TÌM KIẾM (AUTOCOMPLETE SUGGESTIONS) */}
                {isSearchSuggestionsOpen && (
                  <div className="absolute top-full mt-2 right-0 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* 1. Từ khóa tìm kiếm phổ biến */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Tìm kiếm phổ biến</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((keyword, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectSuggestion(keyword)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/70 dark:border-slate-700 transition cursor-pointer"
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Sản phẩm gợi ý */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        
                        <span>Sản phẩm gợi ý</span>
                      </div>
                      <div className="space-y-1">
                        {filteredSuggestedProducts.map((p) => (
                          <button
                            key={p.slug}
                            type="button"
                            onClick={() => handleSelectSuggestion(p.name)}
                            className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-left group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {p.category} • {p.unit}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white shrink-0 ml-2">
                              {p.price.toLocaleString('vi-VN')}₫
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
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

            {/* User Profile / Auth Area */}
            {mounted && (
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated && user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/40 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      title={user.fullName || user.email}
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-700 dark:bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {(user.fullName || user.email)[0].toUpperCase()}
                      </div>
                      <span className="hidden sm:inline-block text-xs font-bold max-w-[100px] truncate">
                        {user.fullName || user.email.split('@')[0]}
                      </span>
                    </button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header Profile Info */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {user.fullName || 'Thành viên'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {user.email}
                          </div>
                          <div className="mt-2">
                            {isAdmin() ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Quản Trị Viên (Admin)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <span>Khách Hàng Thành Viên</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Menu Actions */}
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            <User className="w-4 h-4 text-emerald-600" />
                            <span>Hồ sơ & Cài đặt (Profile Settings)</span>
                          </Link>

                          {isAdmin() && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-800 dark:hover:text-emerald-400 transition"
                            >
                              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                              <span>Cổng Quản Trị (Admin Portal)</span>
                            </Link>
                          )}

                          <Link
                            href="/products"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            <ShoppingCart className="w-4 h-4 text-slate-400" />
                            <span>Khám phá thực đơn</span>
                          </Link>
                        </div>

                        {/* Logout Button */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Đăng xuất tài khoản</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="p-2 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/40 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center"
                    title="Đăng nhập tài khoản"
                  >
                    <User className="w-5 h-5 stroke-[2]" />
                  </Link>
                )}
              </div>
            )}

            {/* Notifications Dropdown (Thông báo Đơn hàng & Hệ thống) */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                  isNotificationOpen
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-slate-800'
                    : 'text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/40 dark:hover:bg-slate-800'
                }`}
                title="Thông báo"
              >
                <Bell className="w-5 h-5 stroke-[2]" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Notification Header */}
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">Thông Báo</span>
                      {unreadNotificationCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {unreadNotificationCount} mới
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Đọc tất cả</span>
                      </button>
                    )}
                  </div>

                  {/* Tabs: Tất cả | Đơn hàng | Hệ thống */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-bold px-3 pt-2 bg-white dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setNotificationTab('all')}
                      className={`pb-2 px-2.5 border-b-2 transition-all cursor-pointer ${
                        notificationTab === 'all'
                          ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationTab('orders')}
                      className={`pb-2 px-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                        notificationTab === 'orders'
                          ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Đơn hàng</span>
                      <span className="text-[10px] px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                        {orderNotifs.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationTab('system')}
                      className={`pb-2 px-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                        notificationTab === 'system'
                          ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Hệ thống</span>
                      <span className="text-[10px] px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                        {systemNotifs.length}
                      </span>
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Không có thông báo nào trong mục này
                      </div>
                    ) : (
                      displayedNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 cursor-pointer ${
                            !notif.isRead ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                              notif.type === 'order'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                            }`}
                          >
                            {notif.type === 'order' ? (
                              <Package className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h5 className={`text-xs truncate ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                {notif.title}
                              </h5>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Notification Footer */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
                    <Link
                      href="/profile"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Xem lịch sử & tài khoản của bạn →
                    </Link>
                  </div>
                </div>
              )}
            </div>

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
                  : 'Giỏ hàng'}
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

            {!shouldHideSearch && (
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setIsMobileMenuOpen(false);
                      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-800 dark:text-slate-100"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
