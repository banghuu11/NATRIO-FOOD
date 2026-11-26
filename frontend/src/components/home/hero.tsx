'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Banner } from '@/types';
import { SmartImage } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/feedback';

export function Hero({ banners, loading }: { banners: Banner[]; loading?: boolean }) {
  const [i, setI] = useState(0);
  const n = banners.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [n]);

  if (loading) return <div className="container-page pt-6"><Skeleton className="h-[460px] rounded-3xl" /></div>;
  if (!n) return null;
  const b = banners[i];

  return (
    <section className="container-page pt-5 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-forest-800">
        <div className="grid min-h-[440px] lg:grid-cols-2">
          <div key={b.id} className="relative z-10 flex animate-fade-up flex-col justify-center gap-5 p-7 sm:p-12 lg:p-14">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-latte-300">
              <Sparkles className="h-3.5 w-3.5" /> Dinh dưỡng cá nhân hóa
            </span>
            <h1 className="text-4xl leading-[1.08] font-semibold text-white sm:text-5xl lg:text-[3.4rem]">{b.title}</h1>
            {b.subtitle && <p className="max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">{b.subtitle}</p>}
            <div className="flex flex-wrap items-center gap-3">
              {b.linkUrl && (
                <Link href={b.linkUrl} className="inline-flex h-12 items-center gap-2 rounded-full bg-latte-400 px-6 font-semibold text-ink transition hover:gap-3 hover:bg-latte-300">
                  {b.ctaLabel || 'Khám phá'} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link href="/quiz" className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 font-semibold text-white hover:bg-white/10">
                Làm quiz 1 phút
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-5 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 text-latte-300" /> Sấy mộc, không chất bảo quản</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-latte-300" /> Truy xuất từng lô hàng</span>
            </div>
          </div>
          <div className="relative min-h-[260px] lg:min-h-0">
            {banners.map((x, k) => (
              <SmartImage key={x.id} src={x.imageUrl} alt={x.title || ''} fill priority={k === 0} sizes="(max-width:1024px) 100vw, 50vw" className={cn('object-cover transition-opacity duration-1000', k === i ? 'opacity-100' : 'opacity-0')} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-forest-800 via-forest-800/20 to-transparent lg:via-transparent" />
          </div>
        </div>
        {n > 1 && (
          <div className="absolute right-5 bottom-5 z-20 flex items-center gap-2">
            <button onClick={() => setI((i - 1 + n) % n)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white" aria-label="Trước"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex gap-1.5 px-1">
              {banners.map((_, k) => (
                <button key={k} onClick={() => setI(k)} className={cn('h-2 cursor-pointer rounded-full transition-all', k === i ? 'w-7 bg-white' : 'w-2 bg-white/50')} aria-label={`Banner ${k + 1}`} />
              ))}
            </div>
            <button onClick={() => setI((i + 1) % n)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white" aria-label="Sau"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
      </div>
    </section>
  );
}
