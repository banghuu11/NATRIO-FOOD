import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { Breadcrumbs, RichText } from '@/components/ui/misc';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
const LINKS = [['gioi-thieu', 'Về NUTRIO'], ['chinh-sach-giao-hang', 'Chính sách giao hàng'], ['chinh-sach-doi-tra', 'Chính sách đổi trả'], ['chinh-sach-bao-mat', 'Chính sách bảo mật'], ['huong-dan-mua-hang', 'Hướng dẫn mua hàng']];

async function load(slug: string) {
  try {
    const r = await fetch(`${API}/pages/${slug}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as { title: string; content: string; updatedAt: string }) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: PageProps<'/pages/[slug]'>): Promise<Metadata> {
  const p = await load((await props.params).slug);
  return { title: p?.title ?? 'Thông tin' };
}

export default async function CmsPage(props: PageProps<'/pages/[slug]'>) {
  const { slug } = await props.params;
  const p = await load(slug);
  if (!p) notFound();
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: p.title }]} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="h-fit space-y-1 rounded-2xl border border-line bg-white p-2">
          {LINKS.map(([s, l]) => <Link key={s} href={`/pages/${s}`} className={`block rounded-xl px-3 py-2 text-sm ${s === slug ? 'bg-forest-50 font-semibold text-forest-700' : 'hover:bg-sand-50'}`}>{l}</Link>)}
        </nav>
        <article className="rounded-3xl border border-line bg-white p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-xs text-muted">Cập nhật {formatDate(p.updatedAt)}</p>
          <RichText text={p.content} className="mt-6" />
        </article>
      </div>
    </div>
  );
}
