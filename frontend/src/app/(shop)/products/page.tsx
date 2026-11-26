import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProductListing } from './listing';
import { ProductGridSkeleton } from '@/components/ui/feedback';

export const metadata: Metadata = { title: 'Cửa hàng hạt dinh dưỡng & granola', description: 'Hạt Macca, Hạnh nhân, Óc chó, Hạt điều, Granola, Mix hạt, sản phẩm Keto, Eat Clean và cho người tập gym.' };

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-page py-10"><ProductGridSkeleton /></div>}>
      <ProductListing />
    </Suspense>
  );
}
