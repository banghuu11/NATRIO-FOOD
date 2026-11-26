'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useUi } from '@/stores/ui';
import type { Paged } from '@/types';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { ButtonLink } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Spinner } from '@/components/ui/feedback';
import { Badge, NutriScore, Pagination, SmartImage } from '@/components/ui/misc';

interface Row { id: number; name: string; slug: string; image: string; category: string; status: string; isFeatured: boolean; nutriScoreGrade: string | null; price: number | null; compareAtPrice: number | null; variantCount: number; stock: number; lowStock: boolean; soldCount: number; avgRating: number }
const STATUS: Record<string, [string, 'green' | 'neutral' | 'warning' | 'danger']> = { active: ['Đang bán', 'green'], inactive: ['Đã ẩn', 'neutral'], draft: ['Nháp', 'warning'], discontinued: ['Ngừng bán', 'danger'] };

export default function AdminProducts() {
  const can = useAuth((s) => s.can);
  const ask = useUi((s) => s.ask);
  const [qText, setQText] = useState('');
  const [f, setF] = useState({ q: '', categoryId: '', status: '', page: 1 });
  const meta = useQuery({ queryKey: ['admin-catalog-meta'], queryFn: () => get<{ categories: { id: number; name: string; parentId: number | null }[] }>('/admin/catalog/meta') });
  const q = useQuery({ queryKey: ['admin-products', f], queryFn: () => get<Paged<Row>>('/admin/products', { q: f.q || undefined, categoryId: f.categoryId || undefined, status: f.status || undefined, page: f.page }), placeholderData: keepPreviousData });
  const vis = useMutation({ mutationFn: ({ id, visible }: { id: number; visible: boolean }) => api.patch(`/admin/products/${id}/visibility`, { visible }), onSuccess: (r) => { toast.success((r.data as { message: string }).message); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/products/${id}`), onSuccess: () => { toast.success('Đã xóa sản phẩm'); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const write = can('product.write');

  return (
    <div>
      <PageHeader title="Sản phẩm" description={`${q.data?.meta.total ?? '…'} sản phẩm`} actions={write && <ButtonLink href="/admin/products/new"><Plus className="h-4 w-4" /> Thêm sản phẩm</ButtonLink>} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 p-4">
          <form className="min-w-56 flex-1" onSubmit={(e) => { e.preventDefault(); setF({ ...f, q: qText, page: 1 }); }}><Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Tên sản phẩm hoặc SKU…" leftIcon={<Search className="h-4 w-4" />} /></form>
          <Select className="w-52" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value, page: 1 })}><option value="">Tất cả danh mục</option>{meta.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>)}</Select>
          <Select className="w-40" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}><option value="">Mọi trạng thái</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</Select>
        </div>
        {q.isLoading ? <Spinner /> : (
          <Table head={['Sản phẩm', 'Danh mục', 'Giá bán', 'Tồn kho', 'Đã bán', 'Trạng thái', '']} empty={!q.data?.data.length}>
            {q.data?.data.map((p) => (
              <tr key={p.id} className="hover:bg-sand-50/60">
                <td className="px-4 py-2.5"><div className="flex items-center gap-3"><SmartImage src={p.image} alt="" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" /><div><Link href={`/admin/products/${p.id}`} className="font-medium hover:text-forest-700">{p.name}</Link><div className="flex items-center gap-2 text-xs text-muted">{p.variantCount} quy cách <NutriScore grade={p.nutriScoreGrade} />{p.isFeatured && <Badge tone="dark">Nổi bật</Badge>}</div></div></div></td>
                <td className="px-4 text-muted">{p.category}</td>
                <td className="px-4 whitespace-nowrap"><b>{formatPrice(p.price)}</b>{p.compareAtPrice && <div className="text-xs text-muted line-through">{formatPrice(p.compareAtPrice)}</div>}</td>
                <td className={cn('px-4 font-semibold', p.lowStock ? 'text-danger' : '')}>{p.stock}{p.lowStock && <div className="text-[11px] font-normal">Sắp hết</div>}</td>
                <td className="px-4">{p.soldCount}</td>
                <td className="px-4"><Badge tone={STATUS[p.status]?.[1]}>{STATUS[p.status]?.[0]}</Badge></td>
                <td className="px-4">
                  {write && (
                    <div className="flex justify-end gap-1">
                      <button onClick={() => vis.mutate({ id: p.id, visible: p.status !== 'active' })} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-sand-100" title={p.status === 'active' ? 'Ẩn' : 'Hiển thị'}>{p.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      <Link href={`/admin/products/${p.id}`} className="rounded-lg p-2 text-muted hover:bg-sand-100" title="Sửa"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={async () => (await ask({ title: `Xóa “${p.name}”?`, description: 'Sản phẩm sẽ bị gỡ khỏi cửa hàng và giỏ hàng của khách. Lịch sử đơn hàng vẫn được giữ nguyên.', confirmLabel: 'Xóa sản phẩm', tone: 'danger' })).ok && del.mutate(p.id)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {q.data && <div className="border-t border-line p-4"><Pagination page={f.page} totalPages={q.data.meta.totalPages} onChange={(page) => setF({ ...f, page })} /></div>}
      </Card>
    </div>
  );
}
