'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Award,
  Flame,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { productService, ProductItem } from '@/services/product.service';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNutriScore, setSelectedNutriScore] = useState('all');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await productService.getProducts({
          nutriScore: selectedNutriScore !== 'all' ? selectedNutriScore : undefined,
          search: searchTerm || undefined,
        });
        setProducts(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm cho Admin:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchTerm, selectedNutriScore]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Sản Phẩm & Dinh Dưỡng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dữ liệu kết nối trực tiếp CSDL PostgreSQL: Quản lý danh mục, giá bán, thành phần dinh dưỡng và xếp hạng Nutri-Score.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sản Phẩm Mới</span>
        </button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400">Nutri-Score:</span>
          {['all', 'A', 'B', 'C', 'D'].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setSelectedNutriScore(score)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedNutriScore === score
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {score === 'all' ? 'Tất cả' : `Grade ${score}`}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Đang tải sản phẩm từ máy chủ Backend...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Không tìm thấy sản phẩm nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Sản Phẩm</th>
                  <th className="py-3.5 px-4">Danh Mục</th>
                  <th className="py-3.5 px-4">Nutri-Score</th>
                  <th className="py-3.5 px-4">Dinh Dưỡng (100g)</th>
                  <th className="py-3.5 px-4">Giá Bán</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* Product & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.primaryImage}
                          alt={item.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">/{item.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{item.category?.name}</td>

                    {/* Nutri-Score */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-black text-xs ${
                          item.nutriScoreGrade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.nutriScoreGrade === 'B'
                            ? 'bg-lime-100 text-lime-900'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        Grade {item.nutriScoreGrade}
                      </span>
                    </td>

                    {/* Macros */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.nutrition?.caloriesKcal || 0} kcal</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Đạm: {item.nutrition?.proteinG || 0}g • Carb: {item.nutrition?.carbG || 0}g
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">
                        {item.defaultVariant?.price ? item.defaultVariant.price.toLocaleString('vi-VN') : 0} đ
                      </div>
                      {item.defaultVariant?.compareAtPrice && (
                        <div className="text-[11px] text-slate-400 line-through">
                          {item.defaultVariant.compareAtPrice.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đang bán
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Xóa"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
