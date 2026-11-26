'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import type { Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { QuantityStepper } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';
import { Notice, Spinner } from '@/components/ui/feedback';

interface Plan {
  id: number;
  name: string;
  everyDays: number;
  discountPercent: number;
  description: string | null;
}

export function SubscribeModal({ open, onClose, variant }: { open: boolean; onClose: () => void; variant: { id: number; name: string; price: number } }) {
  const plans = useQuery({ queryKey: ['sub-plans'], queryFn: () => get<Plan[]>('/subscriptions/plans') });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => get<Address[]>('/account/addresses') });
  const [planChoice, setPlanId] = useState<number | null>(null);
  const [addressChoice, setAddressId] = useState<number | null>(null);
  const planId = planChoice ?? plans.data?.[0]?.id ?? null;
  const addressId = addressChoice ?? addresses.data?.find((a) => a.isDefault)?.id ?? addresses.data?.[0]?.id ?? null;
  const [qty, setQty] = useState(1);
  const [tomorrow] = useState(() => new Date(Date.now() + 864e5).toISOString().slice(0, 10));
  const [start, setStart] = useState(tomorrow);
  const plan = plans.data?.find((p) => p.id === planId);

  const create = useMutation({
    mutationFn: () => api.post('/subscriptions', { planId, addressId, startDate: start, items: [{ variantId: variant.id, quantity: qty }] }),
    onSuccess: () => {
      toast.success('Đã đăng ký giao hàng định kỳ');
      onClose();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Giao hàng định kỳ" size="lg">
      {plans.isLoading || addresses.isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-sand-50 p-3 text-sm"><b>{variant.name}</b> · {formatPrice(variant.price)}</div>
          <div>
            <div className="mb-2 text-sm font-medium">Tần suất giao</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {plans.data?.map((p) => (
                <button key={p.id} onClick={() => setPlanId(p.id)} className={cn('cursor-pointer rounded-xl border p-3 text-left', planId === p.id ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-100' : 'border-line hover:border-forest-300')}>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs font-semibold text-sale">Giảm {p.discountPercent}%</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Số lượng mỗi lần"><QuantityStepper value={qty} onChange={setQty} max={20} /></Field>
            <Field label="Ngày giao đầu tiên"><Input type="date" min={tomorrow} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          </div>
          {addresses.data?.length ? (
            <Field label="Địa chỉ giao hàng">
              <div className="space-y-2">
                {addresses.data.map((a) => (
                  <label key={a.id} className={cn('flex cursor-pointer gap-3 rounded-xl border p-3 text-sm', addressId === a.id ? 'border-forest-600 bg-forest-50' : 'border-line')}>
                    <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="accent-forest-600" />
                    <span><b>{a.recipientName}</b> · {a.phone}<span className="block text-muted">{a.fullAddress}</span></span>
                  </label>
                ))}
              </div>
            </Field>
          ) : (
            <Notice tone="warning">Bạn chưa có địa chỉ. <Link href="/account/addresses" className="font-semibold underline">Thêm địa chỉ</Link> trước khi đăng ký.</Notice>
          )}
          {plan && (
            <Notice>
              Mỗi {plan.everyDays} ngày, hệ thống tự tạo đơn COD với giá <b>{formatPrice(Math.round(variant.price * qty * (1 - plan.discountPercent / 100)))}</b> (đã giảm {plan.discountPercent}%, chưa gồm phí ship). Bạn có thể tạm dừng, bỏ qua một kỳ hoặc hủy bất cứ lúc nào.
            </Notice>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button disabled={!planId || !addressId} loading={create.isPending} onClick={() => create.mutate()}>Đăng ký</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
