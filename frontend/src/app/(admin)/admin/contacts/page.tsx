'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Mail, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, PageHeader } from '@/components/admin/kit';
import { Button } from '@/components/ui/button';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/misc';

interface C { id: number; name: string; email: string; subject: string | null; message: string; isResolved: boolean; createdAt: string }

export default function AdminContacts() {
  const q = useQuery({ queryKey: ['admin-contacts'], queryFn: () => get<C[]>('/admin/contacts') });
  const res = useMutation({ mutationFn: ({ id, resolved }: { id: number; resolved: boolean }) => api.patch(`/admin/contacts/${id}`, { resolved }), onSuccess: () => { toast.success('Đã cập nhật'); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const open = q.data?.filter((c) => !c.isResolved).length ?? 0;
  return (
    <div>
      <PageHeader title="Yêu cầu tư vấn dinh dưỡng" description={`${open} yêu cầu đang chờ xử lý`} />
      <Card>
        {q.isLoading ? <Spinner /> : !q.data?.length ? <EmptyState title="Chưa có yêu cầu nào" /> : (
          <ul className="space-y-3">
            {q.data.map((c) => (
              <li key={c.id} className={`rounded-2xl border p-4 ${c.isResolved ? 'border-line opacity-70' : 'border-amber-200 bg-amber-50/40'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm"><b>{c.name}</b> · <a href={`mailto:${c.email}`} className="text-forest-700 hover:underline">{c.email}</a> · <span className="text-muted">{formatDate(c.createdAt, true)}</span> {c.subject && <Badge>{c.subject}</Badge>}</div>
                  <div className="flex gap-2">
                    <a href={`mailto:${c.email}?subject=${encodeURIComponent(`NUTRIO phản hồi: ${c.subject ?? 'Tư vấn dinh dưỡng'}`)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold"><Mail className="h-4 w-4" /> Trả lời</a>
                    <Button size="sm" variant={c.isResolved ? 'ghost' : 'secondary'} onClick={() => res.mutate({ id: c.id, resolved: !c.isResolved })}>{c.isResolved ? <><RotateCcw className="h-4 w-4" /> Mở lại</> : <><CheckCircle2 className="h-4 w-4" /> Đã xử lý</>}</Button>
                  </div>
                </div>
                <p className="mt-2 text-sm whitespace-pre-line">{c.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
