'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, MessageSquareText, Store, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import type { Paged, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Pagination, SmartImage, StarInput, Stars } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';
import { ImageUploader } from './image-uploader';

interface Eligible {
  orderItemId: number;
  orderNumber: string;
  productId: number;
  name: string;
  variantName: string | null;
  image: string;
}

export function ReviewForm({ item, onClose, onDone }: { item: Eligible; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const send = useMutation({
    mutationFn: () => api.post('/reviews', { orderItemId: item.orderItemId, rating, title: title || undefined, content, images }),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đánh giá!');
      onDone();
      onClose();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  return (
    <Modal open onClose={onClose} title="Đánh giá sản phẩm" size="lg">
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-sand-50 p-3">
        <SmartImage src={item.image} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
        <div><div className="font-semibold">{item.name}</div><div className="text-xs text-muted">{item.variantName} · Đơn {item.orderNumber}</div></div>
      </div>
      <div className="space-y-4">
        <Field label="Bạn đánh giá sản phẩm thế nào?" required><StarInput value={rating} onChange={setRating} /></Field>
        <Field label="Tiêu đề"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="VD: Hạt giòn, thơm" /></Field>
        <Field label="Nhận xét" required error={err}>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} error={err} placeholder="Chia sẻ trải nghiệm: hương vị, độ giòn, đóng gói, giao hàng…" className="min-h-32" />
        </Field>
        <Field label="Hình ảnh (tối đa 5)"><ImageUploader value={images} onChange={setImages} /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button
          loading={send.isPending}
          onClick={() => {
            if (content.trim().length < 10) return setErr('Nhận xét cần ít nhất 10 ký tự');
            setErr('');
            send.mutate();
          }}
        >
          Gửi đánh giá
        </Button>
      </div>
    </Modal>
  );
}

export function Reviews({ productId, productSlug, avg, count, distribution, onChanged }: { productId: number; productSlug: string; avg: number; count: number; distribution: { star: number; count: number }[]; onChanged: () => void }) {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [page, setPage] = useState(1);
  const [star, setStar] = useState<number | null>(null);
  const [withImages, setWithImages] = useState(false);
  const [writing, setWriting] = useState<Eligible | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['reviews', productId, page, star, withImages],
    queryFn: () => get<Paged<Review> & { withImagesCount: number }>(`/reviews/product/${productId}`, { page, star: star ?? undefined, withImages: withImages || undefined }),
    placeholderData: keepPreviousData,
  });
  const eligible = useQuery({ queryKey: ['review-eligible', user?.id], queryFn: () => get<Eligible[]>('/reviews/eligible'), enabled: !!user });
  const mine = eligible.data?.filter((e) => e.productId === productId) ?? [];

  const vote = useMutation({
    mutationFn: async (id: number) => (await api.post<{ voted: boolean; helpfulCount: number }>(`/reviews/${id}/helpful`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', productId] }),
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <section id="reviews" className="mt-14 scroll-mt-40">
      <h2 className="mb-6 text-3xl">Đánh giá từ khách hàng</h2>
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <div className="font-display text-5xl font-bold">{count ? avg.toFixed(1) : '—'}</div>
            <Stars value={avg} size={18} className="mt-2" />
            <div className="mt-1 text-sm text-muted">{count} đánh giá đã duyệt</div>
            <div className="mt-5 space-y-1.5">
              {distribution.map((d) => (
                <button key={d.star} onClick={() => { setStar(star === d.star ? null : d.star); setPage(1); }} className={cn('flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm', star === d.star && 'bg-forest-50')}>
                  <span className="w-8 text-left">{d.star}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${count ? (d.count / count) * 100 : 0}%` }} /></span>
                  <span className="w-7 text-right text-muted">{d.count}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-forest-50 p-5 text-sm">
            {!user ? (
              <p><Link href={`/login?next=/products/${productSlug}`} className="font-semibold text-forest-700 underline">Đăng nhập</Link> để đánh giá sản phẩm bạn đã mua.</p>
            ) : mine.length ? (
              <div className="space-y-2">
                <p className="font-medium">Bạn đã mua sản phẩm này – hãy chia sẻ cảm nhận!</p>
                {mine.map((m) => <Button key={m.orderItemId} size="sm" className="w-full" onClick={() => setWriting(m)}>Viết đánh giá (đơn {m.orderNumber})</Button>)}
              </div>
            ) : (
              <p className="text-ink/75">Chỉ khách hàng đã nhận hàng thành công mới có thể đánh giá – giúp mọi đánh giá đều là trải nghiệm thật.</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {[null, 5, 4, 3, 2, 1].map((s) => (
              <button key={String(s)} onClick={() => { setStar(s); setPage(1); }} className={cn('cursor-pointer rounded-full border px-3.5 py-1.5 text-sm', star === s && !withImages ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white hover:border-forest-300')}>
                {s ? `${s} sao` : 'Tất cả'}
              </button>
            ))}
            <button onClick={() => { setWithImages(!withImages); setPage(1); }} className={cn('cursor-pointer rounded-full border px-3.5 py-1.5 text-sm', withImages ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white hover:border-forest-300')}>
              Có hình ảnh ({list.data?.withImagesCount ?? 0})
            </button>
          </div>
          {list.isLoading ? (
            <Spinner />
          ) : !list.data?.data.length ? (
            <EmptyState icon={<MessageSquareText className="h-8 w-8" />} title="Chưa có đánh giá phù hợp" description="Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này." />
          ) : (
            <ul className="space-y-4">
              {list.data.data.map((r) => (
                <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-forest-100 font-bold text-forest-700">
                      {r.avatarUrl ? <SmartImage src={r.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 object-cover" /> : r.author.charAt(0)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {r.author}
                        {r.isVerifiedPurchase && <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-semibold text-forest-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified Buyer</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted"><Stars value={r.rating} size={12} /> {formatDate(r.createdAt)} {r.variantName && `· ${r.variantName}`}</div>
                    </div>
                  </div>
                  {r.title && <div className="mt-3 font-semibold">{r.title}</div>}
                  {r.content && <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line text-ink/85">{r.content}</p>}
                  {r.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {r.images.map((u) => (
                        <button key={u} onClick={() => setLightbox(u)} className="relative h-20 w-20 cursor-zoom-in overflow-hidden rounded-xl"><SmartImage src={u} alt="Ảnh khách hàng" fill sizes="80px" className="object-cover" /></button>
                      ))}
                    </div>
                  )}
                  {r.adminReply && (
                    <div className="mt-3 rounded-xl bg-sand-50 p-3 text-sm"><div className="mb-1 flex items-center gap-1.5 font-semibold text-forest-700"><Store className="h-4 w-4" /> Phản hồi từ NUTRIO</div>{r.adminReply}</div>
                  )}
                  <button
                    onClick={() => (user ? vote.mutate(r.id) : toast.info('Đăng nhập để bình chọn'))}
                    className={cn('mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', r.votedHelpful ? 'bg-forest-50 text-forest-700' : 'text-muted hover:bg-sand-50')}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> Hữu ích ({r.helpfulCount})
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list.data && <div className="mt-6"><Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} /></div>}
        </div>
      </div>
      {writing && (
        <ReviewForm
          item={writing}
          onClose={() => setWriting(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ['reviews', productId] });
            qc.invalidateQueries({ queryKey: ['review-eligible'] });
            onChanged();
          }}
        />
      )}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="xl">
        {lightbox && <div className="relative aspect-square w-full"><SmartImage src={lightbox} alt="" fill sizes="80vw" className="object-contain" /></div>}
      </Modal>
    </section>
  );
}
