'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Spinner } from '@/components/ui/feedback';
import { Badge, SmartImage } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';
import { ImageUploader } from '@/components/shop/image-uploader';

interface Cat { id: number; parentId: number | null; name: string; slug: string; description: string | null; imageUrl: string | null; sortOrder: number; isActive: boolean; productCount: number; childCount: number }
type Form = { name: string; slug: string; parentId: number | null; description: string; imageUrl: string | null; sortOrder: number; isActive: boolean };

export default function AdminCategories() {
  const can = useAuth((s) => s.can)('category.write');
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-categories'], queryFn: () => get<Cat[]>('/admin/categories') });
  const [edit, setEdit] = useState<{ id?: number; f: Form } | null>(null);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const body = { ...edit!.f, slug: edit!.f.slug || undefined, description: edit!.f.description || undefined };
      return edit!.id ? api.put(`/admin/categories/${edit!.id}`, body) : api.post('/admin/categories', body);
    },
    onSuccess: () => { toast.success('Đã lưu danh mục'); setEdit(null); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/categories/${id}`), onSuccess: () => { toast.success('Đã xóa danh mục'); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });

  const rows = q.data ?? [];
  const roots = rows.filter((c) => !c.parentId);
  const ordered = roots.flatMap((r) => [r, ...rows.filter((c) => c.parentId === r.id)]);
  const set = (k: keyof Form, v: unknown) => setEdit((x) => x && { ...x, f: { ...x.f, [k]: v } });

  return (
    <div>
      <PageHeader title="Danh mục" description="Quản lý danh mục cha / con hiển thị trên cửa hàng." actions={can && <Button onClick={() => { setErr(''); setEdit({ f: { name: '', slug: '', parentId: null, description: '', imageUrl: null, sortOrder: 0, isActive: true } }); }}><Plus className="h-4 w-4" /> Thêm danh mục</Button>} />
      <Card padded={false}>
        {q.isLoading ? <Spinner /> : (
          <Table head={['Danh mục', 'Slug', 'Sản phẩm', 'Thứ tự', 'Trạng thái', '']} empty={!rows.length}>
            {ordered.map((c) => (
              <tr key={c.id} className="hover:bg-sand-50/60">
                <td className="px-4 py-2.5"><div className={`flex items-center gap-3 ${c.parentId ? 'pl-8' : ''}`}><SmartImage src={c.imageUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" /><span className={c.parentId ? '' : 'font-semibold'}>{c.parentId && '└ '}{c.name}</span></div></td>
                <td className="px-4 font-mono text-xs text-muted">{c.slug}</td>
                <td className="px-4">{c.productCount}</td>
                <td className="px-4">{c.sortOrder}</td>
                <td className="px-4"><Badge tone={c.isActive ? 'green' : 'neutral'}>{c.isActive ? 'Hiển thị' : 'Ẩn'}</Badge></td>
                <td className="px-4">{can && (
                  <div className="flex justify-end gap-1">
                    <button onClick={() => { setErr(''); setEdit({ id: c.id, f: { name: c.name, slug: c.slug, parentId: c.parentId, description: c.description ?? '', imageUrl: c.imageUrl, sortOrder: c.sortOrder, isActive: c.isActive } }); }} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-sand-100" aria-label="Sửa"><Pencil className="h-4 w-4" /></button>
                    <button onClick={async () => (await ask({ title: `Xóa danh mục “${c.name}”?`, description: c.productCount || c.childCount ? 'Danh mục còn sản phẩm hoặc danh mục con – hệ thống sẽ từ chối xóa.' : 'Không thể hoàn tác.', confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(c.id)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa danh mục' : 'Thêm danh mục'} size="lg" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => { if (edit!.f.name.trim().length < 2) return setErr('Tên tối thiểu 2 ký tự'); setErr(''); save.mutate(); }}>Lưu</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên danh mục" required error={err}><Input value={edit.f.name} onChange={(e) => set('name', e.target.value)} error={err} /></Field>
            <Field label="Slug" hint="Để trống để tự tạo"><Input value={edit.f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} /></Field>
            <Field label="Danh mục cha"><Select value={edit.f.parentId ?? ''} onChange={(e) => set('parentId', e.target.value ? Number(e.target.value) : null)}><option value="">— Danh mục gốc —</option>{roots.filter((r) => r.id !== edit.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
            <Field label="Thứ tự hiển thị"><Input type="number" value={edit.f.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} /></Field>
            <Field label="Mô tả" className="sm:col-span-2"><Textarea value={edit.f.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Hình ảnh"><ImageUploader value={edit.f.imageUrl ? [edit.f.imageUrl] : []} onChange={(u) => set('imageUrl', u[0] ?? null)} max={1} /></Field>
            <Checkbox checked={edit.f.isActive} onChange={(v) => set('isActive', v)} label="Hiển thị trên cửa hàng" />
          </div>
        )}
      </Modal>
    </div>
  );
}
