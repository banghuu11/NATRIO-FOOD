'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/kit';
import { ProductForm, emptyProduct } from '@/components/admin/product-form';

export default function NewProduct() {
  return (
    <div>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-700"><ArrowLeft className="h-4 w-4" /> Sản phẩm</Link>
      <PageHeader title="Thêm sản phẩm" description="Sau khi tạo, nhập hàng tại mục Kho hàng để sản phẩm có tồn kho." />
      <ProductForm initial={emptyProduct} />
    </div>
  );
}
