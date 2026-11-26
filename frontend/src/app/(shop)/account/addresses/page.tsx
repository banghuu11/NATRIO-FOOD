'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { PHONE_RE, PROVINCES } from '@/lib/vn-provinces';
import { useUi } from '@/stores/ui';
import type { Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';

type Form = Omit<Address, 'id' | 'fullAddress'>;
const empty: Form = { label: 'Nhà riêng', recipientName: '', phone: '', province: 'TP. Hồ Chí Minh', district: '', ward: '', street: '', isDefault: false };

export default function AddressesPage() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['addresses'], queryFn: () => get<Address[]>('/account/addresses') });
  const [editing, setEditing] = useState<{ id?: number; form: Form } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => (editing!.id ? api.put(`/account/addresses/${editing!.id}`, editing!.form) : api.post('/account/addresses', editing!.form)),
    onSuccess: () => {
      toast.success('Đã lưu địa chỉ');
      setEditing(null);
      q.refetch();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/account/addresses/${id}`), onSuccess: () => { toast.success('Đã xóa địa chỉ'); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });

  const submit = () => {
    const f = editing!.form;
    const e: Record<string, string> = {};
    if (f.recipientName.trim().length < 2) e.recipientName = 'Vui lòng nhập tên người nhận';
    if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
    if (f.district.trim().length < 2) e.district = 'Vui lòng nhập Quận/Huyện';
    if (f.ward.trim().length < 2) e.ward = 'Vui lòng nhập Phường/Xã';
    if (f.street.trim().length < 5) e.street = 'Vui lòng nhập địa chỉ chi tiết';
    setErrors(e);
    if (!Object.keys(e).length) save.mutate();
  };
  const set = (k: keyof Form, v: string | boolean) => setEditing((x) => x && { ...x, form: { ...x.form, [k]: v } });

  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl">Sổ địa chỉ</h1>
        <Button size="sm" onClick={() => { setErrors({}); setEditing({ form: { ...empty } }); }}><Plus className="h-4 w-4" /> Thêm địa chỉ</Button>
      </div>
      {q.isLoading ? <Spinner /> : !q.data?.length ? (
        <EmptyState icon={<MapPin className="h-8 w-8" />} title="Chưa có địa chỉ" description="Lưu địa chỉ để đặt hàng nhanh hơn." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {q.data.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-semibold">{a.recipientName} {a.isDefault && <Badge tone="green" className="ml-1">Mặc định</Badge>}</div><div className="text-muted">{a.label} · {a.phone}</div></div>
                <div className="flex">
                  <button onClick={() => { setErrors({}); setEditing({ id: a.id, form: { label: a.label, recipientName: a.recipientName, phone: a.phone, province: a.province, district: a.district, ward: a.ward, street: a.street, isDefault: a.isDefault } }); }} className="cursor-pointer p-1.5 text-muted hover:text-forest-700" aria-label="Sửa"><Pencil className="h-4 w-4" /></button>
                  <button onClick={async () => (await ask({ title: 'Xóa địa chỉ này?', description: a.fullAddress, confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(a.id)} className="cursor-pointer p-1.5 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-2 text-ink/80">{a.fullAddress}</p>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} size="lg" footer={<><Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button><Button loading={save.isPending} onClick={submit}>Lưu</Button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên gợi nhớ"><Input value={editing.form.label ?? ''} onChange={(e) => set('label', e.target.value)} placeholder="Nhà riêng, Công ty…" /></Field>
            <Field label="Người nhận" required error={errors.recipientName}><Input value={editing.form.recipientName} onChange={(e) => set('recipientName', e.target.value)} error={errors.recipientName} /></Field>
            <Field label="Số điện thoại" required error={errors.phone}><Input value={editing.form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} /></Field>
            <Field label="Tỉnh / Thành phố" required><Select value={editing.form.province} onChange={(e) => set('province', e.target.value)}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            <Field label="Quận / Huyện" required error={errors.district}><Input value={editing.form.district} onChange={(e) => set('district', e.target.value)} error={errors.district} /></Field>
            <Field label="Phường / Xã" required error={errors.ward}><Input value={editing.form.ward} onChange={(e) => set('ward', e.target.value)} error={errors.ward} /></Field>
            <Field label="Địa chỉ chi tiết" required error={errors.street} className="sm:col-span-2"><Input value={editing.form.street} onChange={(e) => set('street', e.target.value)} error={errors.street} /></Field>
            <Checkbox checked={editing.form.isDefault} onChange={(v) => set('isDefault', v)} label="Đặt làm địa chỉ mặc định" />
          </div>
        )}
      </Modal>
    </div>
  );
}
