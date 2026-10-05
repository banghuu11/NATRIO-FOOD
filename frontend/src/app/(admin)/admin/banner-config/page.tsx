'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Sparkles,
  Save,
  Image as ImageIcon,
  Box,
  RotateCcw,
  Eye,
  CheckCircle2,
  RefreshCw,
  Layers,
  Sliders,
} from 'lucide-react';
import { bannerService, BannerConfig } from '@/services/banner.service';
import { toast } from 'sonner';

// Dynamic import 3D Canvas
const Nut3DCanvas = dynamic(() => import('@/components/storefront/Nut3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center bg-slate-900 rounded-2xl">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
    </div>
  ),
});

export default function BannerConfigPage() {
  const [config, setConfig] = useState<BannerConfig>({
    title: 'Artisan Granola',
    subtitle: 'An organic healthy food, roasted nuts, and warm botanical.',
    vnDescription: 'Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên.',
    mode: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    model3dType: 'nut_bowl',
    enable3dRotation: true,
    backgroundColor: '#F4EFE6',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Suggested preset images
  const presetImages = [
    { label: 'Tô Granola Mật Ong', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85' },
    { label: 'Ngũ Cốc Chuối Dâu Tây', url: 'https://images.unsplash.com/photo-1517093707765-a895311f9f25?auto=format&fit=crop&w=800&q=85' },
    { label: 'Hạt Hạnh Nhân & Macca', url: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?auto=format&fit=crop&w=800&q=85' },
    { label: 'Chia Pudding Tươi', url: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=800&q=85' },
  ];

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await bannerService.getHeroBanner();
        if (res) setConfig(res);
      } catch (err) {
        console.error('Lỗi khi tải cấu hình banner:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await bannerService.updateHeroBanner(config);
      toast.success('Đã lưu cấu hình Banner & Mô hình 3D thành công!', {
        description: `Chế độ hiển thị: ${config.mode === '3d' ? 'Mô hình 3D tương tác' : 'Ảnh tĩnh'}`,
      });
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>HỆ THỐNG QUẢN LÝ CẤU HÌNH</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Quản Lý Banner & Mô Hình 3D
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tùy biến linh hoạt tiêu đề, phụ đề, ảnh tĩnh hoặc kích hoạt mô hình 3D tương tác xoay 360° trên trang chủ.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Lưu Cấu Hình Ngay</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Settings */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Thông Số Hiển Thị Banner</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Mode Selector: 3D or Image */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Chế độ hiển thị chính (Banner Mode)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'image' })}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    config.mode === 'image'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${config.mode === 'image' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Ảnh Tĩnh Cao Cấp</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Tối ưu tốc độ tải và bố cục hình ảnh sắc nét</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: '3d' })}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    config.mode === '3d'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${config.mode === '3d' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Mô Hình 3D Tương Tác</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Xoay 360° theo con trỏ chuột thời gian thực</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tiêu đề chính (Headline)
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="VD: Artisan Granola"
                required
              />
            </div>

            {/* English Subtitle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mô tả phụ tiếng Anh (Subtitle)
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="VD: An organic healthy food, roasted nuts, and warm botanical."
              />
            </div>

            {/* Vietnamese Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mô tả tiếng Việt (VN Note)
              </label>
              <input
                type="text"
                value={config.vnDescription || ''}
                onChange={(e) => setConfig({ ...config, vnDescription: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="VD: Thực phẩm hữu cơ lành mạnh, hạt sấy mộc và thảo mộc tự nhiên."
              />
            </div>

            {/* Conditional 3D Options */}
            {config.mode === '3d' ? (
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Box className="w-4 h-4" />
                  <span>Cấu hình Mô Hình 3D (WebGL / Three.js)</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Chọn Preset Mô Hình 3D</label>
                  <select
                    value={config.model3dType || 'nut_bowl'}
                    onChange={(e) => setConfig({ ...config, model3dType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="nut_bowl">Tô Granola & Hạt Sấy Mộc 3D</option>
                    <option value="almond">Hạt Hạnh Nhân Organic 3D</option>
                    <option value="macca">Hạt Macca Đắk Lắk 3D</option>
                    <option value="granola_jar">Hũ Granola Ăn Kiêng 3D</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="enableRotation"
                    checked={config.enable3dRotation !== false}
                    onChange={(e) => setConfig({ ...config, enable3dRotation: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="enableRotation" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Cho phép người dùng xoay 360° theo cử chỉ chuột / ngón tay
                  </label>
                </div>
              </div>
            ) : (
              /* Image Options */
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Hình Ảnh Banner
                  </label>
                  <input
                    type="text"
                    value={config.imageUrl || ''}
                    onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5">Mẫu ảnh đề xuất nhanh:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {presetImages.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setConfig({ ...config, imageUrl: p.url })}
                        className={`p-2 rounded-xl text-xs text-left border transition-all flex items-center justify-between cursor-pointer ${
                          config.imageUrl === p.url
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                        {config.imageUrl === p.url && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Right Live Preview Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Xem Trước Trực Tiếp (Live Preview)</span>
            </h2>

            {/* Mockup Preview Card */}
            <div className="bg-[#F4EFE6] border border-[#E8DFC8] rounded-3xl p-6 text-[#2C3E30] relative overflow-hidden shadow-md">
              <div className="space-y-2 mb-4">
                <div className="font-serif text-2xl font-bold tracking-tight text-[#2C3E30]">
                  {config.title || 'Artisan Granola'}
                </div>
                <div className="text-xs text-[#5A6E5E] font-medium leading-relaxed">
                  {config.subtitle || 'An organic healthy food, roasted nuts, and warm botanical.'}
                </div>
                {config.vnDescription && (
                  <div className="text-[10px] text-[#7A8E7E] italic">
                    {config.vnDescription}
                  </div>
                )}
              </div>

              {/* Preview Media Box */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white/60 flex items-center justify-center p-2 border border-white/80">
                {config.mode === '3d' ? (
                  <div className="w-full h-full rounded-xl overflow-hidden bg-slate-950 relative">
                    <Nut3DCanvas />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[9px] text-emerald-300 font-semibold backdrop-blur-xs pointer-events-none">
                      Mô hình 3D đang hoạt động
                    </div>
                  </div>
                ) : (
                  <img
                    src={config.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85'}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>

              <div className="mt-3 text-center text-[11px] text-stone-500 font-medium">
                Chế độ: <strong>{config.mode === '3d' ? '3D WebGL Canvas' : 'Ảnh tĩnh High-Res'}</strong>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
