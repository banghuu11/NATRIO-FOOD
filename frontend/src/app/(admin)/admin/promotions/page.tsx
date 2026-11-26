'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { useUi } from '@/stores/ui';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { VariantSelect } from '@/components/admin/variant-picker';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Notice, Spinner } from '@/components/ui/feedback';
import { Badge, Tabs } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';
import { ImageUploader } from '@/components/shop/image-uploader';

interface Coupon { id: number; code: string; description: string | null; discountType: 'percent' | 'fixed_amount' | 'free_shipping'; discountValue: number; maxDiscountAmount: number | null; minOrderAmount: number; usageLimit: number | null; usageLimitPerUser: number; usedCount: number; firstOrderOnly: boolean; minTierCode: string | null; minTier: string | null; startsAt: string; endsAt: string | null; isActive: boolean; state: string }
interface Bundle { id: number; name: string; description: string | null; imageUrl: string | null; price: number; retailPrice: number; isActive: boolean; startsAt: string | null; endsAt: string | null; items: { variantId: number; quantity: number; name: string }[] }
interface Flash { id: number; name: string; startsAt: string; endsAt: string; isActive: boolean; items: { variantId: number; name: string; salePrice: number; regularPrice: number; quantityLimit: number; soldCount: number }[] }

const STATE: Record<string, [string, 'green' | 'neutral' | 'warning' | 'danger' | 'brown']> = { running: ['Đang chạy', 'green'], scheduled: ['Sắp diễn ra', 'brown'], expired: ['Hết hạn', 'neutral'], used_up: ['Hết lượt', 'warning'], inactive: ['Vô hiệu', 'danger'] };
const dt = (s: string | null) => (s ? new Date(new Date(s).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : '');
const iso = (s: string) => (s ? new Date(s).toISOString() : null);

export default function PromotionsPage() {
  const [tab, setTab] = useState<'coupons' | 'bundles' | 'flash'>('coupons');
  return (
    <div>
      <PageHeader title="Khuyến mãi" description="Mã giảm giá, combo và flash sale. Giá luôn được tính lại ở máy chủ khi khách đặt hàng." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'coupons', label: 'Mã giảm giá' }, { value: 'bundles', label: 'Combo' }, { value: 'flash', label: 'Flash sale' }]} />
      {tab === 'coupons' && <Coupons />}
      {tab === 'bundles' && <Bundles />}
      {tab === 'flash' && <FlashSales />}
    </div>
  );
}

