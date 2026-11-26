'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Sparkles, Truck, User as UserIcon } from 'lucide-react';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import { useCart } from '@/hooks/use-cart';
import type { CategoryNode } from '@/types';
import { Logo } from './logo';
import { SearchBox } from './search-box';
import { Drawer } from '@/components/ui/overlay';
import { SmartImage } from '@/components/ui/misc';

export const NAV = [
  { href: '/products', label: 'Cửa hàng' },
  { href: '/combos', label: 'Combo' },
  { href: '/recipes', label: 'Công thức' },
  { href: '/meal-plan', label: 'Thực đơn 7 ngày' },
  { href: '/health', label: 'Hồ sơ sức khỏe' },
  { href: '/quiz', label: 'Quiz tư vấn' },
  { href: '/blog', label: 'Kiến thức' },
];

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => get<CategoryNode[]>('/categories'), staleTime: 300_000 });
}

function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const { data } = useCategories();
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex cursor-pointer items-center gap-2 rounded-full bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-700" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Menu className="h-4 w-4" /> Danh mục <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 pt-2">
          <div className="grid w-[min(860px,90vw)] animate-fade-up grid-cols-3 gap-6 rounded-2xl border border-line bg-white p-6 shadow-lift">
            {(data ?? []).map((c) => (
              <div key={c.id}>
                <Link href={`/products?category=${c.slug}`} onClick={() => setOpen(false)} className="group flex items-center gap-3">
                  <SmartImage src={c.imageUrl} alt={c.name} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
                  <span>
                    <span className="block font-semibold group-hover:text-forest-700">{c.name}</span>
                    <span className="text-xs text-muted">{c.productCount} sản phẩm</span>
                  </span>
                </Link>
                {c.children.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-l border-line pl-4">
                    {c.children.map((ch) => (
                      <li key={ch.id}>
                        <Link href={`/products?category=${ch.slug}`} onClick={() => setOpen(false)} className="flex justify-between text-sm text-ink/80 hover:text-forest-700">
                          {ch.name} <span className="text-xs text-muted">{ch.productCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unread = useQuery({ queryKey: ['notifications', 'count', user?.id], queryFn: () => get<{ unread: number }>('/account/notifications'), enabled: !!user, refetchInterval: 60_000 });
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!ready) return <div className="h-10 w-10 animate-pulse rounded-full bg-sand-100" />;
  if (!user)
    return (
      <Link href="/login" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-sand-100">
        <UserIcon className="h-5 w-5" /> <span className="hidden lg:inline">Đăng nhập</span>
      </Link>
    );
  const count = unread.data?.unread ?? 0;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative flex cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-1 hover:bg-sand-100" aria-expanded={open}>
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-forest-100 text-sm font-bold text-forest-700">
          {user.avatarUrl ? <SmartImage src={user.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 object-cover" /> : user.fullName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold lg:inline">{user.fullName.split(' ').slice(-1)[0]}</span>
        {count > 0 && <span className="absolute top-0 left-7 h-2.5 w-2.5 rounded-full bg-sale ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 animate-fade-up rounded-2xl border border-line bg-white p-2 shadow-lift">
          <div className="border-b border-line px-3 pt-2 pb-3">
            <div className="font-semibold">{user.fullName}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
            {user.loyalty && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-latte-500/10 px-2.5 py-1 text-xs font-semibold text-latte-700">
                <Sparkles className="h-3.5 w-3.5" /> {user.loyalty.tier} · {user.loyalty.pointsBalance} điểm
              </div>
            )}
          </div>
          {[
            { href: '/account', label: 'Tài khoản của tôi', icon: UserIcon },
            { href: '/account/orders', label: 'Đơn hàng', icon: Package },
            { href: '/account/wishlist', label: 'Yêu thích', icon: Heart },
            { href: '/account/notifications', label: `Thông báo${count ? ` (${count})` : ''}`, icon: Bell },
          ].map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-sand-50">
              <i.icon className="h-4 w-4 text-muted" /> {i.label}
            </Link>
          ))}
          {user.isStaff && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50">
              <LayoutDashboard className="h-4 w-4" /> Trang quản trị
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              setOpen(false);
              router.push('/');
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function CartButton() {
  const { data } = useCart();
  const openCart = useUi((s) => s.openCart);
  const count = data?.itemCount ?? 0;
  return (
    <button onClick={openCart} className="relative flex cursor-pointer items-center gap-2 rounded-full bg-ink px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 sm:px-4" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden sm:inline">Giỏ hàng</span>
      <span key={count} className={cn('flex h-5 min-w-5 animate-fade-in items-center justify-center rounded-full px-1 text-xs', count ? 'bg-latte-400 text-ink' : 'bg-white/20')}>{count}</span>
    </button>
  );
}

export function Header() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenu } = useUi();
  const { data: cats } = useCategories();
  const user = useAuth((s) => s.user);
  useEffect(() => setMobileMenu(false), [pathname, setMobileMenu]);

  return (
    <header className="sticky top-0 z-40 no-print">
      <div className="bg-forest-800 text-[13px] text-white/90">
        <div className="container-page flex h-9 items-center justify-center gap-6 sm:justify-between">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-latte-300" /> Miễn phí giao hàng cho đơn từ 300.000₫ · Giao nhanh 2h nội thành TP.HCM
          </span>
          <span className="hidden items-center gap-5 sm:flex">
            <Link href="/track-order" className="hover:text-white">Tra cứu đơn hàng</Link>
            <Link href="/pages/huong-dan-mua-hang" className="hover:text-white">Hướng dẫn mua hàng</Link>
            <span>Hotline <b>1900 6868</b></span>
          </span>
        </div>
      </div>
      <div className="border-b border-line bg-cream/95 backdrop-blur">
        <div className="container-page flex h-[72px] items-center gap-3 lg:gap-6">
          <button className="cursor-pointer rounded-full p-2 hover:bg-sand-100 lg:hidden" onClick={() => setMobileMenu(true)} aria-label="Mở menu">
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
          <SearchBox className="mx-auto hidden max-w-xl flex-1 md:block" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
            <Link href="/account/wishlist" className="hidden rounded-full p-2.5 text-ink/80 hover:bg-sand-100 sm:block" aria-label="Yêu thích">
              <Heart className="h-5 w-5" />
            </Link>
            <AccountMenu />
            <CartButton />
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <SearchBox />
        </div>
        <nav className="hidden border-t border-line/70 lg:block">
          <div className="container-page flex h-12 items-center gap-1">
            <CategoryMenu />
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn('rounded-full px-3.5 py-2 text-sm font-medium transition', pathname.startsWith(n.href) ? 'bg-forest-50 text-forest-700' : 'text-ink/80 hover:text-forest-700')}>
                {n.label}
              </Link>
            ))}
            <Link href="/products?onSale=true" className="ml-auto rounded-full px-3.5 py-2 text-sm font-semibold text-sale hover:bg-sale/10">
              🔥 Khuyến mãi
            </Link>
          </div>
        </nav>
      </div>

      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenu(false)} side="left" title={<span>Menu</span>} width="max-w-xs">
        <div className="space-y-6 p-5">
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" className="rounded-xl bg-forest-600 py-2.5 text-center text-sm font-semibold text-white">Đăng nhập</Link>
              <Link href="/register" className="rounded-xl border border-line bg-white py-2.5 text-center text-sm font-semibold">Đăng ký</Link>
            </div>
          )}
          <ul className="space-y-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-white">{n.label}</Link>
              </li>
            ))}
            <li><Link href="/track-order" className="block rounded-xl px-3 py-2.5 font-medium hover:bg-white">Tra cứu đơn hàng</Link></li>
            <li><Link href="/compare" className="block rounded-xl px-3 py-2.5 font-medium hover:bg-white">So sánh sản phẩm</Link></li>
          </ul>
          <div>
            <div className="mb-2 text-xs font-semibold text-muted uppercase">Danh mục</div>
            {(cats ?? []).map((c) => (
              <div key={c.id} className="mb-2">
                <Link href={`/products?category=${c.slug}`} className="block px-3 py-1.5 font-semibold">{c.name}</Link>
                {c.children.map((ch) => (
                  <Link key={ch.id} href={`/products?category=${ch.slug}`} className="block px-6 py-1 text-sm text-ink/80">{ch.name}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Drawer>
    </header>
  );
}
