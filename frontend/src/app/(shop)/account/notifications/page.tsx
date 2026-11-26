'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Bell, Gift, Package, Tag } from 'lucide-react';
import { api, get } from '@/lib/api';
import { cn, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState, Spinner } from '@/components/ui/feedback';

interface N { id: number; type: string; title: string; body: string | null; data: { orderId?: number; productSlug?: string }; isRead: boolean; createdAt: string }
const ICON: Record<string, typeof Bell> = { order: Package, price_drop: Tag, promotion: Gift };

export default function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications', 'list'], queryFn: () => get<{ unread: number; data: N[] }>('/account/notifications') });
  const read = useMutation({
    mutationFn: (id?: number) => api.post(`/account/notifications/read${id ? `?id=${id}` : ''}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl">Thông báo {q.data?.unread ? <span className="text-base text-sale">({q.data.unread} mới)</span> : null}</h1>
        {!!q.data?.unread && <Button size="sm" variant="ghost" onClick={() => read.mutate(undefined)}>Đánh dấu đã đọc tất cả</Button>}
      </div>
      {q.isLoading ? <Spinner /> : !q.data?.data.length ? <EmptyState icon={<Bell className="h-8 w-8" />} title="Chưa có thông báo" /> : (
        <ul className="space-y-2">
          {q.data.data.map((n) => {
            const Icon = ICON[n.type] ?? Bell;
            const href = n.data?.orderId ? `/account/orders/${n.data.orderId}` : n.data?.productSlug ? `/products/${n.data.productSlug}` : null;
            const body = (
              <div className={cn('flex gap-3 rounded-2xl p-3.5 transition', n.isRead ? 'hover:bg-sand-50' : 'bg-forest-50/70 hover:bg-forest-50')}>
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', n.isRead ? 'bg-sand-100 text-muted' : 'bg-forest-600 text-white')}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1 text-sm"><div className={cn(!n.isRead && 'font-semibold')}>{n.title}</div>{n.body && <div className="text-ink/75">{n.body}</div>}<div className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</div></div>
              </div>
            );
            return <li key={n.id} onClick={() => !n.isRead && read.mutate(n.id)}>{href ? <Link href={href}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
