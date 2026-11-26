'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Clock, Dumbbell, Flame, HeartPulse, Leaf, MessageCircle, Microscope, Quote, Scale, ShieldCheck, Sprout, Timer, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { useAuth } from '@/stores/auth';
import type { Bundle, CategoryNode, PostCard, ProductCard as PC, Recipe, Review } from '@/types';
import { ProductCard } from '@/components/shop/product-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { Badge, SectionTitle, SmartImage, Stars } from '@/components/ui/misc';

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  const flat = categories.flatMap((c) => (c.children.length ? c.children : [c]));
  return (
    <section className="container-page mt-14">
      <SectionTitle eyebrow="Danh mục" title="Thực phẩm dinh dưỡng cho mọi nhu cầu" action={<Link href="/products" className="text-sm font-semibold text-forest-700 hover:underline">Xem tất cả →</Link>} />
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
        {flat.map((c) => (
          <Link key={c.id} href={`/products?category=${c.slug}`} className="group w-36 shrink-0 snap-start sm:w-auto">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand-100">
              <SmartImage src={c.imageUrl} alt={c.name} fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent" />
              <div className="absolute inset-x-3 bottom-3 text-white">
                <div className="text-[15px] leading-tight font-semibold">{c.name}</div>
                <div className="text-xs text-white/75">{c.productCount} sản phẩm</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function useCountdown(to: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(to).getTime() - now);
  return [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60];
}

export function FlashSale({ sale }: { sale: { name: string; endsAt: string; items: (PC & { salePrice: number; quantityLimit: number; soldCount: number })[] } }) {
  const [d, h, m, s] = useCountdown(sale.endsAt);
  return (
    <section className="container-page mt-14">
      <div className="rounded-3xl bg-gradient-to-br from-latte-500 to-latte-700 p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-white">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase"><Zap className="h-4 w-4 fill-current" /> Flash Sale</div>
            <h2 className="mt-1 text-2xl text-white sm:text-3xl">{sale.name}</h2>
          </div>
          <div className="flex items-center gap-2" aria-label="Thời gian còn lại">
            <Timer className="h-5 w-5" />
            {[[d, 'ngày'], [h, 'giờ'], [m, 'phút'], [s, 'giây']].map(([v, l]) => (
              <div key={l as string} className="min-w-14 rounded-xl bg-white/15 px-2 py-1.5 text-center backdrop-blur">
                <div className="text-xl font-bold tabular-nums">{String(v).padStart(2, '0')}</div>
                <div className="text-[10px] uppercase opacity-80">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {sale.items.map((p) => {
            const pct = Math.round((p.soldCount / p.quantityLimit) * 100);
            const card = { ...p, defaultVariant: p.defaultVariant ? { ...p.defaultVariant, compareAtPrice: p.defaultVariant.price, price: p.salePrice, discountPercent: Math.round((1 - p.salePrice / p.defaultVariant.price) * 100) } : null };
            return (
              <div key={p.id} className="flex flex-col">
                <ProductCard product={card} className="flex-1" />
                <div className="mt-2 rounded-full bg-white/20 p-0.5">
                  <div className="relative h-5 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(8, pct)}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-latte-700">Đã bán {p.soldCount}/{p.quantityLimit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProductRow({ eyebrow, title, products, href }: { eyebrow: string; title: string; products: PC[]; href: string }) {
  if (!products.length) return null;
  return (
    <section className="container-page mt-16">
      <SectionTitle eyebrow={eyebrow} title={title} action={<Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:gap-2">Xem thêm <ArrowRight className="h-4 w-4" /></Link>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

const NEEDS = [
  { icon: Scale, title: 'Giảm cân', desc: 'Ít calo, nhiều chất xơ, no lâu', href: '/products?diets=low_calorie', color: 'bg-forest-50 text-forest-700' },
  { icon: Dumbbell, title: 'Tập gym – tăng cơ', desc: 'Giàu đạm thực vật', href: '/products?category=tap-gym', color: 'bg-latte-500/10 text-latte-700' },
  { icon: Flame, title: 'Keto / Low-carb', desc: 'Carb ròng thấp, chất béo tốt', href: '/products?category=keto', color: 'bg-amber-50 text-amber-800' },
  { icon: Sprout, title: 'Eat Clean', desc: 'Nguyên liệu tối giản, sạch', href: '/products?category=eat-clean', color: 'bg-emerald-50 text-emerald-800' },
  { icon: HeartPulse, title: 'Tim mạch & đường huyết', desc: 'Omega-3, không đường', href: '/products?diets=sugar_free', color: 'bg-rose-50 text-rose-800' },
];

export function ShopByNeed({ bundles }: { bundles: Bundle[] }) {
  const { add } = useCartActions();
  return (
    <section className="container-page mt-16">
      <SectionTitle eyebrow="Combo theo nhu cầu" title="Chọn theo mục tiêu sức khỏe của bạn" description="Mỗi combo được chuyên gia dinh dưỡng NUTRIO phối sẵn, tiết kiệm hơn mua lẻ." action={<Link href="/combos" className="text-sm font-semibold text-forest-700 hover:underline">Tất cả combo →</Link>} />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {NEEDS.map((n) => (
          <Link key={n.title} href={n.href} className="group rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
            <span className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-xl', n.color)}><n.icon className="h-5 w-5" /></span>
            <div className="font-semibold group-hover:text-forest-700">{n.title}</div>
            <div className="text-xs text-muted">{n.desc}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {bundles.map((b) => (
          <div key={b.id} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
            <div className="relative aspect-[4/3] overflow-hidden">
              <SmartImage src={b.image} alt={b.name} fill sizes="25vw" className="object-cover transition duration-500 group-hover:scale-105" />
              {b.savePercent > 0 && <Badge tone="sale" className="absolute top-3 left-3">Tiết kiệm {b.savePercent}%</Badge>}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-sans text-base font-semibold">{b.name}</h3>
              <ul className="mt-2 space-y-0.5 text-xs text-muted">{b.items.map((it) => <li key={it.slug + it.variantName}>• {it.name} ({it.variantName})</li>)}</ul>
              <div className="mt-auto flex items-end justify-between pt-4">
                <div>
                  <div className="text-lg font-bold text-forest-700">{formatPrice(b.price)}</div>
                  <div className="text-xs text-muted line-through">{formatPrice(b.retailPrice)}</div>
                </div>
                <Button size="sm" disabled={b.availableStock <= 0} loading={add.isPending && add.variables?.bundleId === b.id} onClick={() => add.mutate({ bundleId: b.id, quantity: 1, name: b.name })}>
                  {b.availableStock > 0 ? 'Thêm combo' : 'Hết hàng'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WhyNutrio() {
  const items = [
    { icon: Leaf, t: 'Sấy mộc ở 60°C', d: 'Không dầu chiên, không chất bảo quản, giữ trọn vitamin E & omega-3.' },
    { icon: Microscope, t: 'Kiểm nghiệm từng lô', d: 'Mỗi lô hàng có mã QR truy xuất nông trại, ngày thu hoạch và kết quả kiểm nghiệm.' },
    { icon: Scale, t: 'Định lượng theo TDEE', d: 'Biết chính xác bạn nên ăn bao nhiêu gram hạt mỗi ngày cho mục tiêu của mình.' },
    { icon: ShieldCheck, t: 'An toàn dị ứng', d: 'Khai báo dị ứng một lần – cảnh báo đỏ trên mọi sản phẩm có chứa thành phần đó.' },
  ];
  return (
    <section className="mt-20 bg-sand-50 py-16">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <div className="relative aspect-[5/4] overflow-hidden rounded-3xl">
          <SmartImage src="/images/products/almond-3.jpg" alt="Hạnh nhân NUTRIO" fill sizes="50vw" className="object-cover" />
          <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 p-4 shadow-lift backdrop-blur">
            <div className="text-xs font-semibold text-muted uppercase">Khẩu phần khuyến nghị</div>
            <div className="font-display text-3xl font-bold text-forest-700">30 g / ngày</div>
            <div className="text-xs text-muted">≈ 160–200 kcal · một nắm tay nhỏ</div>
          </div>
        </div>
        <div>
          <SectionTitle eyebrow="Vì sao chọn NUTRIO" title="Ăn hạt đúng cách – không chỉ là ăn hạt ngon" className="mb-8" />
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((i) => (
              <div key={i.t} className="rounded-2xl bg-white p-5">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600"><i.icon className="h-5 w-5" /></span>
                <div className="font-semibold">{i.t}</div>
                <p className="mt-1 text-sm text-muted">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ConsultSection() {
  const user = useAuth((s) => s.user);
  // null = not edited yet → prefilled from the signed-in account
  const [draft, setForm] = useState<{ name: string | null; email: string | null; message: string }>({ name: null, email: null, message: '' });
  const form = { name: draft.name ?? user?.fullName ?? '', email: draft.email ?? user?.email ?? '', message: draft.message };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const send = useMutation({
    mutationFn: async () => (await api.post<{ message: string }>('/contact', { ...form, subject: 'Tư vấn dinh dưỡng' })).data,
    onSuccess: (r) => {
      toast.success(r.message);
      setForm((f) => ({ ...f, message: '' }));
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (form.message.trim().length < 10) e.message = 'Mô tả nhu cầu ít nhất 10 ký tự';
    setErrors(e);
    if (!Object.keys(e).length) send.mutate();
  };
  return (
    <section className="container-page mt-16">
      <div className="grid overflow-hidden rounded-3xl bg-forest-700 lg:grid-cols-[1.1fr_1fr]">
        <div className="p-7 text-white sm:p-12">
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-latte-300 uppercase">Tư vấn dinh dưỡng</div>
          <h2 className="text-3xl text-white sm:text-4xl">Không biết bắt đầu từ đâu? Để NUTRIO giúp bạn.</h2>
          <p className="mt-3 text-white/75">Ba công cụ miễn phí giúp bạn chọn đúng sản phẩm, đúng khẩu phần:</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { href: '/health', t: 'Tính BMI / TDEE', d: 'Nhu cầu calo & macro', icon: HeartPulse },
              { href: '/quiz', t: 'Quiz 5 câu', d: 'Gợi ý sản phẩm hợp bạn', icon: BadgeCheck },
              { href: '/meal-plan', t: 'Thực đơn 7 ngày', d: 'Tự động theo calo', icon: Clock },
            ].map((x) => (
              <Link key={x.href} href={x.href} className="group rounded-2xl bg-white/10 p-4 transition hover:bg-white/15">
                <x.icon className="mb-2 h-5 w-5 text-latte-300" />
                <div className="font-semibold">{x.t}</div>
                <div className="text-xs text-white/65">{x.d}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-white p-7 sm:p-10">
          <div className="mb-4 flex items-center gap-2 font-semibold"><MessageCircle className="h-5 w-5 text-forest-600" /> Gửi câu hỏi cho chuyên gia</div>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ tên" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} /></Field>
              <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} /></Field>
            </div>
            <Field label="Nhu cầu của bạn" error={errors.message}>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} placeholder="VD: Mình 28 tuổi, đang tập gym 4 buổi/tuần, muốn tăng cơ nhưng dị ứng sữa…" />
            </Field>
            <Button className="w-full" loading={send.isPending} onClick={submit}>Gửi yêu cầu tư vấn</Button>
            <p className="text-xs text-muted">Chuyên viên phản hồi trong 24 giờ. Thông tin chỉ mang tính tham khảo, không thay thế tư vấn y tế.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecipesRow({ recipes }: { recipes: Recipe[] }) {
  if (!recipes.length) return null;
  return (
    <section className="container-page mt-16">
      <SectionTitle eyebrow="Shop the recipe" title="Công thức Eat Clean mỗi ngày" description="Nấu nhanh, đủ chất – thêm toàn bộ nguyên liệu vào giỏ chỉ với một chạm." action={<Link href="/recipes" className="text-sm font-semibold text-forest-700 hover:underline">Tất cả công thức →</Link>} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.slice(0, 6).map((r) => <RecipeCard key={r.id} recipe={r} />)}
      </div>
    </section>
  );
}

export function RecipeCard({ recipe: r }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${r.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <SmartImage src={r.image} alt={r.title} fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex gap-1.5">{r.diets.slice(0, 2).map((d) => <Badge key={d.code} tone="green" className="bg-white/95">{d.name}</Badge>)}</div>
      </div>
      <div className="p-4">
        <h3 className="font-sans text-base leading-snug font-semibold group-hover:text-forest-700">{r.title}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-latte-500" /> {Math.round(r.caloriesPerServing)} kcal</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.prepMinutes} phút</span>
          <span>Đạm {r.proteinG}g · Carb {r.carbG}g · Béo {r.fatG}g</span>
        </div>
      </div>
    </Link>
  );
}

export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  return (
    <section className="mt-16 bg-sand-50 py-16">
      <div className="container-page">
        <SectionTitle eyebrow="Khách hàng nói gì" title="Đánh giá thật từ khách đã mua hàng" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <figure key={r.id} className="flex flex-col rounded-2xl bg-white p-6">
              <Quote className="mb-3 h-7 w-7 text-latte-300" />
              <Stars value={r.rating} />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink/85">“{r.content}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 font-bold text-forest-700">{r.author.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">{r.author}{r.isVerifiedPurchase && <BadgeCheck className="h-4 w-4 text-forest-600" aria-label="Đã mua hàng" />}</div>
                  <Link href={`/products/${r.product.slug}`} className="block truncate text-xs text-muted hover:text-forest-700">{r.product.name}</Link>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogRow({ posts }: { posts: PostCard[] }) {
  if (!posts.length) return null;
  return (
    <section className="container-page mt-16">
      <SectionTitle eyebrow="Kiến thức dinh dưỡng" title="Hiểu đúng để ăn đúng" action={<Link href="/blog" className="text-sm font-semibold text-forest-700 hover:underline">Đọc thêm →</Link>} />
      <div className="grid gap-5 md:grid-cols-3">
        {posts.map((p) => <PostCardView key={p.id} post={p} />)}
      </div>
    </section>
  );
}

export function PostCardView({ post: p }: { post: PostCard }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
        <SmartImage src={p.coverImage} alt={p.title} fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        {p.category && <span className="font-semibold text-latte-500 uppercase">{p.category.name}</span>} · {formatDate(p.publishedAt)} · {p.readMinutes} phút đọc
      </div>
      <h3 className="mt-1.5 font-sans text-lg leading-snug font-semibold group-hover:text-forest-700">{p.title}</h3>
      {p.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.summary}</p>}
    </Link>
  );
}

export function NewsletterBand() {
  return (
    <section className="container-page mt-16">
      <div className="flex flex-col items-center justify-between gap-5 rounded-3xl border border-sand-200 bg-sand-100 p-8 text-center sm:flex-row sm:text-left">
        <div>
          <h3 className="text-2xl">Thành viên NUTRIO được nhiều hơn</h3>
          <p className="mt-1 text-sm text-muted">Tích 1 điểm cho mỗi 1.000₫ · Bronze → Silver → Gold với ưu đãi giảm đến 5% và miễn phí giao hàng.</p>
        </div>
        <ButtonLink href="/register" variant="primary">Đăng ký thành viên</ButtonLink>
      </div>
    </section>
  );
}
