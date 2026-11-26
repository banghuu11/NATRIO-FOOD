import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const vnd = new Intl.NumberFormat('vi-VN');
/** 189000 → "189.000₫" */
export function formatPrice(amount: number | null | undefined) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return `${vnd.format(Math.round(amount))}₫`;
}

export function formatNumber(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(n);
}

export function formatDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('vi-VN', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date);
}

export function formatWeight(g: number) {
  return g >= 1000 ? `${formatNumber(g / 1000, 2)} kg` : `${formatNumber(g)} g`;
}

export function timeAgo(d: string | Date) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} ngày trước`;
  return formatDate(d);
}

/** Accent-insensitive normaliser for client-side matching. */
export function normalizeVi(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
}

export function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Absolute URLs (uploads served by the API) skip Next image optimisation. */
export const isRemote = (src?: string | null) => !!src && /^https?:\/\//.test(src);
