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

import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased flex flex-col transition-colors duration-200`}>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
