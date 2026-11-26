'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { get } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Paged } from '@/types';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { Input, Select } from '@/components/ui/form';
import { Spinner } from '@/components/ui/feedback';
import { Badge, Pagination } from '@/components/ui/misc';

interface Row { id: number; fullName: string; email: string; phone: string | null; isActive: boolean; createdAt: string; tier: string | null; points: number; orders: number; spent: number; lastOrderAt: string | null; segment: { code: string; label: string } }
const SEG_TONE: Record<string, 'green' | 'brown' | 'warning' | 'neutral' | 'dark'> = { vip: 'dark', loyal: 'green', regular: 'brown', dormant: 'warning', new: 'green', prospect: 'neutral' };

export default function AdminCustomers() {
  const [qText, setQText] = useState('');
  const [f, setF] = useState({ q: '', status: '', tier: '', sort: 'recent', page: 1 });
  const q = useQuery({ queryKey: ['admin-customers', f], queryFn: () => get<Paged<Row>>('/admin/customers', { ...f, q: f.q || undefined, status: f.status || undefined, tier: f.tier || undefined }), placeholderData: keepPreviousData });
  return (
    <div>
      <PageHeader title="Khách hàng" description={`${q.data?.meta.total ?? '…'} khách hàng · chi tiêu tính trên đơn giao thành công`} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 p-4">
          <form className="min-w-56 flex-1" onSubmit={(e) => { e.preventDefault(); setF({ ...f, q: qText, page: 1 }); }}><Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Tên, email, số điện thoại…" leftIcon={<Search className="h-4 w-4" />} /></form>
          <Select className="w-40" value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value, page: 1 })}><option value="">Mọi hạng</option><option value="member">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option></Select>
          <Select className="w-40" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}><option value="">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option></Select>
          <Select className="w-44" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value, page: 1 })}><option value="recent">Mới đăng ký</option><option value="spent">Chi tiêu cao nhất</option><option value="orders">Nhiều đơn nhất</option></Select>
        </div>
        {q.isLoading ? <Spinner /> : (
          <Table head={['Khách hàng', 'Phân loại', 'Hạng / điểm', 'Đơn thành công', 'Tổng chi tiêu', 'Mua gần nhất', 'Trạng thái']} empty={!q.data?.data.length}>
            {q.data?.data.map((c) => (
              <tr key={c.id} className="hover:bg-sand-50/60">
                <td className="px-4 py-2.5"><Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-forest-700">{c.fullName}</Link><div className="text-xs text-muted">{c.email} {c.phone && `· ${c.phone}`}</div></td>
                <td className="px-4"><Badge tone={SEG_TONE[c.segment.code]}>{c.segment.label}</Badge></td>
                <td className="px-4">{c.tier ?? '—'} <span className="text-xs text-muted">· {c.points} điểm</span></td>
                <td className="px-4">{c.orders}</td>
                <td className="px-4 font-semibold">{formatPrice(c.spent)}</td>
                <td className="px-4 text-muted">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                <td className="px-4"><Badge tone={c.isActive ? 'green' : 'danger'}>{c.isActive ? 'Hoạt động' : 'Đã khóa'}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
        {q.data && <div className="border-t border-line p-4"><Pagination page={f.page} totalPages={q.data.meta.totalPages} onChange={(page) => setF({ ...f, page })} /></div>}
      </Card>
    </div>
  );
}
