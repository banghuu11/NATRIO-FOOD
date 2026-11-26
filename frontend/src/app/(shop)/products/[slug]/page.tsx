import type { Metadata } from 'next';
import { ProductDetailView } from './detail';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export async function generateMetadata(props: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const res = await fetch(`${API}/products/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return { title: 'Sản phẩm' };
    const p = await res.json();
    return { title: p.metaTitle?.replace(' | NUTRIO', '') || p.name, description: p.metaDescription || p.shortDescription, openGraph: { images: p.image?.startsWith('/') ? [p.image] : [] } };
  } catch {
    return { title: 'Sản phẩm' };
  }
}

export default async function ProductPage(props: PageProps<'/products/[slug]'>) {
  const { slug } = await props.params;
  return <ProductDetailView key={slug} slug={slug} />;
}
