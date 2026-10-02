import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'NUTRIO - Thế Giới Hạt Dinh Dưỡng, Granola & Khẩu Phần Ăn Sạch Cá Nhân Hóa',
  description: 'Chuyên cung cấp Hạt Macca Tây Nguyên, Hạnh nhân Mỹ, Hạt điều Bình Phước, Óc chó Chandler và Granola sấy mộc. Tự động tính toán Calo & định lượng khẩu phần theo TDEE.',
  keywords: ['hạt dinh dưỡng', 'hạt macca', 'hạnh nhân mỹ', 'hạt điều bình phước', 'hạt óc chó', 'granola siêu hạt', 'bơ hạt', 'nutrio food'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className={`${inter.variable} min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
