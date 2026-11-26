import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { PostCard } from '@/types';
import { PostCardView } from '@/components/home/sections';
import { Breadcrumbs, RichText, SmartImage } from '@/components/ui/misc';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
type Post = PostCard & { content: string; viewCount: number; related: PostCard[] };

async function load(slug: string): Promise<Post | null> {
  try {
    const r = await fetch(`${API}/posts/${slug}`, { cache: 'no-store' });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const p = await load((await props.params).slug);
  return p ? { title: p.title, description: p.summary ?? undefined } : { title: 'Bài viết' };
}

export default async function PostPage(props: PageProps<'/blog/[slug]'>) {
  const p = await load((await props.params).slug);
  if (!p) notFound();
  return (
    <article className="container-page max-w-3xl py-6">
      <Breadcrumbs items={[{ label: 'Kiến thức', href: '/blog' }, { label: p.title }]} />
      <div className="mt-6 text-sm font-semibold text-latte-500 uppercase">{p.category?.name}</div>
      <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{p.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>{p.author}</span><span>{formatDate(p.publishedAt)}</span><span>{p.readMinutes} phút đọc</span>
        {p.expertReviewer && <span className="flex items-center gap-1 text-forest-700"><BadgeCheck className="h-4 w-4" /> Thẩm định: {p.expertReviewer}</span>}
      </div>
      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl"><SmartImage src={p.coverImage} alt={p.title} fill priority sizes="768px" className="object-cover" /></div>
      {p.summary && <p className="mt-8 text-lg leading-relaxed font-medium text-ink/90">{p.summary}</p>}
      <RichText text={p.content} className="mt-6 text-[17px]" />
      <p className="mt-10 rounded-2xl bg-sand-50 p-4 text-sm text-muted">Nội dung mang tính tham khảo, không thay thế chẩn đoán hay tư vấn của bác sĩ.</p>
      {p.related.length > 0 && (
        <section className="mt-12"><h2 className="mb-5 text-2xl">Bài viết liên quan</h2><div className="grid gap-6 sm:grid-cols-3">{p.related.map((r) => <PostCardView key={r.id} post={r} />)}</div></section>
      )}
    </article>
  );
}
