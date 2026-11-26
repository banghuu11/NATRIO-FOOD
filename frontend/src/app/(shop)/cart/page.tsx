'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ShoppingBag, Tag, Ticket, Trash2, Truck, X } from 'lucide-react';
import { get } from '@/lib/api';
import { formatPrice, formatWeight } from '@/lib/utils';
import { useCart, useCartActions } from '@/hooks/use-cart';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import type { Cart, Quote } from '@/types';
import { NutritionWidget } from '@/components/shop/nutrition-widget';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox, Input } from '@/components/ui/form';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Breadcrumbs, QuantityStepper, SmartImage } from '@/components/ui/misc';

interface Voucher { code: string; description: string | null; minOrderAmount: number; usable: boolean; reason: string | null; endsAt: string | null }

export default function CartPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const ask = useUi((s) => s.ask);
  const { data: cart, isLoading, isError, refetch } = useCart();
  const { update, remove, applyCoupon, removeCoupon } = useCartActions();
  const [selected, setSelected] = useState<number[] | null>(null);
  const [code, setCode] = useState('');

  const seen = useRef<number[] | null>(null);
  useEffect(() => {
    if (!cart) return;
    const ids = cart.items.map((i) => i.id);
    setSelected((prev) => {
      if (prev === null) {
        const saved = sessionStorage.getItem('nutrio_selected');
        const base = saved ? (JSON.parse(saved) as number[]).filter((id) => ids.includes(id)) : ids;
        seen.current = ids;
        return base.length ? base : ids;
      }
      // keep current choice, auto-select rows that were just added
      const fresh = ids.filter((id) => !seen.current?.includes(id));
      seen.current = ids;
      return [...prev.filter((id) => ids.includes(id)), ...fresh];
    });
  }, [cart]);
  useEffect(() => {
    if (selected) sessionStorage.setItem('nutrio_selected', JSON.stringify(selected));
  }, [selected]);

  const sel = useMemo(() => selected ?? [], [selected]);
  const selKey = [...sel].sort().join(',');
  // Server-side totals for the selected rows only
  const quote = useQuery({
    queryKey: ['cart-selected', selKey, cart?.summary.subtotal, cart?.couponCode, user?.id],
    queryFn: () => get<Cart>('/cart', { selected: selKey || '0' }),
    enabled: !!cart && cart.items.length > 0,
  });
  const s: Quote | undefined = sel.length ? quote.data?.summary : undefined;
  const vouchers = useQuery({ queryKey: ['vouchers', user?.id], queryFn: () => get<Voucher[]>(user ? '/account/vouchers' : '/promotions/coupons'), staleTime: 60_000 });

  const selectedItems = useMemo(() => cart?.items.filter((i) => sel.includes(i.id)) ?? [], [cart, sel]);
  const blocked = selectedItems.some((i) => !i.stockOk);
  const allChecked = !!cart?.items.length && sel.length === cart.items.length;

  if (isLoading) return <div className="container-page py-10"><Skeleton className="h-96" /></div>;
  if (isError) return <div className="container-page py-16"><ErrorState onRetry={() => refetch()} /></div>;
  if (!cart?.items.length)
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Giỏ hàng của bạn đang trống" description="Thêm vài loại hạt yêu thích hoặc thử Quiz tư vấn để tìm sản phẩm hợp với bạn." action={<div className="flex gap-2"><ButtonLink href="/products">Mua sắm ngay</ButtonLink><ButtonLink href="/quiz" variant="outline">Làm quiz</ButtonLink></div>} />
      </div>
    );

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Giỏ hàng' }]} />
      <h1 className="mt-4 mb-6 text-3xl sm:text-4xl">Giỏ hàng <span className="text-xl text-muted">({cart.itemCount} sản phẩm)</span></h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-3">
            <Checkbox checked={allChecked} onChange={(v) => setSelected(v ? cart.items.map((i) => i.id) : [])} label={<b>Chọn tất cả ({cart.items.length})</b>} />
            <span className="text-sm text-muted">Đã chọn {sel.length}</span>
          </div>
          <ul className="space-y-3">
            {cart.items.map((it) => (
              <li key={it.id} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
                <div className="pt-8"><Checkbox checked={sel.includes(it.id)} onChange={(v) => setSelected(v ? [...sel, it.id] : sel.filter((x) => x !== it.id))} label={<span className="sr-only">Chọn</span>} /></div>
                <Link href={it.variantId ? `/products/${it.slug}` : '/combos'} className="shrink-0"><SmartImage src={it.image} alt={it.name} width={96} height={96} className="h-24 w-24 rounded-xl object-cover" /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={it.variantId ? `/products/${it.slug}` : '/combos'} className="line-clamp-2 font-semibold hover:text-forest-700">{it.name}</Link>
                      <div className="text-sm text-muted">{it.variantName} · {formatWeight(it.weightG / it.quantity)}</div>
                      {it.isFlashSale && <span className="text-xs font-semibold text-sale">Giá Flash Sale</span>}
                    </div>
                    <button onClick={async () => (await ask({ title: 'Xóa sản phẩm khỏi giỏ hàng?', description: it.name, confirmLabel: 'Xóa', tone: 'danger' })).ok && remove.mutate(it.id)} className="h-fit cursor-pointer p-1 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-5 w-5" /></button>
                  </div>
                  {!it.stockOk && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger">
                      <AlertTriangle className="h-4 w-4" /> {it.availableStock > 0 ? `Chỉ còn ${it.availableStock} sản phẩm – vui lòng giảm số lượng` : 'Sản phẩm đã hết hàng'}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <QuantityStepper value={it.quantity} max={Math.max(1, Math.min(99, it.availableStock))} onChange={(q) => update.mutate({ id: it.id, quantity: q })} />
                    <div className="text-right">
                      <div className="font-bold text-forest-700">{formatPrice(it.lineTotal)}</div>
                      <div className="text-xs text-muted">{formatPrice(it.unitPrice)} / sp</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/products" className="inline-block text-sm font-semibold text-forest-700 hover:underline">← Tiếp tục mua sắm</Link>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-2 font-semibold"><Ticket className="h-4 w-4 text-latte-500" /> Mã giảm giá</div>
            {cart.couponCode ? (
              <div className="flex items-center justify-between rounded-xl bg-forest-50 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 font-semibold text-forest-800"><Tag className="h-4 w-4" /> {cart.couponCode}</span>
                <button onClick={() => removeCoupon.mutate()} className="cursor-pointer text-muted hover:text-danger" aria-label="Bỏ mã"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) applyCoupon.mutate(code.trim(), { onSuccess: () => setCode('') }); }}>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Nhập mã" className="uppercase" />
                <Button type="submit" variant="secondary" loading={applyCoupon.isPending}>Áp dụng</Button>
              </form>
            )}
            {s?.couponError && <p className="mt-2 text-xs font-medium text-danger">{s.couponError}</p>}
            {!!vouchers.data?.length && !cart.couponCode && (
              <div className="mt-3 space-y-2">
                {vouchers.data.filter((v) => ('usable' in v ? v.usable !== false : true)).slice(0, 4).map((v) => (
                  <button key={v.code} onClick={() => applyCoupon.mutate(v.code)} className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-latte-300 bg-latte-500/5 px-3 py-2 text-left text-xs hover:bg-latte-500/10">
                    <span><b className="text-latte-700">{v.code}</b> · {v.description}</span>
                    <span className="shrink-0 font-semibold text-forest-700">Dùng</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-4 font-sans text-lg font-semibold">Tóm tắt đơn hàng</h2>
            {!sel.length ? (
              <p className="text-sm text-muted">Chọn sản phẩm để xem tổng tiền.</p>
            ) : !s ? (
              <Skeleton className="h-32" />
            ) : (
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Tạm tính ({s.itemCount} sp)</dt><dd className="font-semibold">{formatPrice(s.subtotal)}</dd></div>
                {s.memberDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Ưu đãi hạng {s.tier?.name} (-{s.tier?.discountPercent}%)</dt><dd className="font-semibold text-sale">-{formatPrice(s.memberDiscount)}</dd></div>}
                {s.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Mã {s.coupon?.code}</dt><dd className="font-semibold text-sale">-{formatPrice(s.couponDiscount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted">Tổng khối lượng</dt><dd>{formatWeight(s.totalWeightG)}</dd></div>
                <div className="flex justify-between"><dt className="flex items-center gap-1 text-muted"><Truck className="h-4 w-4" /> Phí vận chuyển ({s.shippingMethod?.name})</dt><dd>{s.shippingFee ? formatPrice(s.shippingFee) : <span className="font-semibold text-forest-700">Miễn phí</span>}</dd></div>
                <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">Tổng thanh toán</dt><dd className="text-2xl font-bold text-forest-700">{formatPrice(s.totalAmount)}</dd></div>
                {user && s.pointsEarned > 0 && <p className="text-xs text-latte-700">+{s.pointsEarned} điểm thưởng khi đơn giao thành công</p>}
              </dl>
            )}
            <Button size="lg" className="mt-5 w-full" disabled={!sel.length || blocked} onClick={() => router.push(`/checkout?items=${sel.join(',')}`)}>
              Thanh toán ({sel.length})
            </Button>
            {blocked && <p className="mt-2 text-xs text-danger">Có sản phẩm vượt quá tồn kho, vui lòng điều chỉnh.</p>}
            {!user && <p className="mt-3 text-center text-xs text-muted"><Link href="/login?next=/cart" className="font-semibold text-forest-700 underline">Đăng nhập</Link> để tích điểm & dùng voucher thành viên</p>}
          </div>
          {s && <NutritionWidget totals={s.nutrition} />}
        </aside>
      </div>
    </div>
  );
}
