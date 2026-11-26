'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useUi } from '@/stores/ui';
import { Card, PageHeader, Table } from '@/components/admin/kit';
import { VariantSelect } from '@/components/admin/variant-picker';
import { Button } from '@/components/ui/button';
import { Checkbox, ChipGroup, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Notice, Spinner } from '@/components/ui/feedback';
import { Badge, SmartImage, Tabs } from '@/components/ui/misc';
import { Modal } from '@/components/ui/overlay';
import { ImageUploader } from '@/components/shop/image-uploader';

const msg = (r: { data: unknown }) => toast.success((r.data as { message?: string }).message ?? 'Đã lưu');

export default function ContentPage() {
  const [tab, setTab] = useState<'banners' | 'posts' | 'recipes' | 'pages' | 'newsletter'>('banners');
  return (
    <div>
      <PageHeader title="Nội dung" description="Banner, bài viết dinh dưỡng, công thức, trang giới thiệu & chính sách." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'banners', label: 'Banner' }, { value: 'posts', label: 'Bài viết' }, { value: 'recipes', label: 'Công thức' }, { value: 'pages', label: 'Trang tĩnh' }, { value: 'newsletter', label: 'Đăng ký nhận tin' }]} />
      {tab === 'banners' && <Banners />}
      {tab === 'posts' && <Posts />}
      {tab === 'recipes' && <Recipes />}
      {tab === 'pages' && <Pages />}
      {tab === 'newsletter' && <Newsletter />}
    </div>
  );
}

