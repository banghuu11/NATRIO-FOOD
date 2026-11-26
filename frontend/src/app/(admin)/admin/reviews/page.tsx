'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, EyeOff, MessageSquareReply, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useUi } from '@/stores/ui';
import type { Paged } from '@/types';
import { Card, PageHeader } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Badge, Pagination, SmartImage, Stars, Tabs } from '@/components/ui/misc';

interface R { id: number; product: string; productSlug: string; author: string; email: string; rating: number; title: string | null; content: string | null; images: string[]; status: string; isVerifiedPurchase: boolean; adminReply: string | null; helpfulCount: number; createdAt: string }
const ST: Record<string, [string, 'green' | 'warning' | 'danger']> = { approved: ['Đang hiển thị', 'green'], pending: ['Chờ duyệt', 'warning'], rejected: ['Đã ẩn', 'danger'] };

export default function AdminReviews() {
  const ask = useUi((s) => s.ask);
  const [status, setStatus] = useState('pending');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin-reviews', status, rating, page], queryFn: () => get<Paged<R>>('/admin/reviews', { status: status === 'all' ? undefined : status, rating: rating || undefined, page }), placeholderData: keepPreviousData });
  const mod = useMutation({ mutationFn: ({ id, ...body }: { id: number; status?: string; adminReply?: string }) => api.patch(`/admin/reviews/${id}`, body), onSuccess: () => { toast.success('Đã cập nhật đánh giá'); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });

  return (
    <div>
      <PageHeader title="Đánh giá sản phẩm" description="Duyệt, ẩn đánh giá vi phạm và phản hồi khách hàng. Đánh giá chỉ đến từ người đã nhận hàng." />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 px-4 pt-3">
          <Tabs className="flex-1" value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={[{ value: 'pending', label: 'Chờ duyệt' }, { value: 'approved', label: 'Đang hiển thị' }, { value: 'rejected', label: 'Đã ẩn' }, { value: 'all', label: 'Tất cả' }]} />
          <Select className="w-36" value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }}><option value="">Mọi số sao</option>{[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}</Select>
        </div>
        <div className="p-4">
          {q.isLoading ? <Spinner /> : !q.data?.data.length ? <EmptyState title="Không có đánh giá" /> : (
            <ul className="space-y-3">
              {q.data.data.map((r) => (
                <li key={r.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm"><b>{r.author}</b><span className="text-muted">{r.email}</span>{r.isVerifiedPurchase && <Badge tone="green"><BadgeCheck className="h-3 w-3" /> Đã mua</Badge>}<Badge tone={ST[r.status][1]}>{ST[r.status][0]}</Badge></div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted"><Stars value={r.rating} size={12} /> {formatDate(r.createdAt, true)} · <Link href={`/products/${r.productSlug}`} target="_blank" className="text-forest-700 hover:underline">{r.product}</Link> · {r.helpfulCount} hữu ích</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status !== 'approved' && <Button size="sm" onClick={() => mod.mutate({ id: r.id, status: 'approved' })}><ShieldCheck className="h-4 w-4" /> Hiển thị</Button>}
                      {r.status !== 'rejected' && <Button size="sm" variant="outline" className="text-danger" onClick={async () => (await ask({ title: 'Ẩn đánh giá vi phạm?', description: 'Khách hàng sẽ nhận thông báo rằng đánh giá bị ẩn.', confirmLabel: 'Ẩn đánh giá', tone: 'danger' })).ok && mod.mutate({ id: r.id, status: 'rejected' })}><EyeOff className="h-4 w-4" /> Ẩn</Button>}
                      <Button size="sm" variant="ghost" onClick={async () => { const x = await ask({ title: 'Phản hồi khách hàng', confirmLabel: 'Gửi phản hồi', input: { label: 'Nội dung phản hồi (hiển thị công khai)', required: true } }); if (x.ok) mod.mutate({ id: r.id, adminReply: x.value }); }}><MessageSquareReply className="h-4 w-4" /> Phản hồi</Button>
                    </div>
                  </div>
                  {r.title && <div className="mt-2 font-semibold">{r.title}</div>}
                  <p className="text-sm text-ink/85">{r.content}</p>
                  {r.images.length > 0 && <div className="mt-2 flex gap-2">{r.images.map((u) => <SmartImage key={u} src={u} alt="" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />)}</div>}
                  {r.adminReply && <div className="mt-2 rounded-lg bg-sand-50 p-2 text-sm"><b>NUTRIO:</b> {r.adminReply}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
        {q.data && <div className="border-t border-line p-4"><Pagination page={page} totalPages={q.data.meta.totalPages} onChange={setPage} /></div>}
      </Card>
    </div>
  );
}
