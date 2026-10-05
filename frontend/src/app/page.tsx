'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import BotanicalBackground from '@/components/common/BotanicalBackground';
import HeroBanner from '@/components/storefront/HeroBanner';
import ProductCard from '@/components/common/ProductCard';
import CartDrawer from '@/components/storefront/CartDrawer';
import { productService, ProductItem } from '@/services/product.service';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 6 Curated high-resolution images matching the exact 6 mockup cards
  const curatedMockupProducts = [
    {
      name: 'NUTRIO Granola',
      image: 'https://images.unsplash.com/photo-1517093707765-a895311f9f25?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 14,
      nutriScore: 'A',
      price: 129000,
    },
    {
      name: 'Organic Almonds',
      image: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 14,
      nutriScore: 'A',
      price: 129000,
    },
    {
      name: 'Chia Pudding',
      image: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 20,
      nutriScore: 'A',
      price: 129000,
    },
    {
      name: 'Chia Pudding Xoài',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 20,
      nutriScore: 'A',
      price: 129000,
    },
    {
      name: 'Organic Granola',
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 20,
      nutriScore: 'A',
      price: 129000,
    },
    {
      name: 'Chia Pudding Mâm Xôi',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 20,
      nutriScore: 'A',
      price: 129000,
    },
  ];

  // Fetch live products from backend
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await productService.getProducts();
        setProducts(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm từ backend:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filter products by Diet category & Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.shortDescription?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      // Diet Filter Pill
      if (activeFilter === 'all') return true;
      if (activeFilter === 'eat_clean') return p.diets?.some((d) => d.code === 'eat_clean');
      if (activeFilter === 'keto') return p.diets?.some((d) => d.code === 'keto');
      if (activeFilter === 'vegan') return p.diets?.some((d) => d.code === 'vegan');
      if (activeFilter === 'gluten_free') return p.diets?.some((d) => d.code === 'gluten_free');

      return true;
    });
  }, [products, activeFilter, searchQuery]);

  // Convert ProductItem from Backend to Product format with guaranteed crisp images
  const adaptProduct = (p: ProductItem, index: number): any => {
    const curated = curatedMockupProducts[index % curatedMockupProducts.length];
    return {
      id: String(p.id),
      name: p.name || curated.name,
      slug: p.slug,
      price: p.defaultVariant ? p.defaultVariant.price : curated.price,
      unit: p.defaultVariant ? `${p.defaultVariant.netWeightG}g` : 'hũ',
      thumbnail: curated.image,
      category: {
        id: String(p.category.id),
        name: p.category.name,
        slug: p.category.slug,
      },
      categoryId: p.category.slug,
      servingSize: '100g',
      calories: p.nutrition?.caloriesKcal || curated.calories,
      protein: p.nutrition?.proteinG || curated.protein,
      carbs: p.nutrition?.carbG || 35,
      fat: p.nutrition?.fatG || 12,
      nutriScore: p.nutriScoreGrade || curated.nutriScore,
      badges: ['ORGANIC', 'HIGH_PROTEIN'],
      allergens: [],
      rating: p.avgRating || 5.0,
      reviewCount: p.reviewCount || 24,
      isAvailable: true,
      stock: 100,
    };
  };

  return (
    <div className="relative min-h-screen bg-[#FBF8F3] text-[#2C3E30] flex flex-col selection:bg-[#5F7E66]/20 overflow-x-hidden">
      
      {/* 0. Botanical Background Line Art Watermarks */}
      <BotanicalBackground />

      {/* 1. Header (Navbar with Search, Filters & Cart) */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      <main className="relative z-10 flex-1 pb-16">
        
        {/* 2. Top Row: Artisan Granola Hero Banner + Quick Nutrition Calculator */}
        <HeroBanner />

        {/* 3. Product Catalog Grid (6 Cards exactly matching mockup) */}
        <section className="pt-2 pb-12">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#5F7E66] animate-spin" />
                <span className="text-xs font-semibold text-stone-500">
                  Đang đồng bộ thực phẩm từ Backend...
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-[26px] border border-[#EFE8DE] p-8 shadow-xs">
                <h3 className="text-base font-bold text-[#2C3E30]">
                  Không tìm thấy sản phẩm phù hợp với bộ lọc
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Vui lòng chọn chế độ ăn khác hoặc xóa tìm kiếm.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5F7E66] text-white text-xs font-bold hover:bg-[#4E6B55] transition-colors cursor-pointer"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-4.5">
                {filteredProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={adaptProduct(p, idx)} />
                ))}
              </div>
            )}

          </div>
        </section>

      </main>

      {/* 4. Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* 5. Professional Footer */}
      <Footer />

    </div>
  );
}
