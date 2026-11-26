'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { apiError, get } from '@/lib/api';
import { PageHeader } from '@/components/admin/kit';
import { ProductForm, type ProductFormValue } from '@/components/admin/product-form';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { NutriScore } from '@/components/ui/misc';

type P = ProductFormValue & { id: number; nutriScoreGrade: string | null };

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['admin-product', id], queryFn: () => get<P>(`/admin/products/${id}`), refetchOnMount: 'always' });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorState message={apiError(q.error)} />;
  const p = q.data;
  const initial: ProductFormValue = {
    ...p,
    slug: p.slug ?? '',
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    originCountry: p.originCountry ?? '',
    storageInstruction: p.storageInstruction ?? '',
    usageInstruction: p.usageInstruction ?? '',
    metaTitle: p.metaTitle ?? '',
    metaDescription: p.metaDescription ?? '',
    nutrition: p.nutrition ?? { servingSizeG: 30, caloriesKcal: '', proteinG: '', carbG: '', fatG: '', sugarG: 0, fiberG: 0, saturatedFatG: 0, sodiumMg: 0 },
    variants: p.variants.map((v) => ({ ...v, unitLabel: v.unitLabel ?? 'gói' })),
  };
  return (
    <div>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-700"><ArrowLeft className="h-4 w-4" /> Sản phẩm</Link>
      <PageHeader title={p.name} description={<span className="inline-flex items-center gap-2">Nutri-Score hiện tại <NutriScore grade={p.nutriScoreGrade} /></span>} actions={<Link href={`/products/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700">Xem trên cửa hàng <ExternalLink className="h-4 w-4" /></Link>} />
      <ProductForm key={q.dataUpdatedAt} initial={initial} id={p.id} />
    </div>
  );
}
