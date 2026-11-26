'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Select } from '@/components/ui/form';

export interface VariantOption { id: number; sku: string; label: string; price: number }

export function useVariantOptions() {
  return useQuery({ queryKey: ['variant-options'], queryFn: () => get<VariantOption[]>('/admin/catalog/variants'), staleTime: 60_000 });
}

export function VariantSelect({ value, onChange, allowEmpty = false, className }: { value: number | null; onChange: (id: number | null) => void; allowEmpty?: boolean; className?: string }) {
  const { data } = useVariantOptions();
  return (
    <Select className={className} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">{allowEmpty ? '— Không liên kết sản phẩm —' : '— Chọn sản phẩm —'}</option>
      {data?.map((v) => <option key={v.id} value={v.id}>{v.label} · {formatPrice(v.price)}</option>)}
    </Select>
  );
}
