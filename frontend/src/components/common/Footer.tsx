'use client';

import React from 'react';
import Link from 'next/link';
import {
  Leaf,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Heart,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#F4EFE6] border-t border-[#EBE3D5] text-[#2C3E30] pt-14 pb-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Value Proposition Row (4 Pillars) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-12 border-b border-[#E3D9C9]">
          <div className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-[#EFE8DE]">
            <div className="w-10 h-10 rounded-xl bg-[#5F7E66]/15 text-[#3D5A45] flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-[#2C3E30]">100% Hữu Cơ Chuẩn</h4>
              <p className="text-[11px] text-stone-500">Không hóa chất & phụ gia</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-[#EFE8DE]">
            <div className="w-10 h-10 rounded-xl bg-[#C5853B]/15 text-[#C5853B] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-[#2C3E30]">Nutri-Score A & B</h4>
              <p className="text-[11px] text-stone-500">Chuẩn hóa calo & macro</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-[#EFE8DE]">
            <div className="w-10 h-10 rounded-xl bg-[#5F7E66]/15 text-[#3D5A45] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-[#2C3E30]">Giao Tươi 2 Giờ</h4>
              <p className="text-[11px] text-stone-500">Nội thành TP.HCM & Hà Nội</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-[#EFE8DE]">
            <div className="w-10 h-10 rounded-xl bg-[#C5853B]/15 text-[#C5853B] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-[#2C3E30]">Đổi Trả 7 Ngày</h4>
              <p className="text-[11px] text-stone-500">Miễn phí nếu không hài lòng</p>
            </div>
          </div>
        </div>

        {/* 2. Main Footer Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 py-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl font-black tracking-tight text-[#3D5A45]">
                NUTRIO
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#5A6E5E] leading-relaxed max-w-sm">
              Nền tảng thực phẩm hữu cơ lành mạnh, hạt sấy mộc nhiệt thấp và giải pháp dinh dưỡng chuẩn hóa theo thể trạng người Việt.
            </p>

            <div className="space-y-2 pt-1 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#5F7E66]" />
                <span className="font-bold text-[#2C3E30]">Hotline: 1900 8888 (8:00 - 21:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#5F7E66]" />
                <span>support@nutrio.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5F7E66]" />
                <span>Tòa nhà Innovation, Quận 10, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Quick Links 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#2C3E30]">
              Về Chúng Tôi
            </h4>
            <ul className="space-y-2 text-xs text-[#5A6E5E] font-medium">
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Câu chuyện thương hiệu
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Nông trường hữu cơ Đà Lạt
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Hệ thống kiểm định Nutri-Score
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-[#3D5A45] transition-colors">
                  Cổng Quản Trị (Admin Portal)
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#2C3E30]">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2 text-xs text-[#5A6E5E] font-medium">
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Máy tính chỉ số TDEE & BMI
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Chính sách giao hàng 2h
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Chính sách đổi trả & hoàn tiền
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#3D5A45] transition-colors">
                  Bảo mật thông tin khách hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#2C3E30]">
              Đăng Ký Nhận Thực Đơn
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Nhận cẩm nang ăn sạch hàng tuần và voucher <strong>giảm 10%</strong> cho đơn hàng đầu tiên.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E3D9C9] text-xs text-[#2C3E30] placeholder:text-stone-400 focus:outline-none focus:border-[#5F7E66]"
              />
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#5F7E66] hover:bg-[#4E6B55] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Đăng ký ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* 3. Bottom Copyright & Certifications */}
        <div className="pt-8 border-t border-[#E3D9C9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <span>© 2026 NUTRIO Inc. Bảo lưu mọi quyền.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-[#5A6E5E]">
            <span>🌿 Chứng nhận VietGAP</span>
            <span>•</span>
            <span>🎯 Tiêu chuẩn Nutri-Score EU</span>
            <span>•</span>
            <span>🛡️ Kiểm nghiệm Eurofins</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
