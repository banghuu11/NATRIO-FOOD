import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const body = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const heading = Fraunces({ subsets: ['latin', 'vietnamese'], weight: ['500', '600', '700'], variable: '--font-heading', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'NUTRIO Food – Hạt dinh dưỡng & Granola theo nhu cầu calo của bạn', template: '%s | NUTRIO Food' },
  description:
    'Hạt Macca, Hạnh nhân, Óc chó, Hạt điều, Granola sấy mộc. Tính BMI/TDEE miễn phí, thực đơn 7 ngày thông minh, lọc dị ứng và gợi ý sản phẩm cá nhân hóa.',
  keywords: ['hạt dinh dưỡng', 'hạt macca', 'hạnh nhân', 'óc chó', 'hạt điều', 'granola', 'eat clean', 'keto', 'tdee'],
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'NUTRIO Food' },
};

export const viewport: Viewport = { themeColor: '#2f6139', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${heading.variable}`}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
