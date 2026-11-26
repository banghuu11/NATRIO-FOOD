'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, get } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart';
import { usePrefs } from '@/stores/prefs';
import type { ProductCard as PC } from '@/types';
import { ProductCard } from '@/components/shop/product-card';
import { ALLERGEN_NAMES } from '@/components/shop/allergy-sync';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { SectionTitle, SmartImage } from '@/components/ui/misc';

interface Q { id: number; question: string; isMultiple: boolean; options: { id: number; text: string; icon: string | null; exclusive: boolean }[] }
interface R {
  summary: { focus: string[]; excludedAllergens: string[]; maxPrice: number | null };
  products: (PC & { matchScore: number; reasons: string[] })[];
  combos: { id: number; name: string; description: string | null; image: string; price: number; retailPrice: number; items: string[] }[];
}

export default function QuizPage() {
  const qs = useQuery({ queryKey: ['quiz'], queryFn: () => get<Q[]>('/quiz') });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [result, setResult] = useState<R | null>(null);
  const { add } = useCartActions();
  const setAllergens = usePrefs((s) => s.setAllergens);
  const submit = useMutation({
    mutationFn: async () => (await api.post<R>('/quiz/submit', { answers: Object.entries(answers).map(([q, o]) => ({ questionId: Number(q), optionIds: o })) })).data,
    onSuccess: (r) => {
      setResult(r);
      if (r.summary.excludedAllergens.length) setAllergens([...new Set([...usePrefs.getState().allergens, ...r.summary.excludedAllergens])]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (qs.isLoading) return <Spinner className="py-32" />;
  if (qs.isError || !qs.data?.length) return <div className="container-page py-16"><ErrorState onRetry={() => qs.refetch()} /></div>;
  const list = qs.data;
  const q = list[step];
  const chosen = answers[q?.id] ?? [];
  const pickOption = (o: Q['options'][number]) => {
    if (!q.isMultiple) return setAnswers({ ...answers, [q.id]: [o.id] });
    if (o.exclusive) return setAnswers({ ...answers, [q.id]: chosen.includes(o.id) ? [] : [o.id] });
    const excl = q.options.filter((x) => x.exclusive).map((x) => x.id);
    const base = chosen.filter((x) => !excl.includes(x));
    setAnswers({ ...answers, [q.id]: base.includes(o.id) ? base.filter((x) => x !== o.id) : [...base, o.id] });
  };

  if (result)
    return (
      <div className="container-page py-8">
        <div className="rounded-3xl bg-forest-700 p-7 text-white sm:p-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-latte-300"><Sparkles className="h-4 w-4" /> Kết quả tư vấn</div>
          <h1 className="mt-2 text-3xl text-white sm:text-4xl">NUTRIO chọn riêng cho bạn {result.products.length} sản phẩm</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {result.summary.maxPrice && <span className="rounded-full bg-white/15 px-3 py-1">Ngân sách ≤ {formatPrice(result.summary.maxPrice)}/sp</span>}
            {result.summary.excludedAllergens.map((a) => <span key={a} className="rounded-full bg-red-500/30 px-3 py-1">Tránh {ALLERGEN_NAMES[a]?.toLowerCase()}</span>)}
          </div>
          <Button variant="outline" className="mt-6 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => { setResult(null); setAnswers({}); setStep(0); }}><RotateCcw className="h-4 w-4" /> Làm lại</Button>
        </div>
        {result.products.length ? (
          <section className="mt-10">
            <SectionTitle title="Sản phẩm phù hợp nhất" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {result.products.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} />
                  {p.reasons.length > 0 && <p className="mt-2 flex items-start gap-1 text-xs text-forest-700"><BadgeCheck className="h-3.5 w-3.5 shrink-0" /> Phù hợp: {p.reasons.join(', ')}</p>}
                </div>
              ))}
            </div>
          </section>
        ) : <EmptyState className="mt-10" title="Chưa có sản phẩm khớp tất cả tiêu chí" description="Hãy thử tăng ngân sách hoặc bỏ bớt thành phần cần tránh." />}
        {result.combos.length > 0 && (
          <section className="mt-12">
            <SectionTitle title="Combo gợi ý" description="Tiết kiệm hơn mua lẻ." />
            <div className="grid gap-4 md:grid-cols-3">
              {result.combos.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="relative aspect-[16/9]"><SmartImage src={c.image} alt={c.name} fill sizes="33vw" className="object-cover" /></div>
                  <div className="p-4">
                    <div className="font-semibold">{c.name}</div>
                    <ul className="mt-1 text-xs text-muted">{c.items.map((i) => <li key={i}>• {i}</li>)}</ul>
                    <div className="mt-3 flex items-center justify-between"><div><b className="text-forest-700">{formatPrice(c.price)}</b> <span className="text-xs text-muted line-through">{formatPrice(c.retailPrice)}</span></div><Button size="sm" onClick={() => add.mutate({ bundleId: c.id, quantity: 1, name: c.name })}>Thêm combo</Button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="text-center">
        <div className="text-xs font-bold tracking-[0.18em] text-latte-500 uppercase">Quiz tư vấn · {list.length} câu hỏi</div>
        <h1 className="mt-2 text-3xl sm:text-4xl">Tìm sản phẩm hợp với bạn</h1>
      </div>
      <div className="mt-8 flex gap-1.5">{list.map((_, i) => <div key={i} className={cn('h-1.5 flex-1 rounded-full transition', i <= step ? 'bg-forest-600' : 'bg-sand-200')} />)}</div>
      <div key={q.id} className="mt-6 animate-fade-up rounded-3xl border border-line bg-white p-6 sm:p-8">
        <div className="text-sm font-semibold text-muted">Câu {step + 1}/{list.length}</div>
        <h2 className="mt-1 font-sans text-2xl font-semibold">{q.question}</h2>
        {q.isMultiple && <p className="mt-1 text-sm text-muted">Có thể chọn nhiều đáp án</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {q.options.map((o) => {
            const on = chosen.includes(o.id);
            return (
              <button key={o.id} onClick={() => pickOption(o)} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-left font-medium transition', on ? 'border-forest-600 bg-forest-50' : 'border-line hover:border-forest-300')}>
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center border-2', q.isMultiple ? 'rounded-md' : 'rounded-full', on ? 'border-forest-600 bg-forest-600 text-white' : 'border-sand-300')}>{on && '✓'}</span>
                {o.text}
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
          {step < list.length - 1 ? (
            <Button disabled={!chosen.length} onClick={() => setStep(step + 1)}>Tiếp theo <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button disabled={!chosen.length} loading={submit.isPending} onClick={() => submit.mutate()}>Xem gợi ý <Sparkles className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}
