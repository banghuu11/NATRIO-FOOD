'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ProductCard from '@/components/common/ProductCard';
import CartDrawer from '@/components/storefront/CartDrawer';
import { productService, ProductItem } from '@/services/product.service';
import { useCartStore } from '@/stores/useCartStore';
import { toast } from 'sonner';
import { removeVietnameseTones } from '@/lib/utils';
import {
  Search,
  X,
  ArrowUpDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const ScrollNut3D = dynamic(() => import('@/components/storefront/ScrollNut3D'), {
  ssr: false,
});

// ============================================================================
// COMPONENT CARD TIÊU BIỂU: RỘNG GẤP ĐÔI CARD BÌNH THƯỜNG (2-COLUMN SPAN)
// Thiết kế tối giản, sạch sẽ chuẩn Human Editorial, loại bỏ bo góc quá đà & border lồng nhau
// ============================================================================
function SpotlightProductCard({ product }: { product: any }) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`, {
      description: `Khẩu phần: ${product.servingSize || '100g'} • ${product.calories} kcal • ${product.protein}g Protein`,
    });
  };

  const nutriGrade = product.nutriScore || 'A';

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-5 group relative">
      
      {/* 1. Left: Product Image (No inner nested border box) */}
      <Link href={`/products/${product.slug}`} className="block relative w-full md:w-1/2 aspect-square md:aspect-auto rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 shrink-0 cursor-pointer">
        <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-[10px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
          TIÊU BIỂU
        </span>

        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e: any) => {
            e.target.src = 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85';
          }}
        />
      </Link>

      {/* 2. Right: Content & Nutrition Details */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          {/* Brand & Unit */}
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
            <span className="truncate">NUTRIO • {product.category?.name || 'Sản Phẩm Tiêu Biểu'}</span>
            <span className="text-slate-500 dark:text-slate-400 shrink-0 font-semibold">{product.unit || '400g'}</span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-snug group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            100% nông sản sấy mộc nhiệt thấp 60°C, giữ nguyên lớp dầu tự nhiên, giàu đạm thực vật và chất xơ hòa tan.
          </p>

          {/* Clean Understated Nutrition Info */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="font-bold text-emerald-800 dark:text-emerald-400">Nutri-Score {nutriGrade}</span>
            <span>•</span>
            <span>{product.calories} kcal/100g</span>
            <span>•</span>
            <span>{product.protein}g đạm</span>
            <span>•</span>
            <span>Không dầu chiên</span>
          </div>
        </div>

        {/* Bottom Price & Minimalist Action */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Giá niêm yết</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {typeof product.price === 'number'
                  ? `${product.price.toLocaleString('vi-VN')}₫`
                  : `${(Number(product.price) || 0).toLocaleString('vi-VN')}₫`}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {product.originalPrice.toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`px-5 py-2.5 rounded-lg font-semibold text-xs tracking-wide transition-all cursor-pointer shrink-0 active:scale-95 ${
              isAdded
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600'
            }`}
          >
            {isAdded ? 'Đã thêm' : 'Chọn mua'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// MAIN PRODUCTS PAGE
// ============================================================================
function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiet, setActiveDiet] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Đồng bộ từ khóa tìm kiếm khi URL thay đổi (VD: người dùng tìm từ Header hoặc liên kết ngoài)
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  // High-resolution clean food photography fallback catalog (Verified 200 OK)
  const fallbackProducts = [
    {
      name: 'NUTRIO Granola Siêu Hạt Mộc',
      slug: 'granola-khong-duong',
      image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85',
      calories: 420,
      protein: 14,
      nutriScore: 'A',
      price: 159000,
      originalPrice: 179000,
      categorySlug: 'snack-lanh-manh',
      categoryName: 'Snack Lành Mạnh',
      unit: '400g',
      diets: ['eat_clean', 'vegan'],
    },
    {
      name: 'Hạt Hạnh Nhân Sấy Mộc Mỹ',
      slug: 'hanh-nhan-rang',
      image: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85',
      calories: 598,
      protein: 21,
      nutriScore: 'B',
      price: 129000,
      originalPrice: 145000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '250g',
      diets: ['keto', 'eat_clean', 'vegan'],
    },
    {
      name: 'Hạt Chia Hữu Cơ Nhập Khẩu',
      slug: 'hat-chia',
      image: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=800&q=85',
      calories: 486,
      protein: 16.5,
      nutriScore: 'A',
      price: 95000,
      originalPrice: null,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '200g',
      diets: ['keto', 'eat_clean', 'vegan', 'gluten_free'],
    },
    {
      name: 'Yến Mạch Cán Dẹt Tươi',
      slug: 'yen-mach-can-det',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85',
      calories: 379,
      protein: 13.2,
      nutriScore: 'A',
      price: 89000,
      originalPrice: 99000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '500g',
      diets: ['eat_clean', 'vegan'],
    },
    {
      name: 'Sữa Hạt Óc Chó Không Đường',
      slug: 'sua-oc-cho-khong-duong',
      image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85',
      calories: 40,
      protein: 1.0,
      nutriScore: 'B',
      price: 79000,
      originalPrice: null,
      categorySlug: 'sua-hat-do-uong',
      categoryName: 'Sữa Hạt & Đồ Uống',
      unit: '1 Lít',
      diets: ['vegan', 'sugar_free'],
    },
    {
      name: 'Ức Gà Áp Chảo Tiêu Đen Clean',
      slug: 'uc-ga-ap-chao',
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85',
      calories: 120,
      protein: 20,
      nutriScore: 'A',
      price: 65000,
      originalPrice: null,
      categorySlug: 'dam-sach',
      categoryName: 'Đạm Sạch',
      unit: '200g',
      diets: ['keto', 'eat_clean'],
    },
    {
      name: 'Hạt Macca Tây Nguyên Nứt Vỏ',
      slug: 'macca-nut-vo',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
      calories: 718,
      protein: 8,
      nutriScore: 'A',
      price: 165000,
      originalPrice: 185000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '250g',
      diets: ['keto', 'eat_clean', 'vegan'],
    },
    {
      name: 'Hạt Điều Bình Phước Rang Củi',
      slug: 'hat-dieu-rang-cui',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85',
      calories: 553,
      protein: 18,
      nutriScore: 'B',
      price: 135000,
      originalPrice: 150000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '250g',
      diets: ['eat_clean', 'vegan'],
    },
    {
      name: 'Hạt Óc Chó Vàng Chandler Mỹ',
      slug: 'hat-oc-cho-vang',
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=85',
      calories: 654,
      protein: 15,
      nutriScore: 'A',
      price: 145000,
      originalPrice: 165000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '250g',
      diets: ['keto', 'eat_clean', 'vegan'],
    },
    {
      name: 'Hạt Bí Xanh Ấn Độ Sấy Mộc',
      slug: 'hat-bi-xanh',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=85',
      calories: 559,
      protein: 30,
      nutriScore: 'A',
      price: 85000,
      originalPrice: 95000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '200g',
      diets: ['keto', 'eat_clean', 'vegan'],
    },
    {
      name: 'Hạt Dinh Dưỡng Thập Cẩm Eat Clean',
      slug: 'hat-dinh-duong-mix',
      image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=85',
      calories: 520,
      protein: 17,
      nutriScore: 'A',
      price: 175000,
      originalPrice: 195000,
      categorySlug: 'snack-lanh-manh',
      categoryName: 'Snack Lành Mạnh',
      unit: '350g',
      diets: ['eat_clean', 'vegan'],
    },
    {
      name: 'Ngũ Cốc Hạt Mầm Năng Lượng',
      slug: 'ngu-coc-hat-mam',
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=85',
      calories: 390,
      protein: 15,
      nutriScore: 'A',
      price: 110000,
      originalPrice: 125000,
      categorySlug: 'ngu-coc-hat',
      categoryName: 'Ngũ Cốc & Hạt',
      unit: '400g',
      diets: ['eat_clean', 'vegan'],
    },
  ];

  // Map known slugs to realistic clean food photography
  const imageMap: Record<string, string> = {
    'hat-chia': 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=800&q=85',
    'hanh-nhan-rang': 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=85',
    'yen-mach-can-det': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85',
    'sua-oc-cho-khong-duong': 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85',
    'uc-ga-ap-chao': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85',
    'granola-khong-duong': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85',
    'macca-nut-vo': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    'hat-dieu-rang-cui': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85',
    'hat-oc-cho-vang': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=85',
    'hat-bi-xanh': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=85',
    'hat-dinh-duong-mix': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=85',
    'ngu-coc-hat-mam': 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=85',
    'sua-hat-dieu-hanh-nhan': 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=85',
    'thanh-protein-bar': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=85',
    'salad-uc-ga-sot-me': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    'thit-bo-ap-chao': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=85',
  };

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await productService.getProducts({ limit: 50 });
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Adapt API Product to storefront Product type
  const adaptProduct = (p: ProductItem, index: number): any => {
    const fallback = fallbackProducts[index % fallbackProducts.length];
    
    let finalImage = p.primaryImage;
    if (
      !finalImage ||
      finalImage.includes('placehold.co') ||
      finalImage.includes('photo-1517093707765-a895311f9f25') ||
      finalImage.includes('photo-1508061252445-5350f31934b0')
    ) {
      finalImage = imageMap[p.slug] || fallback.image;
    }

    return {
      id: String(p.id),
      name: p.name || fallback.name,
      slug: p.slug,
      price: p.defaultVariant ? p.defaultVariant.price : fallback.price,
      originalPrice: p.defaultVariant?.compareAtPrice || (fallback.originalPrice ?? undefined),
      unit: p.defaultVariant ? `${p.defaultVariant.netWeightG}g` : fallback.unit,
      thumbnail: finalImage,
      category: {
        id: String(p.category?.id || 1),
        name: p.category?.name || fallback.categoryName,
        slug: p.category?.slug || fallback.categorySlug,
      },
      categoryId: p.category?.slug || fallback.categorySlug,
      servingSize: p.defaultVariant ? `${p.defaultVariant.netWeightG}g` : fallback.unit,
      calories: p.nutrition?.caloriesKcal ?? fallback.calories,
      protein: p.nutrition?.proteinG ?? fallback.protein,
      carbs: p.nutrition?.carbG ?? 35,
      fat: p.nutrition?.fatG ?? 12,
      nutriScore: p.nutriScoreGrade || fallback.nutriScore,
      badges: p.isFeatured ? ['BESTSELLER', 'ORGANIC'] : ['ORGANIC'],
      allergens: p.allergens || [],
      rating: p.avgRating || 5.0,
      reviewCount: p.reviewCount ?? 12,
      isAvailable: true,
      stock: 100,
    };
  };

  const adaptedProductList = useMemo(() => {
    if (products.length > 0) {
      return products.map((p, idx) => adaptProduct(p, idx));
    }
    return fallbackProducts.map((f, idx) => ({
      id: String(idx + 1),
      name: f.name,
      slug: f.slug,
      price: f.price,
      originalPrice: f.originalPrice ?? undefined,
      unit: f.unit,
      thumbnail: f.image,
      category: {
        id: String(idx + 1),
        name: f.categoryName,
        slug: f.categorySlug,
      },
      categoryId: f.categorySlug,
      servingSize: f.unit,
      calories: f.calories,
      protein: f.protein,
      carbs: 35,
      fat: 12,
      nutriScore: f.nutriScore,
      badges: ['ORGANIC'],
      allergens: [],
      rating: 5.0,
      reviewCount: 16,
      isAvailable: true,
      stock: 100,
    }));
  }, [products]);

  // Featured items for Section 3 (Spotlight 2x card + 2 normal cards)
  const featuredItems = useMemo(() => {
    return adaptedProductList.slice(0, 3);
  }, [adaptedProductList]);

  // Section 1: SLIDE CARD CHUNKED THEO NHÓM ĐÚNG 4 SẢN PHẨM MỖI TRANG
  const slidePages = useMemo(() => {
    const list = adaptedProductList;
    const pages: any[][] = [];
    for (let i = 0; i < list.length; i += 4) {
      const chunk = list.slice(i, i + 4);
      if (chunk.length === 4) {
        pages.push(chunk);
      }
    }
    return pages.length > 0 ? pages : [list.slice(0, 4)];
  }, [adaptedProductList]);

  const [slidePageIndex, setSlidePageIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  const nextSlidePage = () => {
    setSlidePageIndex((prev) => (prev + 1) % slidePages.length);
  };

  const prevSlidePage = () => {
    setSlidePageIndex((prev) => (prev - 1 + slidePages.length) % slidePages.length);
  };

  // Autoplay Slide chuyển qua 4 sản phẩm tiếp theo sau mỗi 4.5s
  useEffect(() => {
    if (isSlidePaused || slidePages.length <= 1) return;
    const interval = setInterval(() => {
      setSlidePageIndex((prev) => (prev + 1) % slidePages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSlidePaused, slidePages.length]);

  // Section 2: Banner tự động chuyển động Tiêu chuẩn nông sản (Loại bỏ icon, giữ text thanh lịch)
  const marqueeItems = [
    { title: 'VIETGAP NÔNG SẢN', subtitle: 'Tiêu chuẩn nông sản sạch' },
    { title: 'NUTRI-SCORE CHÂU ÂU', subtitle: 'Định lượng chuẩn calo & đạm' },
    { title: '100% SẤY MỘC 60°C', subtitle: 'Không qua chiên dầu' },
    { title: 'ISO 22000:2018', subtitle: 'Hệ thống quản lý quốc tế' },
    { title: 'HACCP CODEX', subtitle: 'Kiểm định an toàn thực phẩm' },
    { title: 'NON-GMO', subtitle: 'Không biến đổi gen' },
    { title: 'OCOP 4 SAO', subtitle: 'Nông sản hữu cơ Tây Nguyên' },
    { title: 'KHO FEFO', subtitle: 'Date mới trong 30 ngày' },
  ];

  // Hàng 2 bên dưới: Cam kết chất lượng & Giá trị khách hàng (Chạy ngược chiều)
  const marqueeBottomItems = [
    { title: 'CAM KẾT CHẤT LƯỢNG', subtitle: 'Hoàn tiền 100% nếu không hài lòng' },
    { title: 'GIAO NHANH 2H', subtitle: 'Nội thành TP.HCM & Hà Nội' },
    { title: 'NGUỒN GỐC MINH BẠCH', subtitle: 'Nông sản hữu cơ Tây Nguyên' },
    { title: 'KHÔNG PHỤ GIA', subtitle: 'Không chất bảo quản thực phẩm' },
    { title: 'ĐỔI TRẢ TRONG 7 NGÀY', subtitle: 'Đổi mới miễn phí tận nhà' },
    { title: 'ĐÓNG GÓI CHUẨN FEFO', subtitle: 'Hút chân không giữ trọn vị tươi' },
    { title: 'TƯ VẤN DINH DƯỠNG', subtitle: 'Đội ngũ chuyên gia 24/7' },
    { title: 'TIÊU CHUẨN XUẤT KHẨU', subtitle: 'Chứng nhận kiểm nghiệm quốc tế' },
  ];

  // Clean, commercial categories list (Typography thuần khiết, không icon vụn vặt)
  const categoriesList = [
    { id: 'all', name: 'Tất cả sản phẩm', count: adaptedProductList.length },
    {
      id: 'ngu-coc-hat',
      name: 'Hạt & Ngũ cốc',
      count: adaptedProductList.filter((p) => p.categoryId === 'ngu-coc-hat').length,
    },
    {
      id: 'sua-hat-do-uong',
      name: 'Sữa hạt & Đồ uống',
      count: adaptedProductList.filter((p) => p.categoryId === 'sua-hat-do-uong').length,
    },
    {
      id: 'dam-sach',
      name: 'Đạm sạch Eat Clean',
      count: adaptedProductList.filter((p) => p.categoryId === 'dam-sach').length,
    },
    {
      id: 'snack-lanh-manh',
      name: 'Snack & Granola',
      count: adaptedProductList.filter((p) => p.categoryId === 'snack-lanh-manh' || p.categoryId === 'granola').length,
    },
  ];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let list = [...adaptedProductList];

    // Filter by Category (ưu tiên hiển thị theo danh mục khi người dùng không gõ tìm kiếm)
    const hasSearch = searchQuery.trim() !== '';
    if (activeCategory !== 'all' && !hasSearch) {
      list = list.filter((p) => {
        if (activeCategory === 'ngu-coc-hat') {
          return p.categoryId === 'ngu-coc-hat' || p.categoryId === 'granola';
        }
        if (activeCategory === 'snack-lanh-manh') {
          return p.categoryId === 'snack-lanh-manh' || p.categoryId === 'granola';
        }
        return p.categoryId === activeCategory;
      });
    }

    // Filter by Search Query (hỗ trợ tiếng Việt có dấu & không dấu thông minh)
    if (hasSearch) {
      const rawQ = searchQuery.toLowerCase().trim();
      const cleanQ = removeVietnameseTones(searchQuery);
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const cleanName = removeVietnameseTones(p.name || '');
        const cat = (p.category?.name || p.categoryName || '').toLowerCase();
        const cleanCat = removeVietnameseTones(p.category?.name || p.categoryName || '');
        const slug = (p.slug || '').toLowerCase();
        return (
          name.includes(rawQ) ||
          cleanName.includes(cleanQ) ||
          cat.includes(rawQ) ||
          cleanCat.includes(cleanCat) ||
          slug.includes(cleanQ)
        );
      });
    }

    // Filter by Diet
    if (activeDiet !== 'all') {
      list = list.filter((item) => {
        const raw = products.find((p) => String(p.id) === item.id);
        if (raw?.diets && raw.diets.length > 0) {
          return raw.diets.some((d: any) => d.code === activeDiet);
        }
        const fb = fallbackProducts.find((f) => f.slug === item.slug);
        return fb?.diets?.includes(activeDiet);
      });
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'protein_desc') {
      list.sort((a, b) => b.protein - a.protein);
    } else if (sortBy === 'calories_asc') {
      list.sort((a, b) => a.calories - b.calories);
    }

    return list;
  }, [adaptedProductList, products, activeCategory, activeDiet, searchQuery, sortBy]);

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

      <main className="flex-1 pb-16">
        
        {/* ============================================================== */}
        {/* 1. SECTION ĐẦU TIÊN: HEADER & KIỂU SLIDE CARD (NỀN TRẮNG SÁNG)   */}
        {/* ============================================================== */}
        <section className="relative bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 pt-6 sm:pt-8 pb-8 sm:pb-10 border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">Trang Chủ</Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">Thực Đơn Dinh Dưỡng</span>
            </div>

            {/* Top Row: Heading & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Hạt Dinh Dưỡng Sấy Mộc & Khẩu Phần Ăn Sạch
                </h1>
              </div>

              {/* Slider Controls (Page counter + Prev/Next buttons) */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <span className="text-xs font-semibold text-slate-400">
                  Trang <strong className="text-slate-900 dark:text-white font-extrabold">0{slidePageIndex + 1}</strong> / 0{slidePages.length}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevSlidePage}
                    aria-label="4 sản phẩm trước"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2]" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlidePage}
                    aria-label="4 sản phẩm kế tiếp"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            </div>

            {/* SLIDER ĐÚNG 4 SẢN PHẨM: Hiển thị trọn vẹn 4 sản phẩm, chuyển slide là chuyển qua 4 sản phẩm khác */}
            <div
              onMouseEnter={() => setIsSlidePaused(true)}
              onMouseLeave={() => setIsSlidePaused(false)}
              className="relative overflow-hidden w-full"
            >
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${slidePageIndex * 100}%)` }}
              >
                {slidePages.map((page, pageIdx) => (
                  <div
                    key={`slide-page-${pageIdx}`}
                    className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 py-1"
                  >
                    {page.map((product) => (
                      <div key={`slide-${pageIdx}-${product.id}`} className="h-full">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {slidePages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Chuyển đến 4 sản phẩm trang ${i + 1}`}
                  onClick={() => setSlidePageIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    slidePageIndex === i
                      ? 'w-7 bg-emerald-800 dark:bg-emerald-500'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. BANNER AUTO CHUYỂN ĐỘNG TRÊN (NỀN XANH THƯƠNG HIỆU NUTRIO)   */}
        {/* ============================================================== */}
        <section className="bg-[#064e3b] dark:bg-[#043327] border-y border-[#053d2e] dark:border-[#022119] py-4 sm:py-5 overflow-hidden select-none shadow-inner">
          <div className="relative w-full overflow-hidden flex">
            {/* Left & Right gradient fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#064e3b] dark:from-[#043327] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#064e3b] dark:from-[#043327] to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee flex items-center gap-3.5 sm:gap-5 whitespace-nowrap">
              {marqueeItems.concat(marqueeItems).map((item, idx) => (
                <div
                  key={`top-${idx}`}
                  className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 shadow-xs border border-white/90"
                >
                  <span className="text-xs font-bold text-emerald-950 tracking-tight">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 pl-2 border-l border-slate-200">
                    {item.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. SECTION SẢN PHẨM TIÊU BIỂU (CARD TIÊU BIỂU GẤP ĐÔI BÌNH THƯỜNG) */}
        {/* ============================================================== */}
        <section className="py-8 sm:py-10 bg-white dark:bg-[#090D16] border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            
            

            {/* Grid 4 cột: 1 Card Tiêu Biểu chiếm 2 cột (gấp đôi) + 2 Card Bình Thường */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
              {/* Card Tiêu Biểu (Rộng bằng 2 card bình thường) */}
              {featuredItems[0] && (
                <SpotlightProductCard product={featuredItems[0]} />
              )}

              {/* 2 Card bình thường đi kèm bên cạnh */}
              {featuredItems[1] && (
                <ProductCard product={featuredItems[1]} />
              )}
              {featuredItems[2] && (
                <ProductCard product={featuredItems[2]} />
              )}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* BANNER AUTO CHUYỂN ĐỘNG DƯỚI SECTION TIÊU BIỂU (NỀN XANH)      */}
        {/* ============================================================== */}
        <section className="bg-[#064e3b] dark:bg-[#043327] border-y border-[#053d2e] dark:border-[#022119] py-4 sm:py-5 overflow-hidden select-none shadow-inner">
          <div className="relative w-full overflow-hidden flex">
            {/* Left & Right gradient fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#064e3b] dark:from-[#043327] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#064e3b] dark:from-[#043327] to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee-reverse flex items-center gap-3.5 sm:gap-5 whitespace-nowrap">
              {marqueeBottomItems.concat(marqueeBottomItems).map((item, idx) => (
                <div
                  key={`bot-${idx}`}
                  className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white text-slate-900 shadow-xs border border-white/90"
                >
                  <span className="text-xs font-bold text-emerald-950 tracking-tight">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 pl-2 border-l border-slate-200">
                    {item.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. MINIMALIST CATEGORY TABS (Chuẩn E-commerce Muji/Apple)      */}
        {/* ============================================================== */}
        <section className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#090D16] sticky top-20 z-20 backdrop-blur-md">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {categoriesList.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="ml-1.5 opacity-60">({cat.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. FILTER & TOOLBAR (Gọn gàng, dễ sử dụng)                   */}
        {/* ============================================================== */}
        <section className="pt-6 pb-2">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              
              {/* Diet filter chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-400 mr-1 text-xs">
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
                    className={`px-3 py-1 rounded-full font-medium transition cursor-pointer text-xs ${
                      activeDiet === f.id
                        ? 'bg-emerald-800 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort */}
              <div className="flex items-center gap-2.5 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-60">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên sản phẩm..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-3 pr-7 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none appearance-none"
                  >
                    <option value="featured">Phổ biến nhất</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                    <option value="protein_desc">Đạm cao nhất</option>
                    <option value="calories_asc">Calo thấp nhất</option>
                  </select>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. MAIN PRODUCT GRID (Trực tiếp, 4 cột chuẩn thương mại)      */}
        {/* ============================================================== */}
        <section className="pt-6">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 text-emerald-700 animate-spin" />
                <span className="text-xs font-medium text-slate-500">Đang tải sản phẩm...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Không tìm thấy sản phẩm nào</p>
                <p className="text-xs text-slate-500 mt-1">Vui lòng thử từ khóa khác hoặc bỏ chọn bộ lọc.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveDiet('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

          </div>
        </section>

        {/* ============================================================== */}
        {/* 7. COMMERCIAL TRUST BAR (Dịch vụ & Cam kết tối giản)         */}
        {/* ============================================================== */}
        <section className="mt-16 pt-10 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              
              <div className="border-l-2 border-emerald-700 dark:border-emerald-500 pl-3.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Giao Nhanh 2 Giờ</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Áp dụng đơn hàng nội thành TP.HCM</p>
              </div>

              <div className="border-l-2 border-emerald-700 dark:border-emerald-500 pl-3.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">100% Sấy Mộc</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Không chiên dầu, không tẩm ướp phụ gia</p>
              </div>

              <div className="border-l-2 border-emerald-700 dark:border-emerald-500 pl-3.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Chuẩn Nutri-Score</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minh bạch calo & đạm trên mỗi khẩu phần</p>
              </div>

              <div className="border-l-2 border-emerald-700 dark:border-emerald-500 pl-3.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Kho Quản Lý FEFO</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đảm bảo date mới sản xuất trong 30 ngày</p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* FOOTER */}
      <Footer />

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#064e3b]" />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
