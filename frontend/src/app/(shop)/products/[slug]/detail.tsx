'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, BadgeCheck, CalendarClock, CalendarDays, Heart, Leaf, MapPin, Package, Repeat, Scale, Share2, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatDate, formatNumber, formatPrice } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useAuth } from '@/stores/auth';
import { usePrefs } from '@/stores/prefs';
import type { ProductCard as PC, ProductDetail } from '@/types';
import { ProductCard } from '@/components/shop/product-card';
import { ALLERGEN_NAMES, useAllergyConflicts } from '@/components/shop/allergy-sync';
import { Reviews } from '@/components/shop/reviews';
import { SubscribeModal } from '@/components/shop/subscribe-modal';
import { Button } from '@/components/ui/button';
import { ErrorState, Notice, Skeleton } from '@/components/ui/feedback';
import { Badge, Breadcrumbs, NutriScore, Price, QuantityStepper, RichText, SectionTitle, SmartImage, Stars, Tabs } from '@/components/ui/misc';

function NutritionTable({ p, grams }: { p: ProductDetail; grams: number }) {
  const n = p.nutritionFacts;
  if (!n) return <p className="text-sm text-muted">Sản phẩm chưa có thông tin dinh dưỡng.</p>;
  const serving = n.servingSizeG || 30;
  const rows: [string, number, string, number?][] = [
    ['Năng lượng', n.caloriesKcal, 'kcal', 2000],
    ['Chất đạm (Protein)', n.proteinG, 'g', 50],
    ['Carbohydrate', n.carbG, 'g', 275],
    ['  trong đó Đường', n.sugarG, 'g'],
    ['Chất xơ', n.fiberG, 'g', 28],
    ['Chất béo', n.fatG, 'g', 78],
    ['  trong đó Béo bão hòa', n.saturatedFatG, 'g', 20],
    ['Natri', n.sodiumMg, 'mg', 2300],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-4 border-ink text-left">
            <th className="py-2 font-semibold">Thành phần dinh dưỡng</th>
            <th className="py-2 text-right font-semibold">/100 g</th>
            <th className="py-2 text-right font-semibold">/{serving} g</th>
            <th className="py-2 text-right font-semibold">%DV*</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, v, unit, dv]) => {
            const per = (v * serving) / 100;
            return (
              <tr key={label} className="border-b border-line">
                <td className={cn('py-2', label.startsWith('  ') ? 'pl-5 text-muted' : 'font-medium')}>{label.trim()}</td>
                <td className="py-2 text-right">{formatNumber(v, 1)} {unit}</td>
                <td className="py-2 text-right">{formatNumber(per, 1)} {unit}</td>
                <td className="py-2 text-right text-muted">{dv ? `${Math.round((per / dv) * 100)}%` : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="space-y-3 rounded-2xl bg-sand-50 p-5 text-sm">
        <NutriScore grade={p.nutriScoreGrade} size="lg" />
        <p className="text-muted">Nutri-Score được tính tự động từ năng lượng, đường, chất béo bão hòa, natri, chất xơ và đạm trên 100 g theo thang điểm châu Âu (rút gọn).</p>
        <div className="rounded-xl bg-white p-3">
          Gói <b>{formatNumber(grams)} g</b> cung cấp khoảng <b>{formatNumber((n.caloriesKcal * grams) / 100)} kcal</b>, tương đương <b>{formatNumber(grams / serving, 0)} khẩu phần</b>.
        </div>
        <p className="text-xs text-muted">*%DV tính trên khẩu phần, dựa theo chế độ ăn tham chiếu 2.000 kcal/ngày.</p>
      </div>
    </div>
  );
}

export function ProductDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: p, isLoading, isError, error, refetch } = useQuery({ queryKey: ['product', slug], queryFn: () => get<ProductDetail>(`/products/${slug}`), retry: false });
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState<'desc' | 'nutrition' | 'ingredients' | 'origin'>('desc');
  const [subOpen, setSubOpen] = useState(false);
  const { add } = useCartActions();
  const wl = useWishlist();
  const user = useAuth((s) => s.user);
  const { toggleCompare, addViewed, recentlyViewed } = usePrefs();
  const inCompare = usePrefs((s) => s.compare.some((c) => c.id === p?.id));
  const conflicts = useAllergyConflicts(p?.allergens ?? []);

  // Variant & image state start fresh per product (the page keys this component by slug); null = default variant
  useEffect(() => {
    if (p) addViewed(p.id);
  }, [p, addViewed]);

  const related = useQuery({ queryKey: ['related', p?.id], queryFn: () => get<PC[]>(`/products/${p!.id}/related`), enabled: !!p });
  const fbt = useQuery({ queryKey: ['fbt', p?.id], queryFn: () => get<PC[]>(`/products/${p!.id}/frequently-bought`), enabled: !!p });
  const viewedIds = recentlyViewed.filter((id) => id !== p?.id).slice(0, 4);
  const viewed = useQuery({ queryKey: ['viewed', viewedIds], queryFn: () => get<PC[]>('/products/by-ids', { ids: viewedIds.join(',') }), enabled: viewedIds.length > 0 });

  const priceAlert = useMutation({
    mutationFn: async () => api.post(`/account/wishlist/${p!.id}/price-alert?active=true`),
    onSuccess: () => toast.success('Bạn sẽ nhận thông báo khi sản phẩm giảm giá'),
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading)
    return (
      <div className="container-page grid gap-10 py-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-full" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-40 w-full" /></div>
      </div>
    );
  if (isError || !p)
    return (
      <div className="container-page py-20">
        <ErrorState message={apiError(error, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh')} onRetry={() => refetch()} />
      </div>
    );

  const v = p.variants.find((x) => x.id === variantId) ?? p.variants[0];
  const stock = v?.availableStock ?? 0;
  const images = p.images.length ? p.images : [{ id: 0, url: p.image, altText: p.name }];

  const addToCart = async (buyNow = false) => {
    if (!v) return;
    try {
      await add.mutateAsync({ variantId: v.id, quantity: qty, name: p.name, silent: buyNow });
      if (buyNow) router.push('/cart');
    } catch {
      /* toast shown by hook */
    }
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, text: p.shortDescription ?? '', url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết sản phẩm');
    }
  };

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Cửa hàng', href: '/products' }, { label: p.category.name, href: `/products?category=${p.category.slug}` }, { label: p.name }]} />

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand-50">
            <SmartImage src={images[img]?.url} alt={images[img]?.altText || p.name} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            {v && v.discountPercent > 0 && <Badge tone="sale" className="absolute top-4 left-4 text-sm">-{v.discountPercent}%</Badge>}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((im, k) => (
                <button key={im.id + im.url} onClick={() => setImg(k)} className={cn('relative h-20 w-20 cursor-pointer overflow-hidden rounded-xl border-2 transition', k === img ? 'border-forest-600' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <SmartImage src={im.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Link href={`/products?category=${p.category.slug}`} className="text-xs font-bold tracking-widest text-latte-500 uppercase">{p.category.name}</Link>
          <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {p.reviewCount > 0 ? (
              <a href="#reviews" className="flex items-center gap-1.5 hover:underline"><Stars value={p.avgRating} /> <b>{p.avgRating.toFixed(1)}</b> <span className="text-muted">({p.reviewCount} đánh giá)</span></a>
            ) : (
              <span className="text-muted">Chưa có đánh giá</span>
            )}
            <span className="text-muted">Đã bán {formatNumber(p.soldCount)}</span>
            <NutriScore grade={p.nutriScoreGrade} />
          </div>
          {p.shortDescription && <p className="mt-4 leading-relaxed text-ink/80">{p.shortDescription}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {p.diets.map((d) => <Badge key={d.code} tone="green"><Leaf className="h-3 w-3" /> {d.name}</Badge>)}
            {p.certifications.map((c) => <Badge key={c.code} tone="brown"><ShieldCheck className="h-3 w-3" /> {c.name}</Badge>)}
          </div>

          {conflicts.length > 0 ? (
            <Notice tone="danger" className="mt-5" icon={<AlertTriangle className="h-5 w-5 shrink-0" />}>
              <b>Cảnh báo dị ứng:</b> sản phẩm {conflicts.map((c) => `${c.relation === 'contains' ? 'chứa' : 'có thể chứa'} ${ALLERGEN_NAMES[c.code]?.toLowerCase() ?? c.name}`).join(', ')} – thành phần bạn đã khai báo dị ứng.
            </Notice>
          ) : p.allergens.length > 0 ? (
            <div className="mt-5 flex items-start gap-2 text-sm text-ink/75">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span><b>Thông tin dị ứng:</b> {p.allergens.map((a) => `${a.relation === 'contains' ? 'Chứa' : 'Có thể chứa'} ${ALLERGEN_NAMES[a.code]?.toLowerCase() ?? a.name}`).join(' · ')}</span>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            {v && <Price price={v.price} compare={v.compareAtPrice} size="lg" />}
            {p.variants.length > 1 && (
              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold">Quy cách</div>
                <div className="flex flex-wrap gap-2">
                  {p.variants.map((x) => (
                    <button
                      key={x.id}
                      onClick={() => { setVariantId(x.id); setQty(1); }}
                      disabled={(x.availableStock ?? 0) <= 0}
                      className={cn('cursor-pointer rounded-xl border px-4 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40', x.id === v?.id ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-100' : 'border-line hover:border-forest-300')}
                    >
                      <div className="font-semibold">{x.name}</div>
                      <div className="text-xs text-muted">{formatPrice(x.price)} · {formatNumber(Math.round((x.price / x.netWeightG) * 100))}₫/100g</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-2 text-muted"><Package className="h-4 w-4" /> Khối lượng: <b className="text-ink">{v ? formatNumber(v.netWeightG) : '—'} g</b></span>
              <span className={cn('flex items-center gap-2', stock > 0 ? (stock <= 10 ? 'text-warning' : 'text-forest-700') : 'text-danger')}>
                <span className={cn('h-2 w-2 rounded-full', stock > 0 ? (stock <= 10 ? 'bg-warning' : 'bg-forest-500') : 'bg-danger')} />
                {stock > 0 ? (stock <= 10 ? `Chỉ còn ${stock} sản phẩm` : `Còn ${stock} sản phẩm`) : 'Tạm hết hàng'}
              </span>
              <span className="flex items-center gap-2 text-muted"><MapPin className="h-4 w-4" /> Xuất xứ: <b className="text-ink">{p.originCountry}</b></span>
              <span className="flex items-center gap-2 text-muted"><CalendarDays className="h-4 w-4" /> HSD lô hiện tại: <b className="text-ink">{v?.nearestExpiry ? formatDate(v.nearestExpiry) : p.shelfLifeDays ? `${p.shelfLifeDays} ngày từ NSX` : '—'}</b></span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(99, stock))} disabled={stock <= 0} />
              <Button size="lg" className="min-w-40 flex-1" disabled={stock <= 0} loading={add.isPending} onClick={() => addToCart(false)}>
                <ShoppingBag className="h-5 w-5" /> Thêm vào giỏ
              </Button>
              <Button size="lg" variant="accent" className="flex-1" disabled={stock <= 0} onClick={() => addToCart(true)}>Mua ngay</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button variant="ghost" size="sm" onClick={() => wl.toggle(p.id)}><Heart className={cn('h-4 w-4', wl.has(p.id) && 'fill-sale text-sale')} /> {wl.has(p.id) ? 'Đã yêu thích' : 'Yêu thích'}</Button>
              <Button variant="ghost" size="sm" onClick={() => { const r = toggleCompare({ id: p.id, slug: p.slug, name: p.name, image: p.image }); toast[r === 'full' ? 'warning' : 'success'](r === 'full' ? 'Chỉ so sánh tối đa 3 sản phẩm' : r === 'added' ? 'Đã thêm vào so sánh' : 'Đã bỏ khỏi so sánh'); }}>
                <Scale className={cn('h-4 w-4', inCompare && 'text-forest-600')} /> {inCompare ? 'Đang so sánh' : 'So sánh'}
              </Button>
              <Button variant="ghost" size="sm" onClick={share}><Share2 className="h-4 w-4" /> Chia sẻ</Button>
              {user && wl.has(p.id) && <Button variant="ghost" size="sm" onClick={() => priceAlert.mutate()}><CalendarClock className="h-4 w-4" /> Báo khi giảm giá</Button>}
              <Button variant="ghost" size="sm" onClick={() => (user ? setSubOpen(true) : router.push(`/login?next=/products/${p.slug}`))} disabled={stock <= 0}><Repeat className="h-4 w-4" /> Giao định kỳ (giảm đến 10%)</Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            {[[Truck, 'Miễn phí giao từ 300K'], [ShieldCheck, 'Truy xuất nguồn gốc lô'], [ArrowRightLeft, 'Đổi trả 7 ngày nếu lỗi']].map(([Icon, t], k) => {
              const I = Icon as typeof Truck;
              return <div key={k} className="flex items-center gap-2 rounded-xl bg-sand-50 px-3 py-2.5"><I className="h-4 w-4 text-forest-600" /> {t as string}</div>;
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="mt-14">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'desc', label: 'Mô tả' }, { value: 'nutrition', label: 'Dinh dưỡng' }, { value: 'ingredients', label: 'Thành phần & sử dụng' }, { value: 'origin', label: 'Nguồn gốc & chứng nhận' }]} />
        <div className="rounded-b-2xl border border-t-0 border-line bg-white p-6 sm:p-8">
          {tab === 'desc' && (p.description ? <RichText text={p.description} className="max-w-3xl" /> : <p className="text-muted">Đang cập nhật mô tả.</p>)}
          {tab === 'nutrition' && <NutritionTable p={p} grams={v?.netWeightG ?? 100} />}
          {tab === 'ingredients' && (
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-sans font-semibold">Thành phần</h3>
                <ul className="space-y-1.5 text-sm">{p.ingredients.map((i) => <li key={i.name} className="flex justify-between border-b border-line pb-1.5"><span>{i.name}</span><span className="text-muted">{i.percentage ? `${i.percentage}%` : ''}</span></li>)}</ul>
                {!p.ingredients.length && <p className="text-sm text-muted">Đang cập nhật.</p>}
              </div>
              <div className="space-y-5 text-sm">
                <div><h3 className="mb-1.5 font-sans font-semibold">Hướng dẫn sử dụng</h3><p className="text-ink/80">{p.usageInstruction || 'Dùng trực tiếp.'}</p></div>
                <div><h3 className="mb-1.5 font-sans font-semibold">Bảo quản</h3><p className="text-ink/80">{p.storageInstruction || 'Nơi khô ráo, thoáng mát.'}</p></div>
                <div><h3 className="mb-1.5 font-sans font-semibold">Hạn sử dụng</h3><p className="text-ink/80">{p.shelfLifeDays ? `${p.shelfLifeDays} ngày kể từ ngày sản xuất.` : 'Xem trên bao bì.'} {v?.nearestExpiry && `Lô đang bán: HSD ${formatDate(v.nearestExpiry)}.`}</p></div>
              </div>
            </div>
          )}
          {tab === 'origin' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <div><span className="text-muted">Xuất xứ:</span> <b>{p.originCountry}</b></div>
                {p.brand && <div><span className="text-muted">Thương hiệu:</span> <b>{p.brand.name}</b></div>}
                {p.farm && <div className="rounded-xl bg-forest-50 p-4"><div className="font-semibold text-forest-800">{p.farm.name} – {p.farm.province}</div><p className="mt-1 text-ink/75">{p.farm.description}</p></div>}
              </div>
              <div>
                <h3 className="mb-3 font-sans font-semibold">Chứng nhận</h3>
                {p.certifications.length ? (
                  <ul className="space-y-2 text-sm">{p.certifications.map((c) => <li key={c.code} className="flex items-center gap-2 rounded-xl border border-line p-3"><BadgeCheck className="h-5 w-5 text-forest-600" /><span><b>{c.name}</b>{c.issuer && <span className="text-muted"> · {c.issuer}</span>}{c.certificateNumber && <span className="block text-xs text-muted">Số: {c.certificateNumber}</span>}</span></li>)}</ul>
                ) : (
                  <p className="text-sm text-muted">Sản phẩm chưa có chứng nhận được công bố.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {p.healthierAlternatives.length > 0 && (
        <section className="mt-12 rounded-3xl bg-forest-50 p-6 sm:p-8">
          <SectionTitle eyebrow="Smart Swap" title="Lựa chọn lành mạnh hơn" description="Gợi ý có chỉ số dinh dưỡng tốt hơn trong cùng nhóm sản phẩm." />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {p.healthierAlternatives.map((a) => (
              <div key={a.id}>
                <ProductCard product={a} />
                {a.reason && <p className="mt-2 text-center text-xs font-medium text-forest-700">✓ {a.reason}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {fbt.data && fbt.data.length > 0 && v && (
        <section className="mt-12">
          <SectionTitle eyebrow="Combo gợi ý" title="Thường được mua cùng" />
          <div className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-5 lg:flex-row lg:items-center">
            <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
              <ProductCard product={p} />
              {fbt.data.map((x) => <ProductCard key={x.id} product={x} />)}
            </div>
            <div className="shrink-0 rounded-2xl bg-sand-50 p-5 text-center lg:w-60">
              <div className="text-sm text-muted">Tổng {fbt.data.length + 1} sản phẩm</div>
              <div className="my-1 text-2xl font-bold text-forest-700">{formatPrice(v.price + fbt.data.reduce((s, x) => s + (x.defaultVariant?.price ?? 0), 0))}</div>
              <AddAllButton items={[{ variantId: v.id, quantity: 1 }, ...fbt.data.filter((x) => x.defaultVariant).map((x) => ({ variantId: x.defaultVariant!.id, quantity: 1 }))]} />
            </div>
          </div>
        </section>
      )}

      <Reviews productId={p.id} productSlug={p.slug} avg={p.avgRating} count={p.reviewCount} distribution={p.ratingDistribution} onChanged={() => qc.invalidateQueries({ queryKey: ['product', slug] })} />

      {related.data && related.data.length > 0 && (
        <section className="mt-14">
          <SectionTitle title="Sản phẩm liên quan" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{related.data.slice(0, 4).map((x) => <ProductCard key={x.id} product={x} />)}</div>
        </section>
      )}
      {viewed.data && viewed.data.length > 0 && (
        <section className="mt-14">
          <SectionTitle title="Bạn đã xem gần đây" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{viewed.data.map((x) => <ProductCard key={x.id} product={x} />)}</div>
        </section>
      )}
      {subOpen && v && <SubscribeModal open onClose={() => setSubOpen(false)} variant={{ id: v.id, name: `${p.name} – ${v.name}`, price: v.price }} />}
    </div>
  );
}

function AddAllButton({ items }: { items: { variantId: number; quantity: number }[] }) {
  const { addMany } = useCartActions();
  return <Button className="mt-3 w-full" loading={addMany.isPending} onClick={() => addMany.mutate(items)}>Thêm tất cả vào giỏ</Button>;
}
