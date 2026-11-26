'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber, formatPrice } from '@/lib/utils';

const SERIES = '#3d7a4b'; // forest-500, single series
const GRID = '#ece6da';
const AXIS = '#66705f';

const short = (v: number) => (v >= 1e9 ? `${formatNumber(v / 1e9, 1)} tỷ` : v >= 1e6 ? `${formatNumber(v / 1e6, 1)} tr` : v >= 1e3 ? `${formatNumber(v / 1e3)}k` : formatNumber(v));

/** Single-series area chart over time with crosshair tooltip. Title of the card names the series. */
export function TimeSeries({ data, dataKey, money = false, height = 280 }: { data: { label: string; [k: string]: number | string }[]; dataKey: string; money?: boolean; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Biểu đồ theo thời gian">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={18} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={54} tickFormatter={(v) => (money ? short(v) : formatNumber(v))} />
          <Tooltip
            cursor={{ stroke: AXIS, strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e8e1d4', fontSize: 12 }}
            formatter={(v) => [money ? formatPrice(Number(v)) : formatNumber(Number(v)), money ? 'Doanh thu' : 'Số đơn']}
          />
          <Area type="monotone" dataKey={dataKey} stroke={SERIES} strokeWidth={2} fill={`url(#fill-${dataKey})`} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars, one hue, values printed as text (ink, not series colour). */
export function RankedBars({ items, money = false }: { items: { label: string; value: number; sub?: string }[]; money?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">Chưa có dữ liệu</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label} title={`${i.label}: ${money ? formatPrice(i.value) : formatNumber(i.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink/85">{i.label}</span>
            <span className="shrink-0 font-semibold text-ink">{money ? formatPrice(i.value) : formatNumber(i.value)}{i.sub && <span className="ml-1 text-xs font-normal text-muted">{i.sub}</span>}</span>
          </div>
          <div className="h-2.5 rounded-full bg-forest-50"><div className="h-full rounded-r-[4px] rounded-l-full bg-forest-500 transition-all" style={{ width: `${(i.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
