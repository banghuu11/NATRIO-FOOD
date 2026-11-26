'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Bundle, ProductCard } from '@/types';
import { ShopByNeed } from '@/components/home/sections';
import { ProductGrid } from '@/components/shop/product-card';
import { ProductGridSkeleton } from '@/components/ui/feedback';
import { SectionTitle } from '@/components/ui/misc';

export default function CombosPage() {
  const bundles = useQuery({ queryKey: ['bundles'], queryFn: () => get<Bundle[]>('/promotions/bundles') });
  const gifts = useQuery({ queryKey: ['gift-products'], queryFn: () => get<{ data: ProductCard[] }>('/products', { category: 'combo-dinh-duong', limit: 12 }) });
  return (
    <div className="py-8">
      <div className="container-page max-w-2xl">
        <h1 className="text-4xl sm:text-5xl">Combo dinh dưỡng</h1>
        <p className="mt-3 text-muted">Bộ sản phẩm phối sẵn theo nhu cầu – tiết kiệm đến 14% so với mua lẻ.</p>
      </div>
      {bundles.isLoading ? <div className="container-page mt-8"><ProductGridSkeleton count={4} /></div> : <ShopByNeed bundles={bundles.data ?? []} />}
      <section className="container-page mt-14">
        <SectionTitle title="Hộp quà & set tiện lợi" />
        {gifts.isLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={gifts.data?.data ?? []} />}
      </section>
    </div>
  );
}
