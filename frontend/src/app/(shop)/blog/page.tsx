'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { get } from '@/lib/api';
import type { Paged, PostCard } from '@/types';
import { PostCardView } from '@/components/home/sections';
import { ChipGroup } from '@/components/ui/form';
import { EmptyState, ProductGridSkeleton } from '@/components/ui/feedback';
import { Pagination } from '@/components/ui/misc';

export default function BlogPage() {
  const [cat, setCat] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['posts', cat, page], queryFn: () => get<Paged<PostCard> & { categories: { name: string; slug: string }[] }>('/posts', { page, category: cat ?? undefined }) });
  return (
    <div className="container-page py-8">
      <h1 className="text-4xl sm:text-5xl">Kiến thức dinh dưỡng</h1>
      <p className="mt-3 mb-6 text-muted">Bài viết được chuyên gia dinh dưỡng thẩm định.</p>
      <ChipGroup className="mb-8" value={cat} onChange={(v) => { setCat(v); setPage(1); }} options={(q.data?.categories ?? []).map((c) => ({ value: c.slug, label: c.name }))} />
      {q.isLoading ? <ProductGridSkeleton count={6} /> : !q.data?.data.length ? <EmptyState title="Chưa có bài viết" /> : (
        <>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{q.data.data.map((p) => <PostCardView key={p.id} post={p} />)}</div>
          <div className="mt-10"><Pagination page={page} totalPages={q.data.meta.totalPages} onChange={setPage} /></div>
        </>
      )}
    </div>
  );
}
