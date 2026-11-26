'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { MessageSquareText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useUi } from '@/stores/ui';
import type { Review } from '@/types';
import { Button } from '@/components/ui/button';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Badge, SmartImage, Stars, Tabs } from '@/components/ui/misc';
import { ReviewForm } from '@/components/shop/reviews';

interface Eligible { orderItemId: number; orderNumber: string; productId: number; name: string; variantName: string | null; image: string; slug: string }

export default function MyReviewsPage() {
  const ask = useUi((s) => s.ask);
  const [tab, setTab] = useState<'todo' | 'done'>('todo');
  const [writing, setWriting] = useState<Eligible | null>(null);
  const todo = useQuery({ queryKey: ['review-eligible'], queryFn: () => get<Eligible[]>('/reviews/eligible') });
  const done = useQuery({ queryKey: ['my-reviews'], queryFn: () => get<Review[]>('/reviews/mine') });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/reviews/${id}`), onSuccess: () => { toast.success('Đã xóa đánh giá'); done.refetch(); todo.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const statusLabel: Record<string, [string, 'green' | 'warning' | 'danger']> = { approved: ['Đã hiển thị', 'green'], pending: ['Chờ duyệt', 'warning'], rejected: ['Đã ẩn (vi phạm)', 'danger'] };

  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h1 className="mb-4 text-2xl">Đánh giá của tôi</h1>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'todo', label: 'Chờ đánh giá', count: todo.data?.length ?? 0 }, { value: 'done', label: 'Đã đánh giá', count: done.data?.length ?? 0 }]} />
      <div className="mt-5">
        {tab === 'todo' ? (
          todo.isLoading ? <Spinner /> : !todo.data?.length ? <EmptyState icon={<MessageSquareText className="h-8 w-8" />} title="Không có sản phẩm chờ đánh giá" description="Sau khi nhận hàng thành công, sản phẩm sẽ xuất hiện ở đây." /> : (
            <ul className="space-y-3">
              {todo.data.map((e) => (
                <li key={e.orderItemId} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <SmartImage src={e.image} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1 text-sm"><div className="font-medium">{e.name}</div><div className="text-xs text-muted">{e.variantName} · Đơn {e.orderNumber}</div></div>
                  <Button size="sm" onClick={() => setWriting(e)}>Viết đánh giá</Button>
                </li>
              ))}
            </ul>
          )
        ) : done.isLoading ? <Spinner /> : !done.data?.length ? <EmptyState title="Bạn chưa viết đánh giá nào" /> : (
          <ul className="space-y-3">
            {done.data.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <SmartImage src={r.product.image} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${r.product.slug}`} className="font-medium hover:text-forest-700">{r.product.name}</Link>
                    <div className="flex items-center gap-2 text-xs text-muted"><Stars value={r.rating} size={12} /> {formatDate(r.createdAt)} <Badge tone={statusLabel[r.status]?.[1] ?? 'neutral'}>{statusLabel[r.status]?.[0]}</Badge></div>
                    {r.title && <div className="mt-2 text-sm font-semibold">{r.title}</div>}
                    <p className="text-sm text-ink/85">{r.content}</p>
                    {r.adminReply && <p className="mt-2 rounded-lg bg-sand-50 p-2 text-xs"><b>NUTRIO:</b> {r.adminReply}</p>}
                  </div>
                  <button onClick={async () => (await ask({ title: 'Xóa đánh giá này?', confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(r.id)} className="cursor-pointer p-1.5 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {writing && <ReviewForm item={writing} onClose={() => setWriting(null)} onDone={() => { todo.refetch(); done.refetch(); }} />}
    </div>
  );
}
