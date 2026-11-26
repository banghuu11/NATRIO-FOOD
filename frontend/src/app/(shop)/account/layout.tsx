'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bell, Gift, Heart, HeartPulse, MapPin, MessageSquareText, Package, Repeat, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { Spinner } from '@/components/ui/feedback';
import { SmartImage } from '@/components/ui/misc';

const LINKS = [
  { href: '/account', label: 'Thông tin tài khoản', icon: User, exact: true },
  { href: '/account/orders', label: 'Đơn hàng của tôi', icon: Package },
  { href: '/account/subscriptions', label: 'Giao hàng định kỳ', icon: Repeat },
  { href: '/account/wishlist', label: 'Sản phẩm yêu thích', icon: Heart },
  { href: '/account/reviews', label: 'Đánh giá của tôi', icon: MessageSquareText },
  { href: '/account/loyalty', label: 'Điểm thưởng & voucher', icon: Gift },
  { href: '/account/addresses', label: 'Sổ địa chỉ', icon: MapPin },
  { href: '/account/notifications', label: 'Thông báo', icon: Bell },
  { href: '/health', label: 'Hồ sơ sức khỏe', icon: HeartPulse },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);
  if (!ready || !user) return <Spinner className="py-32" />;

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-forest-100 text-lg font-bold text-forest-700">
            {user.avatarUrl ? <SmartImage src={user.avatarUrl} alt="" width={48} height={48} className="h-12 w-12 object-cover" /> : user.fullName.charAt(0)}
          </span>
          <div className="min-w-0"><div className="truncate font-semibold">{user.fullName}</div><div className="text-xs font-semibold text-latte-600">{user.loyalty?.tier ?? 'Bronze'} · {user.loyalty?.pointsBalance ?? 0} điểm</div></div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-2 lg:flex-col">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={cn('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap', active ? 'bg-forest-50 text-forest-700' : 'text-ink/80 hover:bg-sand-50')}>
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
