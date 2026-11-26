import { Prisma } from '@prisma/client';

const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/**
 * Deep-converts a Prisma result into API-friendly JSON:
 * snake_case → camelCase keys, BigInt/Decimal → number.
 */
export function serialize<T = any>(value: unknown): T {
  if (value === null || value === undefined) return value as T;
  if (typeof value === 'bigint') return Number(value) as T;
  if (value instanceof Prisma.Decimal) return value.toNumber() as T;
  if (value instanceof Date) return value as T;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'password_hash' || k === 'search_vector' || k === 'token_hash') continue;
      out[toCamel(k)] = serialize(v);
    }
    return out as T;
  }
  return value as T;
}

export const num = (v: Prisma.Decimal | number | bigint | null | undefined): number | null =>
  v === null || v === undefined ? null : Number(v);

export const round1 = (v: number) => Math.round(v * 10) / 10;

export function paginate(page = 1, limit = 20) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export const pageMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Vietnamese-aware slug: "Hạt Điều Rang Muối" → "hat-dieu-rang-muoi" */
export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
