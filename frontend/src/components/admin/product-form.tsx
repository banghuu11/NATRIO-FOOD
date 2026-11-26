'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { Card } from './kit';
import { Button } from '@/components/ui/button';
import { Checkbox, ChipGroup, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Notice, Spinner } from '@/components/ui/feedback';
import { ImageUploader } from '@/components/shop/image-uploader';

interface Meta { categories: { id: number; name: string; parentId: number | null }[]; brands: { id: number; name: string }[]; farms: { id: number; name: string }[]; suppliers: { id: number; name: string }[]; diets: { code: string; name: string }[]; allergens: { code: string; name: string }[]; certifications: { code: string; name: string }[] }
interface V { id?: number; sku: string; name: string; netWeightG: number | ''; price: number | ''; compareAtPrice: number | '' | null; costPrice: number | '' | null; reorderLevel: number; isDefault: boolean; isActive: boolean; unitLabel: string; stock?: number }
export interface ProductFormValue {
  name: string; slug: string; categoryId: number | ''; brandId: number | null; farmId: number | null; supplierId: number | null; shortDescription: string; description: string; originCountry: string;
  storageInstruction: string; usageInstruction: string; shelfLifeDays: number | '' | null; status: string; isFeatured: boolean; metaTitle: string; metaDescription: string;
  variants: V[]; images: { url: string; altText?: string | null }[];
  nutrition: { servingSizeG: number | '' | null; caloriesKcal: number | ''; proteinG: number | ''; carbG: number | ''; fatG: number | ''; sugarG: number | ''; fiberG: number | ''; saturatedFatG: number | ''; sodiumMg: number | '' } | null;
  allergens: { code: string; relation: 'contains' | 'may_contain' }[]; diets: string[]; certifications: string[]; ingredients: { name: string; percentage: number | null }[];
}

export const emptyProduct: ProductFormValue = {
  name: '', slug: '', categoryId: '', brandId: null, farmId: null, supplierId: null, shortDescription: '', description: '', originCountry: 'Việt Nam', storageInstruction: '', usageInstruction: '', shelfLifeDays: 180,
  status: 'draft', isFeatured: false, metaTitle: '', metaDescription: '',
  variants: [{ sku: '', name: 'Túi 250g', netWeightG: 250, price: '', compareAtPrice: null, costPrice: null, reorderLevel: 10, isDefault: true, isActive: true, unitLabel: 'gói' }],
  images: [], nutrition: { servingSizeG: 30, caloriesKcal: '', proteinG: '', carbG: '', fatG: '', sugarG: 0, fiberG: 0, saturatedFatG: 0, sodiumMg: 0 }, allergens: [], diets: [], certifications: [], ingredients: [],
};

const num = (v: string) => (v === '' ? '' : Number(v));