function Coupons() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-coupons'], queryFn: () => get<Coupon[]>('/admin/promotions/coupons') });
  const empty = { code: '', description: '', discountType: 'percent' as Coupon['discountType'], discountValue: 10, maxDiscountAmount: '' as number | '', minOrderAmount: 0, usageLimit: '' as number | '', usageLimitPerUser: 1, firstOrderOnly: false, minTierCode: '', startsAt: dt(new Date().toISOString()), endsAt: '', isActive: true };
  const [edit, setEdit] = useState<{ id?: number; f: typeof empty } | null>(null);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const f = edit!.f;
      const body = { ...f, maxDiscountAmount: f.maxDiscountAmount === '' ? null : Number(f.maxDiscountAmount), usageLimit: f.usageLimit === '' ? null : Number(f.usageLimit), minTierCode: f.minTierCode || null, startsAt: iso(f.startsAt), endsAt: f.endsAt ? iso(f.endsAt) : null, description: f.description || undefined };
      return edit!.id ? api.put(`/admin/promotions/coupons/${edit!.id}`, body) : api.post('/admin/promotions/coupons', body);
    },
    onSuccess: () => { toast.success('Đã lưu mã giảm giá'); setEdit(null); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/promotions/coupons/${id}`), onSuccess: (r) => { toast.success((r.data as { message: string }).message); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const set = (k: keyof typeof empty, v: unknown) => setEdit((x) => x && { ...x, f: { ...x.f, [k]: v } });
  const submit = () => {
    const f = edit!.f;
    if (!/^[A-Z0-9_-]{3,40}$/.test(f.code)) return setErr('Mã gồm 3–40 ký tự in hoa, số, gạch dưới');
    if (f.discountType === 'percent' && !(f.discountValue > 0 && f.discountValue <= 100)) return setErr('Phần trăm từ 1 đến 100');
    if (f.discountType === 'fixed_amount' && f.discountValue < 1000) return setErr('Số tiền giảm tối thiểu 1.000đ');
    if (f.endsAt && new Date(f.endsAt) <= new Date(f.startsAt)) return setErr('Ngày kết thúc phải sau ngày bắt đầu');
    setErr('');
    save.mutate();
  };
  return (
    <Card title={`${q.data?.length ?? 0} mã giảm giá`} actions={<Button size="sm" onClick={() => { setErr(''); setEdit({ f: { ...empty } }); }}><Plus className="h-4 w-4" /> Tạo mã</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : (
        <Table head={['Mã', 'Giảm', 'Điều kiện', 'Đã dùng', 'Thời gian', 'Trạng thái', '']} empty={!q.data?.length}>
          {q.data?.map((c) => (
            <tr key={c.id} className="hover:bg-sand-50/60">
              <td className="px-4 py-2.5"><b className="font-mono">{c.code}</b><div className="max-w-56 truncate text-xs text-muted">{c.description}</div></td>
              <td className="px-4 font-semibold">{c.discountType === 'percent' ? `${c.discountValue}%${c.maxDiscountAmount ? ` (tối đa ${formatPrice(c.maxDiscountAmount)})` : ''}` : c.discountType === 'fixed_amount' ? formatPrice(c.discountValue) : 'Miễn phí ship'}</td>
              <td className="px-4 text-xs">Đơn từ {formatPrice(c.minOrderAmount)}{c.firstOrderOnly && <div>Đơn đầu tiên</div>}{c.minTier && <div>Hạng {c.minTier}+</div>}</td>
              <td className="px-4">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}<div className="text-xs text-muted">{c.usageLimitPerUser}/khách</div></td>
              <td className="px-4 text-xs whitespace-nowrap">{formatDate(c.startsAt)} → {c.endsAt ? formatDate(c.endsAt) : 'không hạn'}</td>
              <td className="px-4"><Badge tone={STATE[c.state]?.[1]}>{STATE[c.state]?.[0]}</Badge></td>
              <td className="px-4"><div className="flex justify-end gap-1">
                <button onClick={() => { setErr(''); setEdit({ id: c.id, f: { code: c.code, description: c.description ?? '', discountType: c.discountType, discountValue: c.discountValue, maxDiscountAmount: c.maxDiscountAmount ?? '', minOrderAmount: c.minOrderAmount, usageLimit: c.usageLimit ?? '', usageLimitPerUser: c.usageLimitPerUser, firstOrderOnly: c.firstOrderOnly, minTierCode: c.minTierCode ?? '', startsAt: dt(c.startsAt), endsAt: dt(c.endsAt), isActive: c.isActive } }); }} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-sand-100" aria-label="Sửa"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => (await ask({ title: `Xóa mã ${c.code}?`, description: c.usedCount ? 'Mã đã được sử dụng nên sẽ chuyển sang vô hiệu hóa thay vì xóa.' : undefined, confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(c.id)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
              </div></td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'} size="lg" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={submit}>Lưu</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            {err && <Notice tone="danger" className="sm:col-span-2">{err}</Notice>}
            <Field label="Mã" required><Input value={edit.f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className="font-mono" /></Field>
            <Field label="Loại giảm"><Select value={edit.f.discountType} onChange={(e) => set('discountType', e.target.value)}><option value="percent">Phần trăm</option><option value="fixed_amount">Số tiền cố định</option><option value="free_shipping">Miễn phí vận chuyển</option></Select></Field>
            {edit.f.discountType !== 'free_shipping' && <Field label={edit.f.discountType === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (₫)'}><Input type="number" value={edit.f.discountValue} onChange={(e) => set('discountValue', Number(e.target.value))} /></Field>}
            {edit.f.discountType === 'percent' && <Field label="Giảm tối đa (₫)"><Input type="number" value={edit.f.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value === '' ? '' : Number(e.target.value))} /></Field>}
            <Field label="Đơn tối thiểu (₫)"><Input type="number" value={edit.f.minOrderAmount} onChange={(e) => set('minOrderAmount', Number(e.target.value))} /></Field>
            <Field label="Tổng lượt sử dụng" hint="Để trống = không giới hạn"><Input type="number" value={edit.f.usageLimit} onChange={(e) => set('usageLimit', e.target.value === '' ? '' : Number(e.target.value))} /></Field>
            <Field label="Lượt / khách"><Input type="number" min={1} value={edit.f.usageLimitPerUser} onChange={(e) => set('usageLimitPerUser', Number(e.target.value) || 1)} /></Field>
            <Field label="Hạng tối thiểu"><Select value={edit.f.minTierCode} onChange={(e) => set('minTierCode', e.target.value)}><option value="">Mọi khách hàng</option><option value="silver">Silver</option><option value="gold">Gold</option></Select></Field>
            <Field label="Bắt đầu"><Input type="datetime-local" value={edit.f.startsAt} onChange={(e) => set('startsAt', e.target.value)} /></Field>
            <Field label="Kết thúc"><Input type="datetime-local" value={edit.f.endsAt} onChange={(e) => set('endsAt', e.target.value)} /></Field>
            <Field label="Mô tả" className="sm:col-span-2"><Input value={edit.f.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Checkbox checked={edit.f.firstOrderOnly} onChange={(v) => set('firstOrderOnly', v)} label="Chỉ cho đơn hàng đầu tiên" />
            <Checkbox checked={edit.f.isActive} onChange={(v) => set('isActive', v)} label="Kích hoạt" />
          </div>
        )}
      </Modal>
    </Card>
  );
}

function ItemRows<T extends { variantId: number | null }>({ items, onChange, render, blank }: { items: T[]; onChange: (v: T[]) => void; render: (it: T, set: (p: Partial<T>) => void) => React.ReactNode; blank: T }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2">
          <VariantSelect className="min-w-64 flex-1" value={it.variantId} onChange={(id) => onChange(items.map((x, k) => (k === i ? { ...x, variantId: id } : x)))} />
          {render(it, (p) => onChange(items.map((x, k) => (k === i ? { ...x, ...p } : x))))}
          <button onClick={() => onChange(items.filter((_, k) => k !== i))} className="cursor-pointer p-1.5 text-muted hover:text-danger" aria-label="Bỏ"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => onChange([...items, { ...blank }])}><Plus className="h-4 w-4" /> Thêm sản phẩm</Button>
    </div>
  );
}

function Bundles() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-bundles'], queryFn: () => get<Bundle[]>('/admin/promotions/bundles') });
  type F = { name: string; description: string; imageUrl: string | null; price: number | ''; isActive: boolean; items: { variantId: number | null; quantity: number }[] };
  const [edit, setEdit] = useState<{ id?: number; f: F } | null>(null);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const body = { ...edit!.f, price: Number(edit!.f.price), imageUrl: edit!.f.imageUrl ?? undefined, description: edit!.f.description || undefined, items: edit!.f.items.filter((i) => i.variantId) };
      return edit!.id ? api.put(`/admin/promotions/bundles/${edit!.id}`, body) : api.post('/admin/promotions/bundles', body);
    },
    onSuccess: () => { toast.success('Đã lưu combo'); setEdit(null); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/promotions/bundles/${id}`), onSuccess: (r) => { toast.success((r.data as { message: string }).message); q.refetch(); } });
  return (
    <Card title="Combo sản phẩm" actions={<Button size="sm" onClick={() => { setErr(''); setEdit({ f: { name: '', description: '', imageUrl: null, price: '', isActive: true, items: [{ variantId: null, quantity: 1 }, { variantId: null, quantity: 1 }] } }); }}><Plus className="h-4 w-4" /> Tạo combo</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : (
        <Table head={['Combo', 'Sản phẩm', 'Giá combo', 'Giá lẻ', 'Trạng thái', '']} empty={!q.data?.length}>
          {q.data?.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-2.5 font-medium">{b.name}</td>
              <td className="px-4 text-xs">{b.items.map((i) => <div key={i.variantId}>{i.name} ×{i.quantity}</div>)}</td>
              <td className="px-4 font-semibold">{formatPrice(b.price)}</td>
              <td className="px-4 text-muted">{formatPrice(b.retailPrice)} <span className="text-xs text-sale">(-{Math.round((1 - b.price / b.retailPrice) * 100)}%)</span></td>
              <td className="px-4"><Badge tone={b.isActive ? 'green' : 'neutral'}>{b.isActive ? 'Đang bán' : 'Ngừng'}</Badge></td>
              <td className="px-4"><div className="flex justify-end gap-1">
                <button onClick={() => { setErr(''); setEdit({ id: b.id, f: { name: b.name, description: b.description ?? '', imageUrl: b.imageUrl, price: b.price, isActive: b.isActive, items: b.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) } }); }} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-sand-100" aria-label="Sửa"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => (await ask({ title: `Xóa combo “${b.name}”?`, confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(b.id)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
              </div></td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa combo' : 'Tạo combo'} size="xl" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => { const f = edit!.f; if (f.name.trim().length < 3) return setErr('Nhập tên combo'); if (!(Number(f.price) >= 1000)) return setErr('Giá combo không hợp lệ'); if (f.items.filter((i) => i.variantId).length < 2) return setErr('Combo cần ít nhất 2 sản phẩm'); setErr(''); save.mutate(); }}>Lưu</Button></>}>
        {edit && (
          <div className="space-y-4">
            {err && <Notice tone="danger">{err}</Notice>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên combo" required><Input value={edit.f.name} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, name: e.target.value } })} /></Field>
              <Field label="Giá combo (₫)" required><Input type="number" value={edit.f.price} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, price: e.target.value === '' ? '' : Number(e.target.value) } })} /></Field>
              <Field label="Mô tả" className="sm:col-span-2"><Textarea value={edit.f.description} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, description: e.target.value } })} /></Field>
            </div>
            <Field label="Sản phẩm trong combo"><ItemRows items={edit.f.items} onChange={(items) => setEdit({ ...edit, f: { ...edit.f, items } })} blank={{ variantId: null, quantity: 1 }} render={(it, s) => <Input type="number" min={1} className="w-20" value={it.quantity} onChange={(e) => s({ quantity: Number(e.target.value) || 1 })} />} /></Field>
            <div className="flex flex-wrap items-end gap-6"><Field label="Ảnh combo"><ImageUploader value={edit.f.imageUrl ? [edit.f.imageUrl] : []} onChange={(u) => setEdit({ ...edit, f: { ...edit.f, imageUrl: u[0] ?? null } })} max={1} /></Field><Checkbox checked={edit.f.isActive} onChange={(v) => setEdit({ ...edit, f: { ...edit.f, isActive: v } })} label="Đang bán" /></div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function FlashSales() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-flash'], queryFn: () => get<Flash[]>('/admin/promotions/flash-sales') });
  type F = { name: string; startsAt: string; endsAt: string; isActive: boolean; items: { variantId: number | null; salePrice: number | ''; quantityLimit: number }[] };
  const [edit, setEdit] = useState<{ id?: number; f: F } | null>(null);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const f = edit!.f;
      const body = { name: f.name, startsAt: iso(f.startsAt), endsAt: iso(f.endsAt), isActive: f.isActive, items: f.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId, salePrice: Number(i.salePrice), quantityLimit: i.quantityLimit })) };
      return edit!.id ? api.put(`/admin/promotions/flash-sales/${edit!.id}`, body) : api.post('/admin/promotions/flash-sales', body);
    },
    onSuccess: () => { toast.success('Đã lưu flash sale'); setEdit(null); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/promotions/flash-sales/${id}`), onSuccess: () => { toast.success('Đã xóa'); q.refetch(); } });
  const [now] = useState(() => Date.now());
  return (
    <Card title="Chương trình flash sale" actions={<Button size="sm" onClick={() => { setErr(''); setEdit({ f: { name: '', startsAt: dt(new Date().toISOString()), endsAt: dt(new Date(now + 2 * 864e5).toISOString()), isActive: true, items: [{ variantId: null, salePrice: '', quantityLimit: 30 }] } }); }}><Plus className="h-4 w-4" /> Tạo flash sale</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : (
        <Table head={['Chương trình', 'Thời gian', 'Sản phẩm', 'Trạng thái', '']} empty={!q.data?.length}>
          {q.data?.map((f) => {
            const live = f.isActive && new Date(f.startsAt).getTime() <= now && new Date(f.endsAt).getTime() > now;
            return (
              <tr key={f.id}>
                <td className="px-4 py-2.5 font-medium">{f.name}</td>
                <td className="px-4 text-xs whitespace-nowrap">{formatDate(f.startsAt, true)}<br />→ {formatDate(f.endsAt, true)}</td>
                <td className="px-4 text-xs">{f.items.map((i) => <div key={i.variantId}>{i.name}: <b>{formatPrice(i.salePrice)}</b> <span className="text-muted line-through">{formatPrice(i.regularPrice)}</span> · bán {i.soldCount}/{i.quantityLimit}</div>)}</td>
                <td className="px-4"><Badge tone={live ? 'green' : 'neutral'}>{live ? 'Đang diễn ra' : new Date(f.startsAt).getTime() > now ? 'Sắp diễn ra' : 'Đã kết thúc'}</Badge></td>
                <td className="px-4"><div className="flex justify-end gap-1">
                  <button onClick={() => { setErr(''); setEdit({ id: f.id, f: { name: f.name, startsAt: dt(f.startsAt), endsAt: dt(f.endsAt), isActive: f.isActive, items: f.items.map((i) => ({ variantId: i.variantId, salePrice: i.salePrice, quantityLimit: i.quantityLimit })) } }); }} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-sand-100" aria-label="Sửa"><Pencil className="h-4 w-4" /></button>
                  <button onClick={async () => (await ask({ title: `Xóa “${f.name}”?`, confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(f.id)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            );
          })}
        </Table>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa flash sale' : 'Tạo flash sale'} size="xl" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => { const f = edit!.f; if (!f.name.trim()) return setErr('Nhập tên chương trình'); if (new Date(f.endsAt) <= new Date(f.startsAt)) return setErr('Thời gian kết thúc phải sau bắt đầu'); if (!f.items.some((i) => i.variantId && Number(i.salePrice) >= 1000)) return setErr('Thêm ít nhất 1 sản phẩm với giá sale hợp lệ'); setErr(''); save.mutate(); }}>Lưu</Button></>}>
        {edit && (
          <div className="space-y-4">
            {err && <Notice tone="danger">{err}</Notice>}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tên chương trình" required><Input value={edit.f.name} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, name: e.target.value } })} /></Field>
              <Field label="Bắt đầu"><Input type="datetime-local" value={edit.f.startsAt} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, startsAt: e.target.value } })} /></Field>
              <Field label="Kết thúc"><Input type="datetime-local" value={edit.f.endsAt} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, endsAt: e.target.value } })} /></Field>
            </div>
            <Field label="Sản phẩm (giá sale phải thấp hơn giá bán)">
              <ItemRows items={edit.f.items} onChange={(items) => setEdit({ ...edit, f: { ...edit.f, items } })} blank={{ variantId: null, salePrice: '', quantityLimit: 30 }}
                render={(it, s) => <><Input type="number" className="w-32" placeholder="Giá sale" value={it.salePrice} onChange={(e) => s({ salePrice: e.target.value === '' ? '' : Number(e.target.value) })} /><Input type="number" className="w-24" placeholder="Suất" value={it.quantityLimit} onChange={(e) => s({ quantityLimit: Number(e.target.value) || 1 })} /></>} />
            </Field>
            <Checkbox checked={edit.f.isActive} onChange={(v) => setEdit({ ...edit, f: { ...edit.f, isActive: v } })} label="Kích hoạt" />
          </div>
        )}
      </Modal>
    </Card>
  );
}
