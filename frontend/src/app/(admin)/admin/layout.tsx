'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Boxes, ExternalLink, FolderTree, Inbox, LayoutDashboard, LogOut, Megaphone, Menu, MessageSquareText, Newspaper, Package, ShieldCheck, ShoppingCart, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { Logo } from '@/components/layout/logo';
import { Spinner } from '@/components/ui/feedback';

const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, perm: 'dashboard.view', exact: true },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart, perm: 'order.read' },
  { href: '/admin/products', label: 'Sản phẩm', icon: Package, perm: 'product.read' },
  { href: '/admin/categories', label: 'Danh mục', icon: FolderTree, perm: 'product.read' },
  { href: '/admin/inventory', label: 'Kho hàng', icon: Boxes, perm: 'inventory.manage' },
  { href: '/admin/customers', label: 'Khách hàng', icon: Users, perm: 'customer.read' },
  { href: '/admin/promotions', label: 'Khuyến mãi', icon: Megaphone, perm: 'coupon.manage' },
  { href: '/admin/reviews', label: 'Đánh giá', icon: MessageSquareText, perm: 'review.moderate' },
  { href: '/admin/content', label: 'Nội dung', icon: Newspaper, perm: 'content.manage' },
  { href: '/admin/contacts', label: 'Yêu cầu tư vấn', icon: Inbox, perm: 'customer.read' },
  { href: '/admin/reports', label: 'Báo cáo', icon: BarChart3, perm: 'report.view' },
  { href: '/admin/staff', label: 'Nhân viên & quyền', icon: ShieldCheck, perm: 'user.manage' },
];

const ROLE_LABEL: Record<string, string> = { admin: 'Super Admin', staff_sales: 'Nhân viên bán hàng', staff_warehouse: 'Nhân viên kho', staff_support: 'Nhân viên CSKH' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // The mobile drawer is open only for the route it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) return <Spinner className="h-screen" />;
  if (!user.isStaff)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
        <ShieldCheck className="h-12 w-12 text-danger" />
        <h1 className="text-2xl">Bạn không có quyền truy cập trang quản trị</h1>
        <Link href="/" className="font-semibold text-forest-700 underline">Về trang chủ</Link>
      </div>
    );

  const nav = ADMIN_NAV.filter((n) => can(n.perm));
  const current = ADMIN_NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));
  const allowed = !current || can(current.perm);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Logo light href="/admin" />
        <button className="cursor-pointer text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', active ? 'bg-white text-forest-800' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
              <n.icon className="h-4.5 w-4.5" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10"><ExternalLink className="h-4 w-4" /> Xem cửa hàng</Link>
        <button onClick={() => { logout(); router.push('/login'); }} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10"><LogOut className="h-4 w-4" /> Đăng xuất</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 bg-forest-900 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-forest-900">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="cursor-pointer rounded-lg p-2 hover:bg-sand-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
          <div className="text-sm font-semibold">{current?.label ?? 'Quản trị'}</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right"><div className="text-sm font-semibold">{user.fullName}</div><div className="text-xs text-muted">{user.roles.filter((r) => ROLE_LABEL[r]).map((r) => ROLE_LABEL[r]).join(', ')}</div></div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 font-bold text-forest-700">{user.fullName.charAt(0)}</span>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          {allowed ? children : (
            <div className="rounded-2xl border border-line bg-white p-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-danger" /><p className="mt-3 font-semibold">Vai trò của bạn không có quyền truy cập mục này.</p></div>
          )}
        </main>
      </div>
    </div>
  );
}
