'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Leaf, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  HeartHandshake, 
  Truck, 
  RefreshCcw 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Value Proposition Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Chuẩn Sạch</h4>
              <p className="text-xs text-slate-400">VietGAP & Organic kiểm định</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cá Nhân Hóa Calo</h4>
              <p className="text-xs text-slate-400">Định lượng theo chỉ số TDEE</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Giao Nhanh 2 Giờ</h4>
              <p className="text-xs text-slate-400">Bảo quản lạnh giữ trọn độ tươi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Đổi Trả Dễ Dàng</h4>
              <p className="text-xs text-slate-400">Hoàn tiền 100% nếu không hài lòng</p>
            </div>
          </div>
        </div>

        {/* 2. Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                NUTRIO<span className="text-emerald-500">.</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Nền tảng thương mại điện tử thực phẩm sạch và dinh dưỡng thông minh hàng đầu. Giúp bạn chủ động kiểm soát calo và xây dựng lối sống lành mạnh bền vững.
            </p>

            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>HUFLIT Campus, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hotline: 1900 8888 (8:00 - 21:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>support@nutriofood.vn</span>
              </div>
            </div>
          </div>

          {/* Col 2: Về NUTRIO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Về NUTRIO</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Câu chuyện thương hiệu</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Chuỗi nông trại liên kết</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Quy trình kiểm định Calo</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Tuyển dụng & Hợp tác</a></li>
            </ul>
          </div>

          {/* Col 3: Dịch vụ & Dinh dưỡng */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dịch Vụ Sức Khỏe</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#health-calculator" className="hover:text-emerald-400 transition-colors">Tính BMR & TDEE</a></li>
              <li><a href="#meal-plan" className="hover:text-emerald-400 transition-colors">Thực đơn Eat-Clean 7 ngày</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Gói giao định kỳ theo tuần</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Tư vấn dinh dưỡng AI</a></li>
            </ul>
          </div>

          {/* Col 4: Hỗ trợ khách hàng */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hỗ Trợ Khách Hàng</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Chính sách giao hàng</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Chính sách đổi trả 100%</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hướng dẫn thanh toán VNPay/MoMo</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Bảo mật thông tin</a></li>
            </ul>
          </div>
        </div>

        {/* 3. Copyright Row */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 NUTRIO (NATRIOFOOD) — Đồ án tốt nghiệp Thương mại điện tử Dinh dưỡng Nhóm 04.</p>
          <p>Thiết kế hướng người dùng & Tối ưu hiệu năng trải nghiệm.</p>
        </div>

      </div>
    </footer>
  );
}