interface BannerT { id: number; title: string | null; subtitle: string | null; ctaLabel: string | null; imageUrl: string; linkUrl: string | null; position: string; sortOrder: number; isActive: boolean }
function Banners() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-banners'], queryFn: () => get<BannerT[]>('/admin/banners') });
  const [edit, setEdit] = useState<Partial<BannerT> | null>(null);
  const save = useMutation({ mutationFn: () => { const { id, ...b } = edit!; return id ? api.put(`/admin/banners/${id}`, b) : api.post('/admin/banners', b); }, onSuccess: (r) => { msg(r); setEdit(null); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/banners/${id}`), onSuccess: (r) => { msg(r); q.refetch(); } });
  return (
    <Card title="Banner trang chủ" actions={<Button size="sm" onClick={() => setEdit({ position: 'home_hero', sortOrder: 0, isActive: true, imageUrl: '' })}><Plus className="h-4 w-4" /> Thêm banner</Button>}>
      {q.isLoading ? <Spinner /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {q.data?.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-line">
              <div className="relative aspect-[3/1]"><SmartImage src={b.imageUrl} alt="" fill sizes="50vw" className="object-cover" /></div>
              <div className="flex items-start justify-between gap-2 p-3 text-sm">
                <div><div className="font-semibold">{b.title}</div><div className="text-xs text-muted">{b.position === 'home_hero' ? 'Banner lớn' : 'Banner khuyến mãi'} · thứ tự {b.sortOrder} · {b.linkUrl}</div><Badge tone={b.isActive ? 'green' : 'neutral'}>{b.isActive ? 'Hiển thị' : 'Ẩn'}</Badge></div>
                <div className="flex"><button onClick={() => setEdit(b)} className="cursor-pointer p-2 text-muted hover:text-forest-700" aria-label="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={async () => (await ask({ title: 'Xóa banner?', confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(b.id)} className="cursor-pointer p-2 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa banner' : 'Thêm banner'} size="lg" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => (edit?.imageUrl ? save.mutate() : toast.error('Vui lòng chọn ảnh banner'))}>Lưu</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ảnh banner" required className="sm:col-span-2"><ImageUploader value={edit.imageUrl ? [edit.imageUrl] : []} onChange={(u) => setEdit({ ...edit, imageUrl: u[0] ?? '' })} max={1} /></Field>
            <Field label="Tiêu đề"><Input value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Nhãn nút"><Input value={edit.ctaLabel ?? ''} onChange={(e) => setEdit({ ...edit, ctaLabel: e.target.value })} /></Field>
            <Field label="Phụ đề" className="sm:col-span-2"><Input value={edit.subtitle ?? ''} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
            <Field label="Liên kết"><Input value={edit.linkUrl ?? ''} onChange={(e) => setEdit({ ...edit, linkUrl: e.target.value })} placeholder="/products?category=keto" /></Field>
            <Field label="Vị trí"><Select value={edit.position} onChange={(e) => setEdit({ ...edit, position: e.target.value })}><option value="home_hero">Banner lớn đầu trang</option><option value="home_promo">Banner khuyến mãi</option></Select></Field>
            <Field label="Thứ tự"><Input type="number" value={edit.sortOrder ?? 0} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></Field>
            <Checkbox checked={!!edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} label="Hiển thị" />
          </div>
        )}
      </Modal>
    </Card>
  );
}

interface PostT { id: number; title: string; summary: string | null; content: string; coverImageUrl: string | null; categorySlug: string | null; category: string | null; expertReviewer: string | null; isPublished: boolean; publishedAt: string | null; viewCount: number }
function Posts() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-posts'], queryFn: () => get<{ data: PostT[]; categories: { slug: string; name: string }[] }>('/admin/posts') });
  const [edit, setEdit] = useState<Partial<PostT> | null>(null);
  const save = useMutation({
    mutationFn: () => { const e = edit!; const body = { title: e.title, summary: e.summary || undefined, content: e.content, coverImageUrl: e.coverImageUrl || undefined, categorySlug: e.categorySlug || undefined, expertReviewer: e.expertReviewer || undefined, isPublished: !!e.isPublished }; return e.id ? api.put(`/admin/posts/${e.id}`, body) : api.post('/admin/posts', body); },
    onSuccess: (r) => { msg(r); setEdit(null); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/posts/${id}`), onSuccess: (r) => { msg(r); q.refetch(); } });
  return (
    <Card title="Bài viết dinh dưỡng" actions={<Button size="sm" onClick={() => setEdit({ title: '', content: '', isPublished: false })}><Plus className="h-4 w-4" /> Viết bài</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : (
        <Table head={['Tiêu đề', 'Chuyên mục', 'Ngày đăng', 'Lượt xem', 'Trạng thái', '']} empty={!q.data?.data.length}>
          {q.data?.data.map((p) => (
            <tr key={p.id}><td className="px-4 py-2.5 font-medium">{p.title}</td><td className="px-4">{p.category}</td><td className="px-4 text-muted">{formatDate(p.publishedAt)}</td><td className="px-4">{p.viewCount}</td><td className="px-4"><Badge tone={p.isPublished ? 'green' : 'warning'}>{p.isPublished ? 'Đã đăng' : 'Nháp'}</Badge></td>
              <td className="px-4"><div className="flex justify-end"><button onClick={() => setEdit(p)} className="cursor-pointer p-2 text-muted hover:text-forest-700" aria-label="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={async () => (await ask({ title: `Xóa bài “${p.title}”?`, confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(p.id)} className="cursor-pointer p-2 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button></div></td></tr>
          ))}
        </Table>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Sửa bài viết' : 'Bài viết mới'} size="xl" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => (edit?.title?.trim() && edit.content?.trim() ? save.mutate() : toast.error('Nhập tiêu đề và nội dung'))}>Lưu</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tiêu đề" required className="sm:col-span-2"><Input value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Chuyên mục"><Select value={edit.categorySlug ?? ''} onChange={(e) => setEdit({ ...edit, categorySlug: e.target.value })}><option value="">—</option>{q.data?.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select></Field>
            <Field label="Chuyên gia thẩm định"><Input value={edit.expertReviewer ?? ''} onChange={(e) => setEdit({ ...edit, expertReviewer: e.target.value })} /></Field>
            <Field label="Tóm tắt" className="sm:col-span-2"><Textarea value={edit.summary ?? ''} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} className="min-h-16" /></Field>
            <Field label="Nội dung" hint="Dòng “## …” là tiêu đề mục, dòng “- …” là danh sách, cách đoạn bằng một dòng trống" required className="sm:col-span-2"><Textarea value={edit.content ?? ''} onChange={(e) => setEdit({ ...edit, content: e.target.value })} className="min-h-64 font-mono text-[13px]" /></Field>
            <Field label="Ảnh bìa"><ImageUploader value={edit.coverImageUrl ? [edit.coverImageUrl] : []} onChange={(u) => setEdit({ ...edit, coverImageUrl: u[0] ?? null })} max={1} /></Field>
            <Checkbox checked={!!edit.isPublished} onChange={(v) => setEdit({ ...edit, isPublished: v })} label="Đăng công khai" />
          </div>
        )}
      </Modal>
    </Card>
  );
}

