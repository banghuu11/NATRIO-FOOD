import type { ReactNode } from 'react';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { SmartImage } from '@/components/ui/misc';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid-cols-2">
        <div className="relative hidden bg-forest-800 lg:block">
          <SmartImage src="/images/products/mixed-3.jpg" alt="" fill sizes="50vw" className="object-cover opacity-50" />
          <div className="relative flex h-full flex-col justify-end gap-4 p-10 text-white">
            <h2 className="text-3xl text-white">Ăn hạt đúng cách, sống khỏe mỗi ngày</h2>
            {[[Sparkles, 'Tích điểm Bronze – Silver – Gold'], [Leaf, 'Gợi ý sản phẩm theo TDEE & dị ứng'], [ShieldCheck, 'Theo dõi đơn hàng, mua lại 1 chạm']].map(([I, t], k) => {
              const Icon = I as typeof Leaf;
              return <div key={k} className="flex items-center gap-2 text-white/85"><Icon className="h-5 w-5 text-latte-300" /> {t as string}</div>;
            })}
          </div>
        </div>
        <div className="p-7 sm:p-10">
          <h1 className="text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
