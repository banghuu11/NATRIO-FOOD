'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { usePrefs } from '@/stores/prefs';

interface Totals {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  sugarG?: number;
  fiberG?: number;
}

/** Meter: value against a daily reference, same-hue track. Text stays in ink, never the bar colour. */
function Meter({ label, value, unit, target }: { label: string; value: number; unit: string; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const days = target > 0 ? value / target : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-ink/80">{label}</span>
        <span className="text-ink">
          <b className="text-sm">{formatNumber(value, 0)}</b> {unit}
          <span className="ml-1 text-muted">· {formatNumber(days, 1)} ngày</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-forest-100" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={Math.round(target)} aria-label={label}>
        <div className="h-full rounded-full bg-forest-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Live nutrition totals of the cart. "ngày" = how many days of the daily target the cart covers
 * (target from the health profile, or 2.000 kcal reference).
 */
export function NutritionWidget({ totals, compact = false }: { totals: Totals; compact?: boolean }) {
  const target = usePrefs((s) => s.calorieTarget) || 2000;
  const ref = { protein: (target * 0.2) / 4, carb: (target * 0.5) / 4, fat: (target * 0.3) / 9 };
  return (
    <div className="rounded-2xl border border-forest-100 bg-forest-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-forest-800">
          <Flame className="h-4 w-4 text-latte-500" /> Dinh dưỡng trong giỏ
        </div>
        <span className="text-[11px] text-muted">so với {formatNumber(target)} kcal/ngày</span>
      </div>
      <div className="mb-3 flex items-end gap-1.5">
        <span className="font-display text-3xl font-bold text-ink">{formatNumber(totals.kcal)}</span>
        <span className="pb-1 text-sm text-muted">kcal tổng</span>
      </div>
      <div className="space-y-2.5">
        <Meter label="Năng lượng" value={totals.kcal} unit="kcal" target={target} />
        <Meter label="Protein" value={totals.proteinG} unit="g" target={ref.protein} />
        <Meter label="Carb" value={totals.carbG} unit="g" target={ref.carb} />
        <Meter label="Chất béo" value={totals.fatG} unit="g" target={ref.fat} />
      </div>
      {!compact && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Tính theo khối lượng tịnh của sản phẩm. <Link href="/health" className="font-medium text-forest-700 underline">Tính TDEE của bạn</Link> để có mục tiêu chính xác.
        </p>
      )}
    </div>
  );
}
