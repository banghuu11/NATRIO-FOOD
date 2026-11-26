'use client';

import Link from 'next/link';
import { ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useUi } from '@/stores/ui';
import { useCart, useCartActions } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { Drawer } from '@/components/ui/overlay';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { QuantityStepper, SmartImage } from '@/components/ui/misc';
import { NutritionWidget } from './nutrition-widget';

const FREE_SHIP = 300000;

export function CartDrawer() {
  const { cartOpen, closeCart, ask } = useUi();
  const { data, isLoading } = useCart();
  const { update, remove } = useCartActions();
  const s = data?.summary;
  const left = s ? Math.max(0, FREE_SHIP - s.subtotal) : FREE_SHIP;

  return (
    <Drawer
      open={cartOpen}
      onClose={closeCart}
      title={<span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Giỏ hàng ({data?.itemCount ?? 0})</span>}
      footer={
        data && data.items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted">Tạm tính</span><b>{formatPrice(s!.subtotal)}</b></div>
            {s!.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Giảm giá</span><b className="text-sale">-{formatPrice(s!.discountAmount)}</b></div>}
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="outline" onClick={closeCart}>Xem giỏ hàng</ButtonLink>
              <ButtonLink href="/cart" onClick={closeCart}>Thanh toán</ButtonLink>
            </div>
          </div>
        ) : null
      }
    >
      {isLoading ? (
        <div className="space-y-4 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !data?.items.length ? (
        <div className="p-5">
          <EmptyState title="Giỏ hàng đang trống" description="Khám phá các loại hạt dinh dưỡng và granola sấy mộc của NUTRIO." action={<ButtonLink href="/products" onClick={closeCart}>Mua sắm ngay</ButtonLink>} />
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-white p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4 text-forest-600" />
              {left > 0 ? <span>Mua thêm <b className="text-forest-700">{formatPrice(left)}</b> để được miễn phí giao hàng</span> : <span className="font-semibold text-forest-700">Bạn được miễn phí giao hàng tiêu chuẩn!</span>}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-forest-100"><div className="h-full rounded-full bg-forest-500 transition-all" style={{ width: `${Math.min(100, ((s?.subtotal ?? 0) / FREE_SHIP) * 100)}%` }} /></div>
          </div>
          <ul className="space-y-3">
            {data.items.map((it) => (
              <li key={it.id} className="flex gap-3 rounded-xl bg-white p-3">
                <Link href={it.variantId ? `/products/${it.slug}` : `/combos`} onClick={closeCart} className="shrink-0">
                  <SmartImage src={it.image} alt={it.name} width={72} height={72} className="h-18 w-18 rounded-lg object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-muted">{it.variantName}{it.isFlashSale && <span className="ml-1 font-semibold text-sale">· Flash sale</span>}</div>
                  {!it.stockOk && <div className="text-xs font-medium text-danger">{it.availableStock > 0 ? `Chỉ còn ${it.availableStock}` : 'Hết hàng'}</div>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityStepper size="sm" value={it.quantity} max={Math.max(1, Math.min(99, it.availableStock))} onChange={(q) => update.mutate({ id: it.id, quantity: q })} />
                    <span className="text-sm font-semibold">{formatPrice(it.lineTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={async () => (await ask({ title: 'Xóa sản phẩm khỏi giỏ?', description: it.name, confirmLabel: 'Xóa', tone: 'danger' })).ok && remove.mutate(it.id)}
                  className="cursor-pointer self-start p-1 text-muted hover:text-danger"
                  aria-label="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {s && <NutritionWidget totals={s.nutrition} compact />}
        </div>
      )}
    </Drawer>
  );
}
