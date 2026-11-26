'use client';

import Link from 'next/link';
import { AlertTriangle, Heart, Plus, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatNumber } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { usePrefs } from '@/stores/prefs';
import type { ProductCard as P } from '@/types';
import { Badge, NutriScore, Price, SmartImage, Stars } from '@/components/ui/misc';
import { useAllergyConflicts } from './allergy-sync';

export function ProductCard({ product: p, className, priority }: { product: P; className?: string; priority?: boolean }) {
  const { add } = useCartActions();
  const wl = useWishlist();
  const toggleCompare = usePrefs((s) => s.toggleCompare);
  const inCompare = usePrefs((s) => s.compare.some((c) => c.id === p.id));
  const conflicts = useAllergyConflicts(p.allergens);
  const v = p.defaultVariant;
  const soldOut = p.inStock === false;

  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-0.5 hover:border-sand-200 hover:shadow-lift', className)}>
      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden bg-sand-50">
        <SmartImage src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" priority={priority} className={cn('object-cover transition duration-500 group-hover:scale-105', p.hoverImage && 'group-hover:opacity-0')} />
        {p.hoverImage && <SmartImage src={p.hoverImage} alt="" fill sizes="25vw" className="object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {v && v.discountPercent > 0 && <Badge tone="sale">-{v.discountPercent}%</Badge>}
          {p.isFeatured && <Badge tone="dark">Nổi bật</Badge>}
          {soldOut && <Badge tone="neutral">Hết hàng</Badge>}
        </div>
        {p.nutriScoreGrade && <NutriScore grade={p.nutriScoreGrade} className="absolute bottom-2.5 left-2.5" />}
      </Link>

      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
        <button onClick={() => wl.toggle(p.id)} className={cn('flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-soft transition hover:scale-110', wl.has(p.id) ? 'text-sale' : 'text-ink/60')} aria-label="Yêu thích">
          <Heart className={cn('h-4.5 w-4.5', wl.has(p.id) && 'fill-sale')} />
        </button>
        <button
          onClick={() => {
            const r = toggleCompare({ id: p.id, slug: p.slug, name: p.name, image: p.image });
            if (r === 'full') toast.warning('Chỉ so sánh tối đa 3 sản phẩm');
            else toast.success(r === 'added' ? 'Đã thêm vào so sánh' : 'Đã bỏ khỏi so sánh');
          }}
          className={cn('flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-soft transition hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100', inCompare ? 'text-forest-600 sm:opacity-100' : 'text-ink/60')}
          aria-label="So sánh"
        >
          <Scale className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-1 text-[11px] font-semibold tracking-wide text-latte-500 uppercase">{p.category.name}</div>
        <Link href={`/products/${p.slug}`} className="line-clamp-2 min-h-10 text-sm leading-snug font-semibold hover:text-forest-700 sm:text-[15px]">
          {p.name}
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          {p.reviewCount > 0 ? (
            <>
              <Stars value={p.avgRating} size={12} /> <span>{p.avgRating.toFixed(1)} ({p.reviewCount})</span>
            </>
          ) : (
            <span>Chưa có đánh giá</span>
          )}
          {p.soldCount > 0 && <span className="ml-auto">Đã bán {formatNumber(p.soldCount)}</span>}
        </div>
        {p.nutrition && (
          <div className="mt-2 flex gap-2 text-[11px] text-ink/70">
            <span className="rounded-md bg-sand-50 px-1.5 py-0.5">{Math.round(p.nutrition.caloriesKcal)} kcal/100g</span>
            <span className="rounded-md bg-sand-50 px-1.5 py-0.5">Đạm {formatNumber(p.nutrition.proteinG, 1)}g</span>
          </div>
        )}
        {conflicts.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-danger">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {conflicts.some((c) => c.relation === 'contains') ? 'Chứa' : 'Có thể chứa'} {conflicts.map((c) => c.name.split(' (')[0].toLowerCase()).join(', ')}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {v ? (
            <div>
              <Price price={v.price} compare={v.compareAtPrice} size="sm" className="flex-col items-start gap-0" />
              <div className="text-[11px] text-muted">{v.name}{p.variantCount > 1 && ` · ${p.variantCount} quy cách`}</div>
            </div>
          ) : (
            <span className="text-sm text-muted">Liên hệ</span>
          )}
          <button
            disabled={!v || soldOut || add.isPending}
            onClick={() => v && add.mutate({ variantId: v.id, quantity: 1, name: p.name })}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-forest-600 text-white shadow-sm transition hover:scale-105 hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-sand-200"
            aria-label={`Thêm ${p.name} vào giỏ`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: P[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4', className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
