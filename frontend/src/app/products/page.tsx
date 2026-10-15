'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/common/Header';
// import Footer from '@/components/common/Footer';
import ProductCard from '@/components/common/ProductCard';
import CartDrawer from '@/components/storefront/CartDrawer';
import { productService, ProductItem } from '@/services/product.service';
import { Loader2, Search, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';

const ScrollNut3D = dynamic(() => import('@/components/storefront/ScrollNut3D'), {
  ssr: false,
});

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiet, setActiveDiet] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Mockup fallback catalog items
  const fallbackProducts = [
    {
      name: 'NUTRIO Granola Siêu Hạt Mộc',
      image: 'https://images.unsplash.com/photo-1517093707765-a895311f9f25?auto=format&fit=crop&w=600&q=85',
      calories: 345,
      protein: 14,
      nutriScore: 'A',
      price: 129000,
      categorySlug: 'granola',
    },
    {
      name: 'Hạt Hạnh Nhân Sấy Mộc Mỹ',
      image: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?auto=format&fit=crop&w=600&q=85',
      calories: 579,
      protein: 21,
      nutriScore: 'A',
      price: 145000,
      categorySlug: 'nuts',
    },
    {
      name: 'Hạt Macca Tây Nguyên Nứt Vỏ',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=85',
      calories: 718,
      protein: 8,
      nutriScore: 'A',
      price: 165000,
      categorySlug: 'nuts',
    },
    {
      name: 'Hạt Điều Bình Phước Rang Củi',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=85',
      calories: 553,
      protein: 18,
      nutriScore: 'B',
      price: 135000,
      categorySlug: 'nuts',
    },
    {
      name: 'Chia Pudding Hạt Chia Hữu Cơ',
      image: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=600&q=85',
      calories: 210,
      protein: 12,
      nutriScore: 'A',
      price: 79000,
      categorySlug: 'pudding',
    },
    {
      name: 'Chia Pudding Xoài Cát Chu',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=85',
      calories: 225,
      protein: 10,
      nutriScore: 'A',
      price: 85000,
      categorySlug: 'pudding',
    },
    {
      name: 'Granola Berry Mix Quả Mọng',
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=85',
      calories: 360,
      protein: 13,
      nutriScore: 'A',
      price: 139000,
      categorySlug: 'granola',
    },
    {
      name: 'Hạt Óc Chó Chandler Nhập Khẩu',
      image: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?auto=format&fit=crop&w=600&q=85',
      calories: 654,
      protein: 15,
      nutriScore: 'A',
      price: 175000,
      categorySlug: 'nuts',
    },
  ];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await productService.getProducts();
        setProducts(res.data || []);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products.length > 0 ? products : [];

    // Filter by search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.shortDescription?.toLowerCase().includes(q));
    }

    // Filter by diet
    if (activeDiet !== 'all') {
      list = list.filter((p) => p.diets?.some((d: any) => d.code === activeDiet));
    }

    // Sort
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => (a.defaultVariant?.price || 0) - (b.defaultVariant?.price || 0));
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => (b.defaultVariant?.price || 0) - (a.defaultVariant?.price || 0));
    }

    return list;
  }, [products, activeDiet, searchQuery, sortBy]);

  const adaptProduct = (p: ProductItem, index: number): any => {
    const fallback = fallbackProducts[index % fallbackProducts.length];
    return {
      id: String(p.id),
      name: p.name || fallback.name,
      slug: p.slug,
      price: p.defaultVariant ? p.defaultVariant.price : fallback.price,
      unit: p.defaultVariant ? `${p.defaultVariant.netWeightG}g` : 'hũ',
      thumbnail: fallback.image,
      category: {
        id: String(p.category?.id || 1),
        name: p.category?.name || 'Ngũ Cốc',
        slug: p.category?.slug || 'granola',
      },
      categoryId: p.category?.slug || 'granola',
      servingSize: '100g',
      calories: p.nutrition?.caloriesKcal || fallback.calories,
      protein: p.nutrition?.proteinG || fallback.protein,
      carbs: p.nutrition?.carbG || 35,
      fat: p.nutrition?.fatG || 12,
      nutriScore: p.nutriScoreGrade || fallback.nutriScore,
      badges: ['ORGANIC', 'HIGH_PROTEIN'],
      allergens: [],
      rating: p.avgRating || 5.0,
      reviewCount: p.reviewCount || 24,
      isAvailable: true,
      stock: 100,
    };
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* 3D Nut Scroll Animation */}
      <ScrollNut3D />

      {/* Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      <main className="flex-1 pb-20">
        
        {/* Page Banner */}
        <section className="pt-8 pb-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              MENU DINH DƯỠNG NUTRIO
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
              Tất Cả Sản Phẩm Hạt Hữu Cơ & Khẩu Phần Ăn Sạch
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              100% hạt sấy mộc nguyên vị, không dầu chiên, chuẩn hóa định lượng calo & protein theo tiêu chuẩn Nutri-Score Châu Âu.
            </p>
          </div>
        </section>

        {/* Filter & Toolbar */}
        <section className="py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#090D16] sticky top-20 z-20 backdrop-blur-md">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Diet Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Chế độ ăn:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'eat_clean', label: 'Eat Clean' },
                { id: 'keto', label: 'Keto' },
                { id: 'vegan', label: 'Thuần Chay' },
                { id: 'gluten_free', label: 'Không Gluten' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveDiet(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeDiet === f.id
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort & Search */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lọc tên sản phẩm..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
              >
                <option value="featured">Nổi bật nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>

          </div>
        </section>

        {/* Product Grid */}
        <section className="pt-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Đang tải danh mục sản phẩm...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1">Vui lòng thử chọn chế độ ăn khác hoặc xóa từ khóa tìm kiếm.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDiet('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-4.5">
                {filteredProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={adaptProduct(p, idx)} />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      {/* <Footer /> */}

    </div>
  );
}
