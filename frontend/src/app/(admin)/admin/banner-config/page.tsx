'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Image as ImageIcon,
  Box,
  Eye,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Upload,
  Type,
  ExternalLink,
  Check,
} from 'lucide-react';
import { bannerService, BannerConfig } from '@/services/banner.service';
import { useBannerStore } from '@/stores/useBannerStore';

export default function BannerConfigPage() {
  const [config, setConfig] = useState<BannerConfig>({
    tagline: '100% Nông Sản Mộc Tươi Mới',
    title: 'Trọn Vẹn Vị Ngọt Tự Nhiên',
    subtitle: 'Dinh dưỡng thuần khiết từ các loại hạt sấy mộc tự nhiên.',
    description:
      'Hạt điều rang củi nguyên vỏ lụa Bình Phước, macca nứt vỏ gỗ Tây Nguyên, hạnh nhân hổ phách nguyên vỏ mộc và óc chó sấy nhiệt thấp. Giữ trọn 100% hương vị và tinh dầu quý giá.',
    buttonText: 'Khám Phá Bộ Sưu Tập',
    buttonLink: '/products',
    highlightText: 'Sấy mộc 60°C • Giữ nguyên lớp vỏ tự nhiên',
    backgroundImageUrl: '',
    backgroundOverlay: 'gradient',
    mode: '3d',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
    model3dType: 'nut_bowl',
    enable3dRotation: true,
    backgroundColor: '#F8F9FA',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const presetBackgrounds = [
    {
      label: 'Rừng Xanh Nhiệt Đới & Nắng Mai (Khuyên Dùng)',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Tán Rừng Đại Ngàn Tươi Mát',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Rừng Thông Tây Nguyên Xanh Ngát',
      url: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Thảo Mộc & Rừng Rêu Xanh Nguyên Sinh',
      url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Núi Rừng Xanh Thiên Nhiên Hùng Vĩ',
      url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Nền Mộc Tự Nhiên (Không Dùng Ảnh Nền)',
      url: '',
    },
  ];

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await bannerService.getHeroBanner();
        if (data) {
          setConfig((prev) => ({
            ...prev,
            ...data,
            backgroundOverlay: data.backgroundOverlay || 'gradient',
          }));
        }
      } catch (err) {
        console.error('Không thể tải cấu hình banner:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setConfig((prev) => ({
            ...prev,
            backgroundImageUrl: event.target!.result as string,
          }));
          showToast('Đã tải ảnh nền thành công từ máy tính!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await bannerService.updateHeroBanner({
        tagline: config.tagline,
        title: config.title,
        subtitle: config.subtitle,
        description: config.description,
        buttonText: config.buttonText,
        buttonLink: config.buttonLink,
        highlightText: config.highlightText,
        backgroundImageUrl: config.backgroundImageUrl,
        backgroundOverlay: config.backgroundOverlay,
        mode: config.mode,
        imageUrl: config.imageUrl,
        model3dType: config.model3dType,
        enable3dRotation: config.enable3dRotation,
        backgroundColor: config.backgroundColor,
      });

      useBannerStore.getState().setBannerConfig({
        tagline: config.tagline,
        title: config.title,
        subtitle: config.subtitle,
        description: config.description,
        buttonText: config.buttonText,
        buttonLink: config.buttonLink,
        highlightText: config.highlightText,
        backgroundImageUrl: config.backgroundImageUrl,
        backgroundOverlay: config.backgroundOverlay,
        mode: config.mode,
        imageUrl: config.imageUrl,
        model3dType: config.model3dType,
        enable3dRotation: config.enable3dRotation,
        backgroundColor: config.backgroundColor,
      });

      showToast('Đã lưu cấu hình Banner & Mô hình 3D thành công vào CSDL!');
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setSaving(false);
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>HỆ THỐNG QUẢN LÝ CẤU HÌNH</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Banner & Mô Hình 3D
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tùy biến toàn bộ nội dung chữ (Content), ảnh background đằng sau, và mô hình 3D tương tác trên trang chủ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem Trang Chủ</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu Cấu Hình Ngay</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Content & Copywriting */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Type className="w-4 h-4 text-emerald-600" />
              <span>1. Nội Dung Văn Bản (Content & Copywriting)</span>
            </h2>

            <div className="space-y-4">
              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Huy hiệu / Tagline đầu banner
                </label>
                <input
                  type="text"
                  value={config.tagline || ''}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: 100% Nông Sản Mộc Tươi Mới"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề chính (Headline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Trọn Vẹn Vị Ngọt Tự Nhiên"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung mô tả chi tiết (Description)
                </label>
                <textarea
                  rows={3}
                  value={config.description || config.subtitle || ''}
                  onChange={(e) =>
                    setConfig({ ...config, description: e.target.value, subtitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  placeholder="Mô tả sản phẩm và giá trị dinh dưỡng..."
                />
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chữ trên nút bấm (Button CTA)
                  </label>
                  <input
                    type="text"
                    value={config.buttonText || ''}
                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: Khám Phá Bộ Sưu Tập"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đường dẫn nút bấm (Link URL)
                  </label>
                  <input
                    type="text"
                    value={config.buttonLink || ''}
                    onChange={(e) => setConfig({ ...config, buttonLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: /products"
                  />
                </div>
              </div>

              {/* Highlight Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dòng ghi chú tiêu chuẩn nổi bật (Highlight Note)
                </label>
                <input
                  type="text"
                  value={config.highlightText || ''}
                  onChange={(e) => setConfig({ ...config, highlightText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Sấy mộc 60°C • Giữ nguyên lớp vỏ tự nhiên"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Background Image Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>2. Cấu Hình Ảnh Background Đằng Sau Banner</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Ảnh Nền (Background Image URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.backgroundImageUrl || ''}
                    onChange={(e) => setConfig({ ...config, backgroundImageUrl: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nhập link ảnh (https://...) hoặc chọn mẫu bên dưới"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tải Từ Máy</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2">
                  Bộ sưu tập mẫu ảnh nền đề xuất nhanh:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetBackgrounds.map((p) => {
                    const isSelected = (config.backgroundImageUrl || '') === p.url;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setConfig({ ...config, backgroundImageUrl: p.url })}
                        className={`p-2.5 rounded-xl text-xs text-left border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kiểu lớp phủ tương phản (Contrast Overlay)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'gradient', label: 'Gradient Mờ', desc: 'Sáng dần sang phải (Khuyên dùng)' },
                    { id: 'dark', label: 'Tối Mờ Cinema', desc: 'Phủ tối sang trọng' },
                    { id: 'light', label: 'Sáng Tươi Mới', desc: 'Phủ sáng 75%' },
                    { id: 'none', label: 'Ảnh Gốc Tự Nhiên', desc: 'Không lớp phủ' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setConfig({ ...config, backgroundOverlay: o.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        (config.backgroundOverlay || 'gradient') === o.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{o.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 3D Model / Image Mode */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Box className="w-4 h-4 text-emerald-600" />
              <span>3. Chế Độ Hiển Thị & Mô Hình 3D</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: '3d' })}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  config.mode === '3d'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    config.mode === '3d' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Tô Hạt 3D Tương Tác</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tô đổ hạt lăn theo thanh cuộn trang</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'image' })}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  config.mode === 'image'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    config.mode === 'image' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Ảnh Tĩnh Cao Cấp</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tối ưu tốc độ tải hình ảnh tĩnh</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Preview Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Xem Trước Trực Tiếp (Live Preview)</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                100% Khớp Trang Chủ
              </span>
            </h2>

            {/* Mockup Preview Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md min-h-[360px] flex flex-col justify-between p-6 select-none bg-slate-100">
              {config.backgroundImageUrl ? (
                <div className="absolute inset-0 z-0">
                  <img
                    src={config.backgroundImageUrl}
                    alt="Background Preview"
                    className="w-full h-full object-cover object-center"
                  />
                  <div
                    className={`absolute inset-0 ${
                      config.backgroundOverlay === 'dark'
                        ? 'bg-black/60'
                        : config.backgroundOverlay === 'light'
                        ? 'bg-white/75'
                        : config.backgroundOverlay === 'none'
                        ? ''
                        : 'bg-gradient-to-r from-white/95 via-white/85 to-white/30'
                    }`}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-slate-100 to-slate-200 z-0" />
              )}

              {/* Content Preview */}
              <div className="relative z-10 space-y-3 max-w-[280px]">
                {Boolean(config.tagline && config.tagline.trim().length > 0) && (
                  <span className="inline-block text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {config.tagline}
                  </span>
                )}

                <h3 className="text-xl font-extrabold text-slate-900 leading-snug tracking-tight">
                  {config.title || 'Trọn Vẹn Vị Ngọt Tự Nhiên'}
                </h3>

                {Boolean(config.description && config.description.trim().length > 0) && (
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                    {config.description}
                  </p>
                )}

                {Boolean(
                  (config.buttonText && config.buttonText.trim().length > 0) ||
                  (config.highlightText && config.highlightText.trim().length > 0)
                ) && (
                  <div className="pt-2 flex flex-col gap-1.5">
                    {Boolean(config.buttonText && config.buttonText.trim().length > 0) && (
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-sm w-fit">
                        <span>{config.buttonText}</span>
                        <span>→</span>
                      </div>
                    )}
                    {Boolean(config.highlightText && config.highlightText.trim().length > 0) && (
                      <div className="text-[10px] text-slate-500 font-medium">
                        {config.highlightText}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3D Indicator */}
              <div className="absolute right-3 bottom-4 z-10 w-28 h-28 rounded-full bg-emerald-600/10 border border-emerald-600/20 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center shadow-sm">
                <Box className="w-8 h-8 text-emerald-700 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-900 mt-1 leading-tight">
                  {config.mode === '3d' ? 'Tô Hạt 3D Tương Tác' : 'Ảnh Tĩnh Sản Phẩm'}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đồng bộ tự động thời gian thực</span>
              </div>
              <p>
                Sau khi nhấn <strong>Lưu Cấu Hình Ngay</strong>, dữ liệu sẽ được lưu vào PostgreSQL và hiển thị lập tức trên trang chủ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
