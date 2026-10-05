'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Sản phẩm & Dinh dưỡng', href: '/admin/products', icon: Package },
  { name: 'Banner & Mô Hình 3D', href: '/admin/banner-config', icon: Sparkles, badge: 'Mới' },
  { name: 'Kho FEFO & Lô Hàng', href: '/admin/inventory-fefo', icon: CalendarClock, badge: '2 Cận Date' },
  { name: 'Đơn hàng & Vận chuyển', href: '/admin/orders', icon: ShoppingBag, badge: '5 Mới' },
  { name: 'Khuyến mãi & Flash Sale', href: '/admin/promotions', icon: TicketPercent },
  { name: 'Khách hàng & Hội viên', href: '/admin/users', icon: Users },
  { name: 'Báo cáo Doanh thu', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Storefront Link */}
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
                AD
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Quản Trị Viên</div>
                <div className="text-[10px] text-emerald-400">admin@nutrio.vn</div>
              </div>
            </div>
            <button
              type="button"
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 transition"
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>2 Lô Hàng Sắp Hết Hạn (&lt; 15 Ngày)</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
