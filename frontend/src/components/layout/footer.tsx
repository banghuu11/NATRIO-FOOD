'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, MapPin, Phone, ShieldCheck, Leaf, Truck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';

const SOCIAL = [
  { href: 'https://facebook.com', label: 'Facebook', path: 'M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z' },
  { href: 'https://instagram.com', label: 'Instagram', path: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM17.5 5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z' },
  { href: 'https://tiktok.com', label: 'TikTok', path: 'M16 3c.4 2.6 2 4.2 4.5 4.4v3.4c-1.6.1-3.1-.4-4.5-1.3v6.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.5a2.4 2.4 0 1 0 1.5 2.2V3H16z' },
  { href: 'https://youtube.com', label: 'YouTube', path: 'M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8zM10 15V9l5.2 3L10 15z' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const sub = useMutation({
    mutationFn: async () => (await api.post<{ message: string }>('/newsletter', { email })).data,
    onSuccess: (r) => {
      toast.success(r.message);
      setEmail('');
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <footer className="no-print mt-20 bg-forest-900 text-white/80">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, t: 'Sấy mộc, không chất bảo quản', d: 'Giữ trọn dưỡng chất tự nhiên' },
            { icon: ShieldCheck, t: 'Truy xuất nguồn gốc', d: 'Thông tin đến từng lô hàng' },
            { icon: Truck, t: 'Giao nhanh toàn quốc', d: 'Miễn phí từ 300.000₫' },
            { icon: RotateCcw, t: 'Đổi trả trong 7 ngày', d: 'Nếu sản phẩm lỗi, hư hỏng' },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-latte-300"><f.icon className="h-5 w-5" /></span>
              <div><div className="font-semibold text-white">{f.t}</div><div className="text-sm text-white/60">{f.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">Hạt dinh dưỡng & granola sấy mộc, định lượng theo nhu cầu calo của riêng bạn. Ăn hạt đúng cách – sống khỏe mỗi ngày.</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-latte-300" /> 123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 text-latte-300" /> 1900 6868 (8:00 – 21:00)</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 text-latte-300" /> hello@nutrio.vn</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-sans font-semibold text-white">Mua sắm</h4>
          <ul className="space-y-2.5 text-sm">
            {[['/products', 'Tất cả sản phẩm'], ['/products?category=cac-loai-hat', 'Các loại hạt'], ['/products?category=granola', 'Granola'], ['/combos', 'Combo tiết kiệm'], ['/compare', 'So sánh sản phẩm'], ['/track-order', 'Tra cứu đơn hàng']].map(([h, l]) => (
              <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-sans font-semibold text-white">Chính sách</h4>
          <ul className="space-y-2.5 text-sm">
            {[['/pages/gioi-thieu', 'Về NUTRIO'], ['/pages/chinh-sach-giao-hang', 'Chính sách giao hàng'], ['/pages/chinh-sach-doi-tra', 'Chính sách đổi trả'], ['/pages/chinh-sach-bao-mat', 'Chính sách bảo mật'], ['/pages/huong-dan-mua-hang', 'Hướng dẫn mua hàng']].map(([h, l]) => (
              <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-sans font-semibold text-white">Nhận ưu đãi & kiến thức dinh dưỡng</h4>
          <p className="mb-4 text-sm text-white/60">Đăng ký để nhận mã FREESHIP và bản tin mỗi tuần.</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Email không hợp lệ');
              sub.mutate();
            }}
          >
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email của bạn" className="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3.5 text-sm text-white placeholder:text-white/40 focus:border-latte-300 focus:outline-none" aria-label="Email" />
            <Button type="submit" variant="accent" loading={sub.isPending}>Đăng ký</Button>
          </form>
          <div className="mt-6 flex gap-2">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-latte-500">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold">
            {['COD', 'VietQR', 'VNPay', 'MoMo'].map((p) => <span key={p} className="rounded-md bg-white px-2 py-1 text-forest-800">{p}</span>)}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} NUTRIO Food. Thông tin dinh dưỡng chỉ mang tính tham khảo, không thay thế tư vấn y tế.</div>
    </footer>
  );
}
