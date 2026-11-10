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
  X,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';
import {
  productService,
  ProductItem,
  CategoryItem,
  CreateProductPayload,
  UpdateProductPayload,
} from '@/services/product.service';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNutriScore, setSelectedNutriScore] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for Create
  const [createForm, setCreateForm] = useState<CreateProductPayload>({
    name: '',
    categoryId: 1,
    shortDescription: '',
    description: '',
    originCountry: 'Việt Nam',
    shelfLifeDays: 180,
    nutriScoreGrade: 'A',
    isFeatured: false,
    imageUrls: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'],
    initialVariant: {
      sku: '',
      name: 'Túi 500g',
      netWeightG: 500,
      price: 120000,
      compareAtPrice: 150000,
      costPrice: 75000,
      reorderLevel: 20,
    },
    nutritionFacts: {
      caloriesKcal: 380,
      proteinG: 14,
      carbohydratesG: 65,
      sugarsG: 4,
      fatG: 7,
      fiberG: 9,
      sodiumMg: 15,
    },
  });

  // Form state for Edit
  const [editForm, setEditForm] = useState<{
    name: string;
    nutriScoreGrade: 'A' | 'B' | 'C' | 'D' | 'E';
    caloriesKcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    price: number;
  }>({
    name: '',
    nutriScoreGrade: 'A',
    caloriesKcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
    price: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [res, cats] = await Promise.all([
        productService.getProducts({
          nutriScore: selectedNutriScore !== 'all' ? selectedNutriScore : undefined,
          search: searchTerm || undefined,
        }),
        productService.getCategories(),
      ]);
      setProducts(res.data || []);
      setCategories(cats || []);
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm cho Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedNutriScore]);

  // Open Edit Modal
  const handleOpenEdit = (item: ProductItem) => {
    setSelectedProduct(item);
    setEditForm({
      name: item.name,
      nutriScoreGrade: item.nutriScoreGrade,
      caloriesKcal: item.nutrition?.caloriesKcal || 0,
      proteinG: item.nutrition?.proteinG || 0,
      carbG: item.nutrition?.carbG || 0,
      fatG: item.nutrition?.fatG || 0,
      price: item.defaultVariant?.price || 0,
    });
    setIsEditOpen(true);
  };

  // Submit Create Product
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }
    const sku = createForm.initialVariant?.sku || `SKU-${Date.now().toString().slice(-6)}`;
    setSubmitting(true);
    try {
      await productService.createProduct({
        ...createForm,
        initialVariant: {
          ...createForm.initialVariant!,
          sku,
        },
      });
      showToast('Đã thêm sản phẩm mới thành công vào CSDL!');
      setIsCreateOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Lỗi tạo sản phẩm:', err);
      alert(err.response?.data?.message || 'Không thể tạo sản phẩm. Kiểm tra lại dữ liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Product
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await productService.updateProduct(selectedProduct.id, {
        name: editForm.name,
        nutriScoreGrade: editForm.nutriScoreGrade,
        nutritionFacts: {
          caloriesKcal: editForm.caloriesKcal,
          proteinG: editForm.proteinG,
          carbohydratesG: editForm.carbG,
          fatG: editForm.fatG,
        },
      });
      showToast(`Đã cập nhật sản phẩm #${selectedProduct.id} thành công!`);
      setIsEditOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Lỗi cập nhật sản phẩm:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  // Archive / Delete Product
  const handleArchiveConfirm = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await productService.archiveProduct(selectedProduct.id);
      showToast(`Đã lưu trữ / ngưng bán sản phẩm: ${selectedProduct.name}`);
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Lỗi xóa sản phẩm:', err);
      alert(err.response?.data?.message || 'Không thể xóa sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Check className="w-5 h-5 bg-white/20 p-1 rounded-full" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

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
          onClick={() => setIsCreateOpen(true)}
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
                  ? 'bg-emerald-600 text-white shadow-sm'
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
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{item.category?.name || 'Mặc định'}</td>

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
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Xóa / Ngưng kinh doanh"
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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

      {/* ================= MODAL 1: THÊM SẢN PHẨM MỚI ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Thêm Sản Phẩm Mới</h3>
                  <p className="text-xs text-slate-500">Tạo sản phẩm, chỉ số dinh dưỡng & biến thể giá bán vào CSDL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hạt Macca Rang Mộc Tây Nguyên"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Danh mục *</label>
                  <select
                    value={createForm.categoryId}
                    onChange={(e) => setCreateForm({ ...createForm, categoryId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nutri-Score Grade</label>
                  <select
                    value={createForm.nutriScoreGrade}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        nutriScoreGrade: e.target.value as 'A' | 'B' | 'C' | 'D' | 'E',
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="A">Grade A (Tốt nhất)</option>
                    <option value="B">Grade B (Rất tốt)</option>
                    <option value="C">Grade C (Trung bình)</option>
                    <option value="D">Grade D (Cân nhắc)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Xuất xứ</label>
                  <input
                    type="text"
                    value={createForm.originCountry}
                    onChange={(e) => setCreateForm({ ...createForm, originCountry: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hạn sử dụng (ngày)</label>
                  <input
                    type="number"
                    value={createForm.shelfLifeDays}
                    onChange={(e) => setCreateForm({ ...createForm, shelfLifeDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Nutrition Facts */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dinh Dưỡng Cho 100g (Nutrition Facts)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Calo (kcal)</label>
                    <input
                      type="number"
                      value={createForm.nutritionFacts?.caloriesKcal}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          nutritionFacts: {
                            ...createForm.nutritionFacts!,
                            caloriesKcal: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Đạm - Protein (g)</label>
                    <input
                      type="number"
                      value={createForm.nutritionFacts?.proteinG}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          nutritionFacts: {
                            ...createForm.nutritionFacts!,
                            proteinG: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Carbohydrate (g)</label>
                    <input
                      type="number"
                      value={createForm.nutritionFacts?.carbohydratesG}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          nutritionFacts: {
                            ...createForm.nutritionFacts!,
                            carbohydratesG: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Chất béo (g)</label>
                    <input
                      type="number"
                      value={createForm.nutritionFacts?.fatG}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          nutritionFacts: {
                            ...createForm.nutritionFacts!,
                            fatG: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Default Variant */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Biến Thể Đóng Gói Mặc Định</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Tên quy cách</label>
                    <input
                      type="text"
                      value={createForm.initialVariant?.name}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          initialVariant: {
                            ...createForm.initialVariant!,
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Giá bán (VND) *</label>
                    <input
                      type="number"
                      required
                      value={createForm.initialVariant?.price}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          initialVariant: {
                            ...createForm.initialVariant!,
                            price: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Trọng lượng (g)</label>
                    <input
                      type="number"
                      value={createForm.initialVariant?.netWeightG}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          initialVariant: {
                            ...createForm.initialVariant!,
                            netWeightG: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Link Ảnh Sản Phẩm (URL)</label>
                <input
                  type="url"
                  value={createForm.imageUrls?.[0] || ''}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrls: [e.target.value] })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu & Tạo Sản Phẩm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CHỈNH SỬA SẢN PHẨM ================= */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Sửa Sản Phẩm #{selectedProduct.id}</h3>
                  <p className="text-xs text-slate-500">{selectedProduct.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nutri-Score Grade</label>
                <select
                  value={editForm.nutriScoreGrade}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      nutriScoreGrade: e.target.value as 'A' | 'B' | 'C' | 'D' | 'E',
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 outline-none"
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                <div className="text-xs font-bold text-amber-900">Thông Số Dinh Dưỡng 100g</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600 block">Calo (kcal)</label>
                    <input
                      type="number"
                      value={editForm.caloriesKcal}
                      onChange={(e) => setEditForm({ ...editForm, caloriesKcal: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block">Đạm (Protein - g)</label>
                    <input
                      type="number"
                      value={editForm.proteinG}
                      onChange={(e) => setEditForm({ ...editForm, proteinG: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block">Carb (g)</label>
                    <input
                      type="number"
                      value={editForm.carbG}
                      onChange={(e) => setEditForm({ ...editForm, carbG: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block">Fat (g)</label>
                    <input
                      type="number"
                      value={editForm.fatG}
                      onChange={(e) => setEditForm({ ...editForm, fatG: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: XEM CHI TIẾT SẢN PHẨM ================= */}
      {isDetailOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProduct.primaryImage}
                  alt={selectedProduct.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedProduct.name}</h3>
                  <div className="text-xs text-slate-400 font-mono">/{selectedProduct.slug}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Danh mục</span>
                <span className="font-bold text-slate-800">{selectedProduct.category?.name || 'Chung'}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-emerald-700 block mb-1">Nutri-Score</span>
                <span className="font-black text-emerald-800 text-sm">Grade {selectedProduct.nutriScoreGrade}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Giá bán hiện tại</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedProduct.defaultVariant?.price
                    ? `${selectedProduct.defaultVariant.price.toLocaleString('vi-VN')} đ`
                    : 'Chưa đặt'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Quy cách đóng gói</span>
                <span className="font-bold text-slate-800">{selectedProduct.defaultVariant?.name || 'Túi'}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/50 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">Thành Phần Dinh Dưỡng (100g):</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-amber-200/40">
                  <div className="text-[10px] text-slate-400">Năng lượng</div>
                  <div className="font-black text-amber-900">{selectedProduct.nutrition?.caloriesKcal || 0} kcal</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-200/40">
                  <div className="text-[10px] text-slate-400">Chất đạm</div>
                  <div className="font-black text-emerald-700">{selectedProduct.nutrition?.proteinG || 0}g</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-200/40">
                  <div className="text-[10px] text-slate-400">Tinh bột</div>
                  <div className="font-black text-slate-800">{selectedProduct.nutrition?.carbG || 0}g</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-200/40">
                  <div className="text-[10px] text-slate-400">Chất béo</div>
                  <div className="font-black text-slate-800">{selectedProduct.nutrition?.fatG || 0}g</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: XÁC NHẬN LƯU TRỮ / XÓA ================= */}
      {isDeleteOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Ngưng Bán Sản Phẩm?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sản phẩm <strong>{selectedProduct.name}</strong> sẽ được chuyển sang trạng thái Lưu trữ (Discontinued).
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleArchiveConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
