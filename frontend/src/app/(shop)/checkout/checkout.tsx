'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Banknote, Building2, Check, CreditCard, Lock, MapPin, Sparkles, Truck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatPrice, formatWeight, uuid } from '@/lib/utils';
import { PHONE_RE, PROVINCES } from '@/lib/vn-provinces';
import { useAuth } from '@/stores/auth';
import { CART_KEY, useCart } from '@/hooks/use-cart';
import type { Address, CartLine, Quote } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { EmptyState, ErrorState, Notice, Skeleton, Spinner } from '@/components/ui/feedback';
import { SmartImage } from '@/components/ui/misc';
import { NutritionWidget } from '@/components/shop/nutrition-widget';

const schema = z.object({
  recipientName: z.string().trim().min(2, 'Vui lòng nhập họ tên người nhận').max(150),
  phone: z.string().trim().regex(PHONE_RE, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  email: z.union([z.literal(''), z.string().trim().email('Email không hợp lệ')]),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  district: z.string().trim().min(2, 'Vui lòng nhập Quận/Huyện'),
  ward: z.string().trim().min(2, 'Vui lòng nhập Phường/Xã'),
  street: z.string().trim().min(5, 'Vui lòng nhập số nhà, tên đường').max(255),
  note: z.string().max(500).optional(),
});
type Info = z.infer<typeof schema>;

interface PaymentMethod { code: string; name: string; description: string; enabled: boolean }
interface QuoteRes { items: (CartLine & { cartItemId: number })[]; summary: Quote; paymentMethods: PaymentMethod[] }

const STEPS = ['Thông tin nhận hàng', 'Vận chuyển', 'Thanh toán', 'Xác nhận'];
const PAY_ICON: Record<string, typeof Wallet> = { cod: Banknote, bank_transfer: Building2, vnpay: CreditCard, momo: Wallet };

export function Checkout() {
  const sp = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const itemIds = useMemo(() => (sp.get('items') || '').split(',').map(Number).filter((n) => n > 0), [sp]);
  const [step, setStep] = useState(0);
  const [shippingMethodId, setShipping] = useState<number | undefined>();
  const [paymentMethod, setPayment] = useState('cod');
  const [usePoints, setUsePoints] = useState(false);
  const [addressId, setAddressId] = useState<number | 'new' | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [idemKey] = useState(() => uuid());

  const form = useForm<Info>({ resolver: zodResolver(schema), defaultValues: { recipientName: '', phone: '', email: '', province: 'TP. Hồ Chí Minh', district: '', ward: '', street: '', note: '' } });
  const cart = useCart();
  const couponCode = cart.data?.couponCode ?? undefined;
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => get<Address[]>('/account/addresses'), enabled: !!user });

  useEffect(() => {
    if (user) form.setValue('email', user.email);
    if (addresses.data && addressId === null) setAddressId(addresses.data.find((a) => a.isDefault)?.id ?? addresses.data[0]?.id ?? 'new');
    if (!user && ready && addressId === null) setAddressId('new');
  }, [user, ready, addresses.data, addressId, form]);
  useEffect(() => {
    const a = addresses.data?.find((x) => x.id === addressId);
    if (a) form.reset({ ...form.getValues(), recipientName: a.recipientName, phone: a.phone, province: a.province, district: a.district, ward: a.ward, street: a.street });
  }, [addressId, addresses.data, form]);

  const quoteQ = useQuery({
    queryKey: ['checkout-quote', itemIds.join(','), shippingMethodId, usePoints, user?.id, couponCode],
    queryFn: async () => {
      const first = (await api.post<QuoteRes>('/checkout/quote', { cartItemIds: itemIds, shippingMethodId, couponCode, pointsToUse: 0 })).data;
      if (!usePoints || !first.summary.maxPointsUsable) return first;
      return (await api.post<QuoteRes>('/checkout/quote', { cartItemIds: itemIds, shippingMethodId, couponCode, pointsToUse: first.summary.maxPointsUsable })).data;
    },
    enabled: itemIds.length > 0 && ready && cart.isFetched,
    retry: false,
  });
  const q = quoteQ.data;
  const s = q?.summary;
  useEffect(() => {
    if (s && !shippingMethodId && s.shippingMethod) setShipping(s.shippingMethod.id);
  }, [s, shippingMethodId]);

  const place = useMutation({
    mutationFn: async () => {
      const info = form.getValues();
      return (
        await api.post<{ order: { id: number; orderNumber: string }; payment: { redirectUrl: string | null; bankTransfer: unknown } }>('/orders', {
          cartItemIds: itemIds,
          ...info,
          email: info.email || undefined,
          note: info.note || undefined,
          shippingMethodId,
          paymentMethod,
          couponCode: s?.coupon?.code,
          pointsToUse: usePoints ? s?.pointsUsed : 0,
          saveAddress: !!user && addressId === 'new' && saveAddress,
          idempotencyKey: idemKey,
        })
      ).data;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: CART_KEY });
      sessionStorage.removeItem('nutrio_selected');
      sessionStorage.setItem(`nutrio_order_${r.order.orderNumber}`, JSON.stringify(r));
      if (r.payment.redirectUrl) {
        window.location.href = r.payment.redirectUrl;
        return;
      }
      router.replace(`/checkout/success?order=${r.order.orderNumber}`);
    },
    onError: (e) => {
      toast.error(apiError(e));
      quoteQ.refetch();
    },
  });

  if (!itemIds.length)
    return <div className="container-page py-16"><EmptyState title="Chưa chọn sản phẩm để thanh toán" action={<Link href="/cart" className="font-semibold text-forest-700 underline">Quay lại giỏ hàng</Link>} /></div>;
  if (quoteQ.isError)
    return <div className="container-page py-16"><ErrorState message={apiError(quoteQ.error)} onRetry={() => router.push('/cart')} /></div>;

  const next = async () => {
    if (step === 0) {
      if (!user && !form.getValues('email')) form.setError('email', { message: 'Vui lòng nhập email để nhận thông tin đơn hàng' });
      const ok = await form.trigger();
      if (!ok || (!user && !form.getValues('email'))) return;
    }
    if (step === 2 && !q?.paymentMethods.find((m) => m.code === paymentMethod)?.enabled) return toast.error('Vui lòng chọn phương thức thanh toán khả dụng');
    setStep((x) => Math.min(3, x + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const info = form.watch();
  const err = form.formState.errors;

  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-3xl sm:text-4xl">Thanh toán</h1>
      {/* Stepper */}
      <ol className="mb-8 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button disabled={i > step} onClick={() => setStep(i)} className="group w-full cursor-pointer text-left disabled:cursor-default">
              <div className={cn('h-1.5 rounded-full transition', i <= step ? 'bg-forest-600' : 'bg-sand-200')} />
              <div className={cn('mt-2 flex items-center gap-1.5 text-xs font-semibold sm:text-sm', i <= step ? 'text-forest-700' : 'text-muted')}>
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]', i < step ? 'bg-forest-600 text-white' : i === step ? 'border-2 border-forest-600' : 'border border-sand-300')}>{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-7">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="flex items-center gap-2 font-sans text-xl font-semibold"><MapPin className="h-5 w-5 text-forest-600" /> Thông tin nhận hàng</h2>
              {!user && <Notice>Đã có tài khoản? <Link href={`/login?next=${encodeURIComponent(`/checkout?items=${itemIds.join(',')}`)}`} className="font-semibold underline">Đăng nhập</Link> để dùng sổ địa chỉ, voucher thành viên và tích điểm.</Notice>}
              {user && !!addresses.data?.length && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {addresses.data.map((a) => (
                    <button key={a.id} type="button" onClick={() => setAddressId(a.id)} className={cn('cursor-pointer rounded-2xl border p-4 text-left text-sm', addressId === a.id ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-100' : 'border-line hover:border-forest-300')}>
                      <div className="font-semibold">{a.recipientName} {a.isDefault && <span className="ml-1 text-xs text-forest-600">(Mặc định)</span>}</div>
                      <div className="text-muted">{a.phone}</div>
                      <div className="mt-1 line-clamp-2 text-ink/80">{a.fullAddress}</div>
                    </button>
                  ))}
                  <button type="button" onClick={() => { setAddressId('new'); form.reset({ ...form.getValues(), recipientName: user.fullName, phone: user.phone ?? '', district: '', ward: '', street: '' }); }} className={cn('cursor-pointer rounded-2xl border border-dashed p-4 text-sm font-semibold', addressId === 'new' ? 'border-forest-600 bg-forest-50 text-forest-700' : 'border-sand-300 text-muted hover:text-forest-700')}>
                    + Địa chỉ mới
                  </button>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ và tên" required error={err.recipientName?.message}><Input {...form.register('recipientName')} error={err.recipientName?.message} autoComplete="name" /></Field>
                <Field label="Số điện thoại" required error={err.phone?.message}><Input {...form.register('phone')} error={err.phone?.message} inputMode="tel" autoComplete="tel" /></Field>
                <Field label="Email" required={!user} error={err.email?.message} hint="Nhận xác nhận & cập nhật trạng thái đơn" className="sm:col-span-2"><Input {...form.register('email')} type="email" error={err.email?.message} disabled={!!user} autoComplete="email" /></Field>
                <Field label="Tỉnh / Thành phố" required error={err.province?.message}>
                  <Select {...form.register('province')} error={err.province?.message}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</Select>
                </Field>
                <Field label="Quận / Huyện" required error={err.district?.message}><Input {...form.register('district')} error={err.district?.message} placeholder="VD: Quận 1" /></Field>
                <Field label="Phường / Xã" required error={err.ward?.message}><Input {...form.register('ward')} error={err.ward?.message} placeholder="VD: Phường Bến Nghé" /></Field>
                <Field label="Địa chỉ chi tiết" required error={err.street?.message}><Input {...form.register('street')} error={err.street?.message} placeholder="Số nhà, tên đường" autoComplete="street-address" /></Field>
                <Field label="Ghi chú đơn hàng" className="sm:col-span-2"><Textarea {...form.register('note')} placeholder="VD: Giao giờ hành chính, gọi trước khi giao…" maxLength={500} /></Field>
              </div>
              {user && addressId === 'new' && <Checkbox checked={saveAddress} onChange={setSaveAddress} label="Lưu địa chỉ này vào sổ địa chỉ" />}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-sans text-xl font-semibold"><Truck className="h-5 w-5 text-forest-600" /> Phương thức vận chuyển</h2>
              {!s ? <Spinner /> : s.shippingOptions.map((o) => (
                <label key={o.id} className={cn('flex cursor-pointer items-center gap-4 rounded-2xl border p-4', shippingMethodId === o.id ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-100' : 'border-line hover:border-forest-300')}>
                  <input type="radio" name="ship" checked={shippingMethodId === o.id} onChange={() => setShipping(o.id)} className="h-4 w-4 accent-forest-600" />
                  <div className="flex-1">
                    <div className="font-semibold">{o.name} <span className="text-sm font-normal text-muted">· {o.carrier}</span></div>
                    <div className="text-sm text-muted">Dự kiến {o.estHoursMax && o.estHoursMax <= 6 ? `${o.estHoursMin}–${o.estHoursMax} giờ` : `${Math.ceil((o.estHoursMin ?? 24) / 24)}–${Math.ceil((o.estHoursMax ?? 72) / 24)} ngày`}{o.freeShipThreshold ? ` · Miễn phí từ ${formatPrice(o.freeShipThreshold)}` : ''}</div>
                  </div>
                  <div className="text-right font-semibold">{o.fee ? formatPrice(o.fee) : <span className="text-forest-700">Miễn phí</span>}{o.fee !== o.baseFee && o.fee === 0 && <div className="text-xs text-muted line-through">{formatPrice(o.baseFee)}</div>}</div>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-sans text-xl font-semibold"><CreditCard className="h-5 w-5 text-forest-600" /> Phương thức thanh toán</h2>
              {q?.paymentMethods.map((m) => {
                const Icon = PAY_ICON[m.code] ?? Wallet;
                return (
                  <label key={m.code} className={cn('flex items-center gap-4 rounded-2xl border p-4', !m.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', paymentMethod === m.code ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-100' : 'border-line hover:border-forest-300')}>
                    <input type="radio" name="pay" disabled={!m.enabled} checked={paymentMethod === m.code} onChange={() => setPayment(m.code)} className="h-4 w-4 accent-forest-600" />
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-50 text-forest-700"><Icon className="h-5 w-5" /></span>
                    <div><div className="font-semibold">{m.name}</div><div className="text-sm text-muted">{m.description}</div></div>
                  </label>
                );
              })}
              {paymentMethod === 'bank_transfer' && <Notice>Sau khi đặt hàng, bạn sẽ nhận mã VietQR và nội dung chuyển khoản. Đơn được xác nhận khi NUTRIO nhận được tiền (thường trong 15 phút giờ hành chính).</Notice>}
              {user && s && s.pointsBalance > 0 && (
                <div className="rounded-2xl border border-latte-300 bg-latte-500/5 p-4">
                  <Checkbox checked={usePoints} onChange={setUsePoints} label={<span className="flex items-center gap-1.5 font-semibold"><Sparkles className="h-4 w-4 text-latte-500" /> Dùng điểm thưởng</span>} description={`Bạn có ${s.pointsBalance} điểm · dùng tối đa ${s.maxPointsUsable} điểm (= ${formatPrice(s.maxPointsUsable * 100)}) cho đơn này`} disabled={!s.maxPointsUsable} />
                </div>
              )}
            </div>
          )}

          {step === 3 && s && q && (
            <div className="space-y-6">
              <h2 className="font-sans text-xl font-semibold">Xác nhận đơn hàng</h2>
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div className="rounded-2xl bg-sand-50 p-4"><div className="mb-1 font-semibold">Người nhận</div>{info.recipientName}<br />{info.phone}<br />{info.email}</div>
                <div className="rounded-2xl bg-sand-50 p-4"><div className="mb-1 font-semibold">Giao đến</div>{[info.street, info.ward, info.district, info.province].join(', ')}{info.note && <div className="mt-1 text-muted">“{info.note}”</div>}</div>
                <div className="rounded-2xl bg-sand-50 p-4"><div className="mb-1 font-semibold">Vận chuyển & thanh toán</div>{s.shippingOptions.find((o) => o.id === shippingMethodId)?.name}<br />{q.paymentMethods.find((m) => m.code === paymentMethod)?.name}</div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-line text-left text-muted"><th className="py-2 font-medium">Sản phẩm</th><th className="py-2 text-center font-medium">SL</th><th className="hidden py-2 text-right font-medium sm:table-cell">Đơn giá</th><th className="py-2 text-right font-medium">Thành tiền</th></tr></thead>
                <tbody>
                  {q.items.map((it) => (
                    <tr key={it.cartItemId} className="border-b border-line">
                      <td className="py-3"><div className="flex items-center gap-3"><SmartImage src={it.image} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" /><div><div className="font-medium">{it.name}</div><div className="text-xs text-muted">{it.variantName}</div></div></div></td>
                      <td className="py-3 text-center">{it.quantity}</td>
                      <td className="hidden py-3 text-right sm:table-cell">{formatPrice(it.unitPrice)}</td>
                      <td className="py-3 text-right font-semibold">{formatPrice(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!s.allInStock && <Notice tone="danger">Một số sản phẩm vừa hết hàng. Vui lòng quay lại giỏ hàng để cập nhật.</Notice>}
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3 border-t border-line pt-5">
            {step > 0 ? <Button variant="outline" onClick={() => setStep(step - 1)}>Quay lại</Button> : <Link href="/cart" className="self-center text-sm font-semibold text-forest-700">← Giỏ hàng</Link>}
            {step < 3 ? (
              <Button onClick={next} disabled={!s}>Tiếp tục</Button>
            ) : (
              <Button size="lg" loading={place.isPending} disabled={!s?.allInStock} onClick={() => place.mutate()}>
                <Lock className="h-4 w-4" /> Đặt hàng · {s && formatPrice(s.totalAmount)}
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="mb-4 font-sans text-lg font-semibold">Đơn hàng ({s?.itemCount ?? '…'} sản phẩm)</h2>
            {!q ? <Skeleton className="h-40" /> : (
              <>
                <ul className="mb-4 max-h-60 space-y-3 overflow-y-auto pr-1">
                  {q.items.map((it) => (
                    <li key={it.cartItemId} className="flex gap-3 text-sm">
                      <div className="relative shrink-0"><SmartImage src={it.image} alt="" width={52} height={52} className="h-13 w-13 rounded-lg object-cover" /><span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] text-white">{it.quantity}</span></div>
                      <div className="min-w-0 flex-1"><div className="line-clamp-2 font-medium">{it.name}</div><div className="text-xs text-muted">{it.variantName}</div></div>
                      <div className="font-semibold">{formatPrice(it.lineTotal)}</div>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd>{formatPrice(s!.subtotal)}</dd></div>
                  {s!.memberDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Ưu đãi hạng {s!.tier?.name}</dt><dd className="text-sale">-{formatPrice(s!.memberDiscount)}</dd></div>}
                  {s!.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Mã {s!.coupon?.code}</dt><dd className="text-sale">-{formatPrice(s!.couponDiscount)}</dd></div>}
                  {s!.coupon?.discountType === 'free_shipping' && <div className="flex justify-between"><dt className="text-muted">Mã {s!.coupon.code}</dt><dd className="text-forest-700">Miễn phí ship</dd></div>}
                  {s!.pointsDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Điểm thưởng ({s!.pointsUsed})</dt><dd className="text-sale">-{formatPrice(s!.pointsDiscount)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-muted">Phí vận chuyển</dt><dd>{s!.shippingFee ? formatPrice(s!.shippingFee) : 'Miễn phí'}</dd></div>
                  <div className="flex justify-between text-xs text-muted"><dt>Khối lượng</dt><dd>{formatWeight(s!.totalWeightG)}</dd></div>
                  <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">Tổng cộng</dt><dd className="text-2xl font-bold text-forest-700">{formatPrice(s!.totalAmount)}</dd></div>
                  {s!.couponError && <p className="text-xs text-danger">Mã giảm giá không còn áp dụng: {s!.couponError}</p>}
                </dl>
              </>
            )}
          </div>
          {s && <NutritionWidget totals={s.nutrition} compact />}
        </aside>
      </div>
    </div>
  );
}