interface RecipeT { id: number; title: string; description: string | null; imageUrl: string | null; prepMinutes: number | null; cookMinutes: number | null; servings: number; difficulty: 'easy' | 'medium' | 'hard'; caloriesPerServing: number; proteinG: number; carbG: number; fatG: number; mealTypes: string[]; diets: string[]; isPublished: boolean; viewCount: number; ingredients: { name: string; quantity: number | null; unit: string | null; variantId: number | null }[]; steps: string[] }
const MEALS = [{ value: 'breakfast', label: 'Sáng' }, { value: 'lunch', label: 'Trưa' }, { value: 'dinner', label: 'Tối' }, { value: 'snack', label: 'Phụ' }];
const DIETS = [{ value: 'eat_clean', label: 'Eat Clean' }, { value: 'keto', label: 'Keto' }, { value: 'vegan', label: 'Thuần chay' }, { value: 'vegetarian', label: 'Ăn chay' }, { value: 'high_protein', label: 'Giàu đạm' }, { value: 'low_carb', label: 'Ít tinh bột' }, { value: 'gluten_free', label: 'Không gluten' }];
function Recipes() {
  const ask = useUi((s) => s.ask);
  const q = useQuery({ queryKey: ['admin-recipes'], queryFn: () => get<RecipeT[]>('/admin/recipes') });
  const [edit, setEdit] = useState<Partial<RecipeT> | null>(null);
  const [err, setErr] = useState('');
  const save = useMutation({
    mutationFn: () => { const { id, ...rest } = edit as RecipeT; const b: Omit<RecipeT, 'id' | 'viewCount'> & { viewCount?: number } = { ...rest }; delete b.viewCount; return id ? api.put(`/admin/recipes/${id}`, { ...b, imageUrl: b.imageUrl || undefined, description: b.description || undefined, prepMinutes: b.prepMinutes ?? undefined, cookMinutes: b.cookMinutes ?? undefined, ingredients: b.ingredients.filter((i) => i.name.trim()), steps: b.steps.filter((s) => s.trim()) }) : api.post('/admin/recipes', { ...b, imageUrl: b.imageUrl || undefined, description: b.description || undefined, prepMinutes: b.prepMinutes ?? undefined, cookMinutes: b.cookMinutes ?? undefined, ingredients: b.ingredients.filter((i) => i.name.trim()), steps: b.steps.filter((s) => s.trim()) }); },
    onSuccess: (r) => { msg(r); setEdit(null); q.refetch(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({ mutationFn: (id: number) => api.delete(`/admin/recipes/${id}`), onSuccess: (r) => { msg(r); q.refetch(); } });
  const e = edit as RecipeT | null;
  return (
    <Card title="Công thức nấu ăn" actions={<Button size="sm" onClick={() => { setErr(''); setEdit({ title: '', servings: 1, difficulty: 'easy', caloriesPerServing: 0, proteinG: 0, carbG: 0, fatG: 0, mealTypes: [], diets: [], isPublished: false, ingredients: [{ name: '', quantity: null, unit: 'g', variantId: null }], steps: [''] }); }}><Plus className="h-4 w-4" /> Thêm công thức</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : (
        <Table head={['Món', 'Calo/phần', 'Bữa', 'Nguyên liệu tại shop', 'Lượt xem', 'Trạng thái', '']} empty={!q.data?.length}>
          {q.data?.map((r) => (
            <tr key={r.id}><td className="px-4 py-2.5"><div className="flex items-center gap-3"><SmartImage src={r.imageUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" /><span className="font-medium">{r.title}</span></div></td><td className="px-4">{r.caloriesPerServing}</td><td className="px-4 text-xs">{r.mealTypes.map((m) => MEALS.find((x) => x.value === m)?.label).join(', ')}</td><td className="px-4">{r.ingredients.filter((i) => i.variantId).length}/{r.ingredients.length}</td><td className="px-4">{r.viewCount}</td><td className="px-4"><Badge tone={r.isPublished ? 'green' : 'warning'}>{r.isPublished ? 'Hiển thị' : 'Nháp'}</Badge></td>
              <td className="px-4"><div className="flex justify-end"><button onClick={() => { setErr(''); setEdit({ ...r, ingredients: r.ingredients.length ? r.ingredients : [{ name: '', quantity: null, unit: 'g', variantId: null }], steps: r.steps.length ? r.steps : [''] }); }} className="cursor-pointer p-2 text-muted hover:text-forest-700" aria-label="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={async () => (await ask({ title: `Xóa “${r.title}”?`, confirmLabel: 'Xóa', tone: 'danger' })).ok && del.mutate(r.id)} className="cursor-pointer p-2 text-muted hover:text-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button></div></td></tr>
          ))}
        </Table>
      )}
      <Modal open={!!e} onClose={() => setEdit(null)} title={e?.id ? 'Sửa công thức' : 'Công thức mới'} size="xl" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => { if (!e!.title.trim()) return setErr('Nhập tên món'); if (!(e!.caloriesPerServing > 0)) return setErr('Nhập calo mỗi phần'); if (!e!.mealTypes.length) return setErr('Chọn ít nhất một bữa (dùng cho thực đơn)'); setErr(''); save.mutate(); }}>Lưu</Button></>}>
        {e && (
          <div className="space-y-4">
            {err && <Notice tone="danger">{err}</Notice>}
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Tên món" required className="sm:col-span-2"><Input value={e.title} onChange={(x) => setEdit({ ...e, title: x.target.value })} /></Field>
              <Field label="Khẩu phần"><Input type="number" min={1} value={e.servings} onChange={(x) => setEdit({ ...e, servings: Number(x.target.value) || 1 })} /></Field>
              <Field label="Độ khó"><Select value={e.difficulty} onChange={(x) => setEdit({ ...e, difficulty: x.target.value as RecipeT['difficulty'] })}><option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option></Select></Field>
              <Field label="Chuẩn bị (phút)"><Input type="number" value={e.prepMinutes ?? ''} onChange={(x) => setEdit({ ...e, prepMinutes: x.target.value ? Number(x.target.value) : null })} /></Field>
              <Field label="Nấu (phút)"><Input type="number" value={e.cookMinutes ?? ''} onChange={(x) => setEdit({ ...e, cookMinutes: x.target.value ? Number(x.target.value) : null })} /></Field>
              <Field label="Calo / phần" required><Input type="number" value={e.caloriesPerServing} onChange={(x) => setEdit({ ...e, caloriesPerServing: Number(x.target.value) })} /></Field>
              <Field label="Đạm / Carb / Béo (g)"><div className="flex gap-1">{(['proteinG', 'carbG', 'fatG'] as const).map((k) => <Input key={k} type="number" value={e[k]} onChange={(x) => setEdit({ ...e, [k]: Number(x.target.value) })} />)}</div></Field>
              <Field label="Mô tả" className="sm:col-span-4"><Textarea value={e.description ?? ''} onChange={(x) => setEdit({ ...e, description: x.target.value })} className="min-h-16" /></Field>
            </div>
            <Field label="Bữa phù hợp"><ChipGroup multiple value={e.mealTypes} onChange={(v: string[]) => setEdit({ ...e, mealTypes: v })} options={MEALS} /></Field>
            <Field label="Chế độ ăn"><ChipGroup multiple value={e.diets} onChange={(v: string[]) => setEdit({ ...e, diets: v })} options={DIETS} /></Field>
            <Field label="Nguyên liệu (liên kết sản phẩm để khách thêm vào giỏ)">
              <div className="space-y-2">
                {e.ingredients.map((ing, i) => (
                  <div key={i} className="flex flex-wrap gap-2">
                    <Input className="min-w-40 flex-1" value={ing.name} placeholder="Tên nguyên liệu" onChange={(x) => setEdit({ ...e, ingredients: e.ingredients.map((y, k) => (k === i ? { ...y, name: x.target.value } : y)) })} />
                    <Input className="w-20" type="number" value={ing.quantity ?? ''} placeholder="SL" onChange={(x) => setEdit({ ...e, ingredients: e.ingredients.map((y, k) => (k === i ? { ...y, quantity: x.target.value ? Number(x.target.value) : null } : y)) })} />
                    <Input className="w-20" value={ing.unit ?? ''} placeholder="đơn vị" onChange={(x) => setEdit({ ...e, ingredients: e.ingredients.map((y, k) => (k === i ? { ...y, unit: x.target.value } : y)) })} />
                    <VariantSelect allowEmpty className="w-72" value={ing.variantId} onChange={(id) => setEdit({ ...e, ingredients: e.ingredients.map((y, k) => (k === i ? { ...y, variantId: id } : y)) })} />
                    <button onClick={() => setEdit({ ...e, ingredients: e.ingredients.filter((_, k) => k !== i) })} className="cursor-pointer p-2 text-muted hover:text-danger" aria-label="Bỏ"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setEdit({ ...e, ingredients: [...e.ingredients, { name: '', quantity: null, unit: 'g', variantId: null }] })}><Plus className="h-4 w-4" /> Nguyên liệu</Button>
              </div>
            </Field>
            <Field label="Các bước thực hiện">
              <div className="space-y-2">
                {e.steps.map((s, i) => (
                  <div key={i} className="flex gap-2"><span className="mt-2.5 w-6 text-sm font-bold text-forest-700">{i + 1}.</span><Textarea value={s} className="min-h-12" onChange={(x) => setEdit({ ...e, steps: e.steps.map((y, k) => (k === i ? x.target.value : y)) })} /><button onClick={() => setEdit({ ...e, steps: e.steps.filter((_, k) => k !== i) })} className="cursor-pointer p-2 text-muted hover:text-danger" aria-label="Bỏ"><X className="h-4 w-4" /></button></div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setEdit({ ...e, steps: [...e.steps, ''] })}><Plus className="h-4 w-4" /> Bước</Button>
              </div>
            </Field>
            <div className="flex flex-wrap items-end gap-6"><Field label="Ảnh món"><ImageUploader value={e.imageUrl ? [e.imageUrl] : []} onChange={(u) => setEdit({ ...e, imageUrl: u[0] ?? null })} max={1} /></Field><Checkbox checked={e.isPublished} onChange={(v) => setEdit({ ...e, isPublished: v })} label="Hiển thị trên website" /></div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

interface PageT { id: number; slug: string; title: string; content: string; isPublished: boolean; updatedAt: string }
function Pages() {
  const q = useQuery({ queryKey: ['admin-pages'], queryFn: () => get<PageT[]>('/admin/pages') });
  const [edit, setEdit] = useState<{ slug: string; title: string; content: string; isPublished: boolean; isNew?: boolean } | null>(null);
  const save = useMutation({ mutationFn: () => api.put(`/admin/pages/${edit!.slug}`, { title: edit!.title, content: edit!.content, isPublished: edit!.isPublished }), onSuccess: (r) => { msg(r); setEdit(null); q.refetch(); }, onError: (e) => toast.error(apiError(e)) });
  return (
    <Card title="Trang giới thiệu & chính sách" actions={<Button size="sm" onClick={() => setEdit({ slug: '', title: '', content: '', isPublished: true, isNew: true })}><Plus className="h-4 w-4" /> Trang mới</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : (
        <Table head={['Trang', 'Đường dẫn', 'Cập nhật', 'Trạng thái', '']}>
          {q.data?.map((p) => <tr key={p.id}><td className="px-4 py-2.5 font-medium">{p.title}</td><td className="px-4 font-mono text-xs text-muted">/pages/{p.slug}</td><td className="px-4 text-muted">{formatDate(p.updatedAt, true)}</td><td className="px-4"><Badge tone={p.isPublished ? 'green' : 'neutral'}>{p.isPublished ? 'Hiển thị' : 'Ẩn'}</Badge></td><td className="px-4 text-right"><button onClick={() => setEdit(p)} className="cursor-pointer p-2 text-muted hover:text-forest-700" aria-label="Sửa"><Pencil className="h-4 w-4" /></button></td></tr>)}
        </Table>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.isNew ? 'Trang mới' : `Sửa: ${edit?.title}`} size="xl" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button loading={save.isPending} onClick={() => (edit?.slug && edit.title ? save.mutate() : toast.error('Nhập đường dẫn và tiêu đề'))}>Lưu</Button></>}>
        {edit && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đường dẫn" hint="vd: chinh-sach-thanh-toan"><Input value={edit.slug} disabled={!edit.isNew} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase() })} /></Field>
              <Field label="Tiêu đề"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            </div>
            <Field label="Nội dung" hint="“## …” tiêu đề mục · “- …” danh sách"><Textarea value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} className="min-h-80 font-mono text-[13px]" /></Field>
            <Checkbox checked={edit.isPublished} onChange={(v) => setEdit({ ...edit, isPublished: v })} label="Hiển thị" />
          </div>
        )}
      </Modal>
    </Card>
  );
}

function Newsletter() {
  const q = useQuery({ queryKey: ['admin-newsletter'], queryFn: () => get<{ email: string; createdAt: string }[]>('/admin/newsletter') });
  return (
    <Card title={`${q.data?.length ?? 0} email đăng ký nhận tin`} actions={<Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText((q.data ?? []).map((x) => x.email).join('\n')); toast.success('Đã sao chép danh sách email'); }}>Sao chép tất cả</Button>} padded={false}>
      {q.isLoading ? <Spinner /> : <Table head={['Email', 'Ngày đăng ký']} empty={!q.data?.length}>{q.data?.map((x) => <tr key={x.email}><td className="px-4 py-2.5">{x.email}</td><td className="px-4 text-muted">{formatDate(x.createdAt, true)}</td></tr>)}</Table>}
    </Card>
  );
}
