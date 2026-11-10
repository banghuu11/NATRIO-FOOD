'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  ShoppingBag,
  TicketPercent,
  Users,
  BarChart3,
  LogOut,
  Bell,
  Search,
  Nut,
  Sparkles,
  ShieldAlert,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [fefoAlertCount, setFefoAlertCount] = useState<number>(0);
  const [pendingOrderCount, setPendingOrderCount] = useState<number>(0);

  useEffect(() => {
    // 1. Kiểm tra xác thực & phân quyền Admin
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token && !isAuthenticated) {
      // Chưa đăng nhập -> Chuyển hướng tới login
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    setCheckingAuth(false);

    // 2. Tải chỉ số quản trị nếu là admin
    async function loadAdminStats() {
      try {
        const stats = await dashboardService.getStats();
        if (stats?.fefoAlerts?.critical !== undefined) {
          setFefoAlertCount(stats.fefoAlerts.critical);
        }
        if (stats?.orders?.pending !== undefined) {
          setPendingOrderCount(stats.orders.pending);
        }
      } catch (err) {
        console.error('Không thể tải chỉ số header admin:', err);
      }
    }

    if (isAdmin()) {
      loadAdminStats();
    }
  }, [isAuthenticated, pathname, router, isAdmin]);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    router.push('/login');
  };

  // Trạng thái đang kiểm tra phiên làm việc
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Đang xác thực quyền quản trị...</p>
      </div>
    );
  }

  // Phân quyền: Đã đăng nhập nhưng KHÔNG CÓ QUYỀN ADMIN (ví dụ role customer)
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <Badge variant="destructive" className="uppercase tracking-widest text-[10px] mb-2">
              403 Forbidden • Từ Chối Truy Cập
            </Badge>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Không Đủ Thẩm Quyền Truy Cập
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Tài khoản <strong>{user?.email || 'hiện tại'}</strong> có vai trò{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user?.roles?.join(', ') || 'Khách Hàng'}
              </span>
              , không có quyền truy cập Cổng Quản Trị (Admin Portal).
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button asChild className="w-full h-10 font-bold">
              <Link href="/">
                <span>Về Trang Chủ Cửa Hàng</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="w-full h-10 font-bold"
            >
              Đăng Nhập Tài Khoản Khác
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Sản phẩm & Dinh dưỡng', href: '/admin/products', icon: Package },
    { name: 'Banner & Mô Hình 3D', href: '/admin/banner-config', icon: Sparkles, badge: 'Mới' },
    {
      name: 'Kho FEFO & Lô Hàng',
      href: '/admin/inventory-fefo',
      icon: CalendarClock,
      badge: fefoAlertCount > 0 ? `${fefoAlertCount} Cận Date` : undefined,
    },
    {
      name: 'Đơn hàng & Vận chuyển',
      href: '/admin/orders',
      icon: ShoppingBag,
      badge: pendingOrderCount > 0 ? `${pendingOrderCount} Mới` : undefined,
    },
    { name: 'Khuyến mãi & Flash Sale', href: '/admin/promotions', icon: TicketPercent },
    { name: 'Khách hàng & Hội viên', href: '/admin/users', icon: Users },
    { name: 'Báo cáo Doanh thu', href: '/admin/analytics', icon: BarChart3 },
  ];

  const userInitials = (user?.fullName || 'Admin')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 z-50 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Nut className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-black text-base tracking-wide flex items-center gap-1.5">
              NUTRIO <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Admin</span>
            </div>
            <div className="text-[11px] text-slate-500">Healthy Food Portal</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Quick Storefront link & User Info */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xem Cửa Hàng (Storefront)</span>
          </Link>
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {user?.fullName || 'Quản Trị Viên'}
                </div>
                <div className="text-[10px] text-emerald-400 truncate">
                  {user?.email || 'admin@nutrio.vn'}
                </div>
              </div>
            </div>
            <button
              type="button"
              title="Đăng xuất"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Body Content */}
      <div className="flex-1 flex flex-col pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã đơn, lô hàng FEFO, tên sản phẩm..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Warning Pill */}
            {fefoAlertCount > 0 && (
              <Link
                href="/admin/inventory-fefo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>{fefoAlertCount} Lô Hàng Cận Date (&lt; 15 Ngày)</span>
              </Link>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
