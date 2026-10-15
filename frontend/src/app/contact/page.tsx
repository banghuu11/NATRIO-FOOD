'use client';

import React, { useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CartDrawer from '@/components/storefront/CartDrawer';
import { Phone, Mail, MapPin, Clock, Send, MessageSquareText, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const ScrollNut3D = dynamic(() => import('@/components/storefront/ScrollNut3D'), {
  ssr: false,
});

export default function ContactPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('tu_van');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Vui lòng nhập Họ tên và Số điện thoại!');
      return;
    }
    toast.success('Gửi liên hệ thành công!', {
      description: `Cảm ơn ${name}. Chuyên viên Nutrio sẽ liên hệ lại qua SĐT ${phone} trong vòng 15 phút.`,
    });
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* 3D Nut Scroll Animation */}
      <ScrollNut3D />

      {/* Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 pb-20">
        
        {/* Banner */}
        <section className="pt-10 pb-12 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              TRUNG TÂM HỖ TRỢ & LIÊN HỆ
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              Chúng Tôi Luôn Sẵn Sàng Lắng Nghe Bạn
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Liên hệ hợp tác phân phối, tư vấn khẩu phần dinh dưỡng hoặc phản ánh chất lượng sản phẩm.
            </p>
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-14">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Contact Info Cards */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hotline CSKH & Đặt Hàng</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tư vấn miễn cước cuộc gọi</p>
                    <a href="tel:19008888" className="inline-block text-base font-black text-emerald-700 dark:text-emerald-400 mt-1 hover:underline">
                      1900 8888
                    </a>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hộp Thư Điện Tử</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Phản hồi thư trong 2 giờ làm việc</p>
                    <a href="mailto:support@nutrio.vn" className="inline-block text-sm font-bold text-blue-600 dark:text-blue-400 mt-1 hover:underline">
                      support@nutrio.vn
                    </a>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Trụ Sở & Showroom Trải Nghiệm</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Tòa nhà Innovation Building, Đường Sư Vạn Hạnh, Phường 12, Quận 10, TP. Hồ Chí Minh
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 08:00 - 21:00 (Tất cả các ngày trong tuần)
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleSubmit}
                  className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Gửi Tin Nhắn Trực Tiếp</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Hãy để lại câu hỏi hoặc yêu cầu, chuyên viên dinh dưỡng sẽ liên lạc với bạn sớm nhất.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Họ và tên của bạn *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ví dụ: 0912 345 678"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Chủ đề cần hỗ trợ
                      </label>
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="tu_van">Tư vấn thực đơn & Khẩu phần calo</option>
                        <option value="don_hang">Tra cứu & Khiếu nại đơn hàng</option>
                        <option value="dai_ly">Hợp tác đại lý / Phân phối sỉ</option>
                        <option value="khac">Vấn đề khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nội dung tin nhắn
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mô tả cụ thể thắc mắc hoặc yêu cầu của bạn..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi Lời Nhắn Đến Nutrio</span>
                  </button>
                </form>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <Footer />

    </div>
  );
}
