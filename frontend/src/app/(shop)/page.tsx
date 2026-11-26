'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Banner, Bundle, CategoryNode, PostCard, ProductCard, Recipe, Review } from '@/types';
import { Hero } from '@/components/home/hero';
import { BlogRow, CategoryTiles, ConsultSection, FlashSale, NewsletterBand, ProductRow, RecipesRow, ShopByNeed, Testimonials, WhyNutrio } from '@/components/home/sections';
import { ErrorState, ProductGridSkeleton } from '@/components/ui/feedback';

interface Home {
  heroBanners: Banner[];
  promoBanners: Banner[];
  categories: CategoryNode[];
  featured: ProductCard[];
  bestSellers: ProductCard[];
  newest: ProductCard[];
  bundles: Bundle[];
  recipes: Recipe[];
  posts: PostCard[];
  testimonials: Review[];
  flashSale: { name: string; endsAt: string; items: (ProductCard & { salePrice: number; quantityLimit: number; soldCount: number })[] } | null;
}

export default function HomePage() {
  const { data, isLoading, isError, refetch, error } = useQuery({ queryKey: ['home'], queryFn: () => get<Home>('/home') });

  if (isError) return <div className="container-page py-20"><ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /></div>;

  return (
    <>
      <Hero banners={data?.heroBanners ?? []} loading={isLoading} />
      {isLoading || !data ? (
        <div className="container-page mt-14"><ProductGridSkeleton /></div>
      ) : (
        <>
          <CategoryTiles categories={data.categories} />
          {data.flashSale && data.flashSale.items.length > 0 && <FlashSale sale={data.flashSale} />}
          <ProductRow eyebrow="Tuyển chọn" title="Sản phẩm nổi bật" products={data.featured} href="/products?featured=true" />
          <ShopByNeed bundles={data.bundles} />
          <ProductRow eyebrow="Được yêu thích" title="Bán chạy nhất tuần" products={data.bestSellers} href="/products?sort=best_selling" />
          <WhyNutrio />
          <ProductRow eyebrow="Vừa lên kệ" title="Sản phẩm mới" products={data.newest} href="/products?sort=newest" />
          <ConsultSection />
          <RecipesRow recipes={data.recipes} />
          <Testimonials reviews={data.testimonials} />
          <BlogRow posts={data.posts} />
          <NewsletterBand />
        </>
      )}
    </>
  );
}