export function ProductForm({ initial, id }: { initial: ProductFormValue; id?: number }) {
  const router = useRouter();
  const [f, setF] = useState<ProductFormValue>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const meta = useQuery({ queryKey: ['admin-catalog-meta'], queryFn: () => get<Meta>('/admin/catalog/meta') });
  const set = <K extends keyof ProductFormValue>(k: K, v: ProductFormValue[K]) => setF((x) => ({ ...x, [k]: v }));
  const setVar = (i: number, patch: Partial<V>) => set('variants', f.variants.map((v, k) => (k === i ? { ...v, ...patch } : patch.isDefault ? { ...v, isDefault: false } : v)));

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        ...f,
        slug: f.slug || undefined,
        categoryId: Number(f.categoryId),
        shelfLifeDays: f.shelfLifeDays === '' ? null : f.shelfLifeDays,
        variants: f.variants.map((v) => ({ ...v, netWeightG: Number(v.netWeightG), price: Number(v.price), compareAtPrice: v.compareAtPrice === '' || v.compareAtPrice === null ? null : Number(v.compareAtPrice), costPrice: v.costPrice === '' || v.costPrice === null ? null : Number(v.costPrice), stock: undefined })),
        nutrition: f.nutrition && f.nutrition.caloriesKcal !== '' ? Object.fromEntries(Object.entries(f.nutrition).map(([k, v]) => [k, v === '' ? 0 : v])) : undefined,
        ingredients: f.ingredients.filter((i) => i.name.trim()),
      };
      return id ? (await api.put(`/admin/products/${id}`, body)).data : (await api.post('/admin/products', body)).data;
    },
    onSuccess: (p: { id: number }) => {
      toast.success(id ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm');
      if (!id) router.replace(`/admin/products/${p.id}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const submit = () => {
    const e: string[] = [];
    if (f.name.trim().length < 3) e.push('Tên sản phẩm tối thiểu 3 ký tự');
    if (!f.categoryId) e.push('Chọn danh mục');
    if (!f.variants.length) e.push('Cần ít nhất một quy cách');
    f.variants.forEach((v, i) => {
      if (!/^[A-Za-z0-9-]{2,60}$/.test(v.sku)) e.push(`Quy cách ${i + 1}: SKU không hợp lệ`);
      if (!(Number(v.netWeightG) > 0)) e.push(`Quy cách ${i + 1}: khối lượng phải > 0`);
      if (!(Number(v.price) > 0)) e.push(`Quy cách ${i + 1}: giá bán phải > 0`);
      if (v.compareAtPrice && Number(v.compareAtPrice) < Number(v.price)) e.push(`Quy cách ${i + 1}: giá gốc phải ≥ giá bán`);
    });
    if (f.status === 'active' && !f.images.length) e.push('Sản phẩm đang bán cần ít nhất 1 ảnh');
    if (f.nutrition && f.nutrition.caloriesKcal !== '' && (f.nutrition.proteinG === '' || f.nutrition.carbG === '' || f.nutrition.fatG === '')) e.push('Nhập đủ năng lượng, đạm, carb, chất béo');
    setErrors(e);
    if (!e.length) save.mutate();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (meta.isLoading || !meta.data) return <Spinner />;
  const m = meta.data;
  const n = f.nutrition;

  return (
    <div className="space-y-5">
      {errors.length > 0 && <Notice tone="danger"><ul className="list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul></Notice>}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Thông tin cơ bản">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên sản phẩm" required className="sm:col-span-2"><Input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={255} /></Field>
              <Field label="Slug (URL)" hint="Để trống để tự tạo từ tên"><Input value={f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} placeholder="hat-macca-dak-lak" /></Field>
              <Field label="Danh mục" required><Select value={f.categoryId} onChange={(e) => set('categoryId', Number(e.target.value))}><option value="">— Chọn —</option>{m.categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>)}</Select></Field>
              <Field label="Mô tả ngắn" className="sm:col-span-2"><Textarea value={f.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} maxLength={500} className="min-h-16" /></Field>
              <Field label="Mô tả chi tiết" hint="Hỗ trợ “## Tiêu đề” và dòng bắt đầu bằng “- ” để tạo danh sách" className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => set('description', e.target.value)} className="min-h-40" /></Field>
            </div>
          </Card>

          <Card title="Hình ảnh" actions={<span className="text-xs text-muted">Ảnh đầu tiên là ảnh chính · tối đa 12</span>}>
            <ImageUploader value={f.images.map((i) => i.url)} onChange={(urls) => set('images', urls.map((url) => ({ url })))} max={12} />
          </Card>

          <Card title="Quy cách, giá bán & tồn kho" actions={<Button size="sm" variant="secondary" onClick={() => set('variants', [...f.variants, { sku: '', name: '', netWeightG: '', price: '', compareAtPrice: null, costPrice: null, reorderLevel: 10, isDefault: !f.variants.length, isActive: true, unitLabel: 'gói' }])}><Plus className="h-4 w-4" /> Thêm quy cách</Button>}>
            <div className="space-y-3">
              {f.variants.map((v, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-4 lg:grid-cols-8">
                  <Field label="SKU" className="lg:col-span-2"><Input value={v.sku} onChange={(e) => setVar(i, { sku: e.target.value.toUpperCase() })} /></Field>
                  <Field label="Tên quy cách" className="lg:col-span-2"><Input value={v.name} onChange={(e) => setVar(i, { name: e.target.value })} placeholder="Túi 250g" /></Field>
                  <Field label="Khối lượng (g)"><Input type="number" value={v.netWeightG} onChange={(e) => setVar(i, { netWeightG: num(e.target.value) })} /></Field>
                  <Field label="Giá bán (₫)"><Input type="number" value={v.price} onChange={(e) => setVar(i, { price: num(e.target.value) })} /></Field>
                  <Field label="Giá gốc (₫)" hint="Để hiện % giảm"><Input type="number" value={v.compareAtPrice ?? ''} onChange={(e) => setVar(i, { compareAtPrice: num(e.target.value) })} /></Field>
                  <Field label="Giá vốn (₫)"><Input type="number" value={v.costPrice ?? ''} onChange={(e) => setVar(i, { costPrice: num(e.target.value) })} /></Field>
                  <Field label="Mức cảnh báo"><Input type="number" value={v.reorderLevel} onChange={(e) => setVar(i, { reorderLevel: Number(e.target.value) || 0 })} /></Field>
                  <Field label="Đơn vị"><Input value={v.unitLabel} onChange={(e) => setVar(i, { unitLabel: e.target.value })} /></Field>
                  <div className="flex flex-wrap items-end gap-4 sm:col-span-2 lg:col-span-4">
                    <Checkbox checked={v.isDefault} onChange={() => setVar(i, { isDefault: true })} label="Mặc định" />
                    <Checkbox checked={v.isActive} onChange={(x) => setVar(i, { isActive: x })} label="Đang bán" />
                    {v.id && <span className="text-xs text-muted">Tồn khả dụng: <b>{v.stock ?? 0}</b> (nhập kho tại mục Kho hàng)</span>}
                    {f.variants.length > 1 && <button onClick={() => set('variants', f.variants.filter((_, k) => k !== i))} className="ml-auto cursor-pointer p-1.5 text-muted hover:text-danger" aria-label="Xóa quy cách"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Thành phần dinh dưỡng (trên 100 g)" actions={<span className="text-xs text-muted">Nutri-Score được tính tự động</span>}>
            {n && (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {([['servingSizeG', 'Khẩu phần (g)'], ['caloriesKcal', 'Năng lượng (kcal)'], ['proteinG', 'Đạm (g)'], ['carbG', 'Carb (g)'], ['fatG', 'Chất béo (g)'], ['sugarG', 'Đường (g)'], ['fiberG', 'Chất xơ (g)'], ['saturatedFatG', 'Béo bão hòa (g)'], ['sodiumMg', 'Natri (mg)']] as const).map(([k, l]) => (
                  <Field key={k} label={l}><Input type="number" step="0.1" value={n[k] ?? ''} onChange={(e) => set('nutrition', { ...n, [k]: num(e.target.value) })} /></Field>
                ))}
              </div>
            )}
          </Card>

          <Card title="Thành phần nguyên liệu" actions={<Button size="sm" variant="secondary" onClick={() => set('ingredients', [...f.ingredients, { name: '', percentage: null }])}><Plus className="h-4 w-4" /> Thêm</Button>}>
            <div className="space-y-2">
              {f.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={ing.name} onChange={(e) => set('ingredients', f.ingredients.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="Tên nguyên liệu" />
                  <Input type="number" className="w-28" value={ing.percentage ?? ''} onChange={(e) => set('ingredients', f.ingredients.map((x, k) => (k === i ? { ...x, percentage: e.target.value === '' ? null : Number(e.target.value) } : x)))} placeholder="%" />
                  <button onClick={() => set('ingredients', f.ingredients.filter((_, k) => k !== i))} className="cursor-pointer p-2 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {!f.ingredients.length && <p className="text-sm text-muted">Chưa có nguyên liệu.</p>}
            </div>
          </Card>

          <Card title="Sử dụng, bảo quản & SEO">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hướng dẫn sử dụng"><Textarea value={f.usageInstruction} onChange={(e) => set('usageInstruction', e.target.value)} /></Field>
              <Field label="Hướng dẫn bảo quản"><Textarea value={f.storageInstruction} onChange={(e) => set('storageInstruction', e.target.value)} /></Field>
              <Field label="Meta title"><Input value={f.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} maxLength={200} /></Field>
              <Field label="Meta description"><Input value={f.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} maxLength={320} /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Trạng thái hiển thị">
            <Select value={f.status} onChange={(e) => set('status', e.target.value)}><option value="draft">Nháp</option><option value="active">Đang bán (hiển thị)</option><option value="inactive">Ẩn</option><option value="discontinued">Ngừng kinh doanh</option></Select>
            <Checkbox className="mt-3" checked={f.isFeatured} onChange={(v) => set('isFeatured', v)} label="Sản phẩm nổi bật (hiện ở trang chủ)" />
          </Card>
          <Card title="Nguồn gốc">
            <div className="space-y-3">
              <Field label="Xuất xứ"><Input value={f.originCountry} onChange={(e) => set('originCountry', e.target.value)} /></Field>
              <Field label="Hạn sử dụng (ngày từ NSX)"><Input type="number" value={f.shelfLifeDays ?? ''} onChange={(e) => set('shelfLifeDays', num(e.target.value))} /></Field>
              <Field label="Thương hiệu"><Select value={f.brandId ?? ''} onChange={(e) => set('brandId', e.target.value ? Number(e.target.value) : null)}><option value="">—</option>{m.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
              <Field label="Nông trại"><Select value={f.farmId ?? ''} onChange={(e) => set('farmId', e.target.value ? Number(e.target.value) : null)}><option value="">—</option>{m.farms.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
              <Field label="Nhà cung cấp"><Select value={f.supplierId ?? ''} onChange={(e) => set('supplierId', e.target.value ? Number(e.target.value) : null)}><option value="">—</option>{m.suppliers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
            </div>
          </Card>
          <Card title="Chế độ ăn / mục tiêu"><ChipGroup multiple value={f.diets} onChange={(v: string[]) => set('diets', v)} options={m.diets.map((d) => ({ value: d.code, label: d.name }))} /></Card>
          <Card title="Cảnh báo dị ứng">
            <div className="space-y-2">
              {m.allergens.map((a) => {
                const cur = f.allergens.find((x) => x.code === a.code);
                return (
                  <div key={a.code} className="flex items-center justify-between gap-2 text-sm">
                    <span>{a.name}</span>
                    <Select className="h-9 w-36" value={cur?.relation ?? ''} onChange={(e) => set('allergens', e.target.value ? [...f.allergens.filter((x) => x.code !== a.code), { code: a.code, relation: e.target.value as 'contains' | 'may_contain' }] : f.allergens.filter((x) => x.code !== a.code))}>
                      <option value="">Không</option><option value="contains">Chứa</option><option value="may_contain">Có thể chứa</option>
                    </Select>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Chứng nhận" actions={<span className="text-xs text-muted">Chỉ chọn khi có giấy tờ</span>}><ChipGroup multiple value={f.certifications} onChange={(v: string[]) => set('certifications', v)} options={m.certifications.map((c) => ({ value: c.code, label: c.name }))} /></Card>
          <div className="sticky bottom-4 flex gap-2 rounded-2xl border border-line bg-white p-3 shadow-lift">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/admin/products')}>Hủy</Button>
            <Button className="flex-1" loading={save.isPending} onClick={submit}>{id ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
