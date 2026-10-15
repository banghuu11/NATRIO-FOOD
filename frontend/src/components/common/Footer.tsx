'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-slate-50 dark:bg-[#060911] border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">

        {/* 2. Main Footer Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 py-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl font-black tracking-tight text-emerald-800 dark:text-emerald-400">
                NUTRIO
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Nền tảng thực phẩm hữu cơ lành mạnh, hạt sấy mộc nhiệt thấp và giải pháp dinh dưỡng chuẩn hóa theo thể trạng người Việt.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-slate-200">Hotline: 1900 8888 (8:00 - 21:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>support@nutrio.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tòa nhà Innovation, Quận 10, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Quick Links 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Về Chúng Tôi
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Câu chuyện thương hiệu
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Nông trường hữu cơ Đà Lạt
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Hệ thống kiểm định Nutri-Score
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Cổng Quản Trị (Admin Portal)
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Máy tính chỉ số TDEE & BMI
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Chính sách giao hàng 2h
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Chính sách đổi trả & hoàn tiền
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Bảo mật thông tin khách hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Đăng Ký Nhận Thực Đơn
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Nhận cẩm nang ăn sạch hàng tuần và voucher <strong>giảm 10%</strong> cho đơn hàng đầu tiên.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Đăng ký ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* 3. Bottom Copyright & Certifications */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span>© 2026 NUTRIO Inc. Bảo lưu mọi quyền.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
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
