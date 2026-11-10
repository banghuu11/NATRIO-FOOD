'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Warehouse,
  Plus,
  ShieldCheck,
  Search,
  Loader2,
  X,
  Check,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import {
  inventoryService,
  FefoBatchItem,
  WarehouseItem,
  CreateBatchPayload,
} from '@/services/inventory.service';
import { productService, ProductItem } from '@/services/product.service';

export default function AdminFefoInventoryPage() {
  const [batches, setBatches] = useState<FefoBatchItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'good'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQuarantineOpen, setIsQuarantineOpen] = useState(false);
  const [isQrDetailOpen, setIsQrDetailOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<FefoBatchItem | null>(null);

  const [quarantineReason, setQuarantineReason] = useState('Hàng cận date kiểm nghiệm không đạt tiêu chuẩn tươi mới');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for Create Batch
  const [createForm, setCreateForm] = useState<CreateBatchPayload>({
    variantId: 1,
    warehouseId: 1,
    batchCode: '',
    manufacturedOn: new Date().toISOString().split('T')[0],
    expiresOn: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantityReceived: 100,
    unitCost: 50000,
    labResultNote: 'Đạt chuẩn kiểm nghiệm an toàn thực phẩm ISO 22000',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, whRes, prodRes] = await Promise.all([
        inventoryService.getFefoBatches({ search: searchTerm || undefined }),
        inventoryService.getWarehouses(),
        productService.getProducts({ limit: 50 }),
      ]);
      setBatches(batchesRes.data || []);
      setWarehouses(whRes || []);
      setProducts(prodRes.data || []);

      if (batchesRes.data?.length > 0 && !createForm.variantId && prodRes.data?.[0]?.defaultVariant?.id) {
        setCreateForm((prev) => ({
          ...prev,
          variantId: prodRes.data[0].defaultVariant!.id,
          warehouseId: whRes?.[0]?.id || 1,
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải kho FEFO:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const filteredBatches = batches.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.fefoStatus === statusFilter;
  });

  const criticalCount = batches.filter((b) => b.fefoStatus === 'critical').length;
  const warningCount = batches.filter((b) => b.fefoStatus === 'warning').length;
  const goodCount = batches.filter((b) => b.fefoStatus === 'good').length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = createForm.batchCode.trim() || `LOT-${Date.now().toString().slice(-6)}`;
    setSubmitting(true);
    try {
      await inventoryService.createBatch({
        ...createForm,
        batchCode: code,
      });
      showToast('Đã nhập lô hàng mới & tự sinh mã QR truy xuất vào CSDL!');
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Lỗi nhập lô hàng:', err);
      alert(err.response?.data?.message || 'Không thể tạo lô hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuarantineConfirm = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      await inventoryService.quarantineBatch(selectedBatch.id, quarantineReason);
      showToast(`Đã cách ly và trừ xuất bán lô ${selectedBatch.batchCode}!`);
      setIsQuarantineOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Lỗi cách ly lô hàng:', err);
      alert(err.response?.data?.message || 'Không thể cách ly lô hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold mb-2">
            <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
            <span>QUẢN LÝ TỒN KHO THÔNG MINH THEO HẠN DÙNG (FEFO)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Radar Lô Hàng & Hạn Sử Dụng FEFO
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nguyên tắc <strong>First-Expired, First-Out</strong>: Tự động trừ kho từ lô hết hạn sớm nhất khi khách đặt hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateForm({
              variantId: products[0]?.defaultVariant?.id || 1,
              warehouseId: warehouses[0]?.id || 1,
              batchCode: `LOT-${Date.now().toString().slice(-6)}`,
              manufacturedOn: new Date().toISOString().split('T')[0],
              expiresOn: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              quantityReceived: 100,
              unitCost: 50000,
              labResultNote: 'Đạt chuẩn kiểm nghiệm an toàn thực phẩm ISO 22000',
            });
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>+ Nhập Lô Hàng Mới</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cận Date Nguy Cấp (&lt; 15 Ngày)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{criticalCount} Lô Hàng</div>
          <div className="text-xs text-rose-700 font-medium mt-1">Khuyến nghị: Bật Flash Sale xả hàng ngay</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cần Chú Ý (15 - 30 Ngày)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{warningCount} Lô Hàng</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Ưu tiên xuất kho trước theo FEFO</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn Dùng Rất Tốt (&gt; 30 Ngày)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{goodCount} Lô Hàng</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Lưu kho an toàn, chuẩn chất lượng</div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã lô, mã QR, tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { key: 'all', label: `Tất cả (${batches.length})` },
              { key: 'critical', label: `Nguy cấp (${criticalCount})` },
              { key: 'warning', label: `Cần chú ý (${warningCount})` },
              { key: 'good', label: `An toàn (${goodCount})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. FEFO Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Đang tải danh sách lô hàng FEFO từ CSDL...</span>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Không tìm thấy lô hàng nào phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã Lô & QR Truy Xuất</th>
                  <th className="py-3.5 px-4">Sản Phẩm & Biến Thể</th>
                  <th className="py-3.5 px-4">Kho Lưu Trữ</th>
                  <th className="py-3.5 px-4">Hạn Sử Dụng (HSD)</th>
                  <th className="py-3.5 px-4">Số Ngày Còn Lại</th>
                  <th className="py-3.5 px-4">Tồn Thực Tế</th>
                  <th className="py-3.5 px-4">Giá Vốn</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBatches.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* Batch Code & QR */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.batchCode}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <QrCode className="w-3 h-3 text-emerald-600" />
                        <span className="font-mono">{item.qrCode}</span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {item.variantName} {item.farmName && `• ${item.farmName}`}
                      </div>
                    </td>

                    {/* Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.isCold ? (
                          <Snowflake className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="font-semibold text-slate-700">{item.warehouse}</span>
                      </div>
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Days Left FEFO Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          item.fefoStatus === 'critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                            : item.fefoStatus === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.daysLeft <= 0 ? 'ĐÃ HẾT HẠN' : `${item.daysLeft} ngày`}
                      </span>
                    </td>

                    {/* Inventory on Hand */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{item.quantityOnHand} gói</div>
                      {item.quantityReserved > 0 && (
                        <div className="text-[10px] text-slate-400">Đã giữ: {item.quantityReserved}</div>
                      )}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {item.unitCost ? item.unitCost.toLocaleString('vi-VN') : 0} đ
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Xem thông tin nguồn gốc"
                          onClick={() => {
                            setSelectedBatch(item);
                            setIsQrDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Cách ly / Đánh dấu hỏng lô này"
                          onClick={() => {
                            setSelectedBatch(item);
                            setIsQuarantineOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <AlertOctagon className="w-4 h-4" />
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

      {/* ================= MODAL NHẬP LÔ HÀNG MỚI ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Nhập Lô Hàng Mới (FEFO)</h3>
                  <p className="text-xs text-slate-500">Khai báo lô hàng, hạn sử dụng & kho lưu trữ</p>
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
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã Lô Hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: LOT-OAT-2611"
                  value={createForm.batchCode}
                  onChange={(e) => setCreateForm({ ...createForm, batchCode: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sản phẩm / Biến thể *</label>
                  <select
                    value={createForm.variantId}
                    onChange={(e) => setCreateForm({ ...createForm, variantId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  >
                    {products.map((p) =>
                      p.defaultVariant ? (
                        <option key={p.defaultVariant.id} value={p.defaultVariant.id}>
                          {p.name} ({p.defaultVariant.name})
                        </option>
                      ) : null,
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kho Nhập *</label>
                  <select
                    value={createForm.warehouseId}
                    onChange={(e) => setCreateForm({ ...createForm, warehouseId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.isColdStorage ? '(Kho Lạnh)' : '(Kho Thường)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ngày Sản Xuất *</label>
                  <input
                    type="date"
                    required
                    value={createForm.manufacturedOn}
                    onChange={(e) => setCreateForm({ ...createForm, manufacturedOn: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-rose-700 block mb-1">Hạn Sử Dụng (HSD) *</label>
                  <input
                    type="date"
                    required
                    value={createForm.expiresOn}
                    onChange={(e) => setCreateForm({ ...createForm, expiresOn: e.target.value })}
                    className="w-full px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số Lượng Nhập (Gói) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={createForm.quantityReceived}
                    onChange={(e) => setCreateForm({ ...createForm, quantityReceived: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Đơn Giá Vốn (VND) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={createForm.unitCost}
                    onChange={(e) => setCreateForm({ ...createForm, unitCost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ghi Chú Kiểm Định Phòng Lab</label>
                <input
                  type="text"
                  value={createForm.labResultNote}
                  onChange={(e) => setCreateForm({ ...createForm, labResultNote: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  placeholder="Tiêu chuẩn an toàn, độ ẩm, vi sinh..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-slate-900/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Nhập Kho & Sinh Mã QR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CÁCH LY LÔ HÀNG ================= */}
      {isQuarantineOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Cách Ly Lô Hàng {selectedBatch.batchCode}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Lô hàng sẽ bị khóa khỏi hệ thống bán lẻ (xuất kho = 0) và ghi nhận lý do vào sổ luân chuyển tồn kho.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Lý do cách ly *</label>
              <textarea
                rows={3}
                value={quarantineReason}
                onChange={(e) => setQuarantineReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsQuarantineOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleQuarantineConfirm}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-600/25 cursor-pointer disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận cách ly</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT LÔ & QR TRUY XUẤT ================= */}
      {isQrDetailOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <QrCode className="w-9 h-9" />
            </div>

            <div>
              <div className="font-mono text-xs font-black text-emerald-700 tracking-wider">
                {selectedBatch.qrCode}
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1">{selectedBatch.productName}</h3>
              <p className="text-xs text-slate-500 font-mono">Mã Lô: {selectedBatch.batchCode}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Nông trại:</span>
                <span className="font-bold text-slate-800">{selectedBatch.farmName || 'Đà Lạt Xanh'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Địa chỉ:</span>
                <span className="font-bold text-slate-800">{selectedBatch.farmProvince || 'Lâm Đồng'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hạn sử dụng:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedBatch.expiryDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tồn kho:</span>
                <span className="font-bold text-emerald-700">{selectedBatch.quantityOnHand} gói</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQrDetailOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
