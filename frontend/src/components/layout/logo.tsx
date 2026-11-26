import Link from 'next/link';
import { cn } from '@/lib/utils';

/** NUTRIO wordmark: a leaf-shaped nut mark + serif wordmark. */
export function Logo({ className, light = false, href = '/' }: { className?: string; light?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2', className)} aria-label="NUTRIO Food – Trang chủ">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6" aria-hidden>
        <circle cx="20" cy="20" r="19" fill={light ? '#ffffff' : '#2f6139'} />
        <path d="M20 9c-6.5 0-10.5 5.4-10.5 11.6C9.5 27 14 31.5 20 31.5S30.5 27 30.5 20.6C30.5 14.4 26.5 9 20 9Z" fill={light ? '#2f6139' : '#f1e8d9'} />
        <path d="M20 12.5v16M20 17.5c2.6-.6 4.8-2.3 5.8-4.6M20 22.5c-2.6-.6-4.8-2.3-5.8-4.6" stroke={light ? '#f1e8d9' : '#2f6139'} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M20 9c1.5-2.6 4.2-3.7 6.5-3.3" stroke="#c4975f" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <span className="leading-none">
        <span className={cn('block font-display text-[22px] font-bold tracking-tight', light ? 'text-white' : 'text-forest-700')}>NUTRIO</span>
        <span className={cn('block text-[9.5px] font-semibold tracking-[0.32em] uppercase', light ? 'text-white/70' : 'text-latte-500')}>Food · Nutrition</span>
      </span>
    </Link>
  );
}
