import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

/**
 * Available stock = on hand − reserved, counting only non-expired batches
 * in active warehouses (same rule as fn_allocate_stock_fefo).
 */
@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async availableByVariant(variantIds: (bigint | number)[], db: Db = this.prisma): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (!variantIds.length) return map;
    const ids = variantIds.map((v) => BigInt(v));
    const rows = await db.$queryRaw<{ variant_id: bigint; qty: number }[]>`
      SELECT b.variant_id, COALESCE(SUM(i.quantity_on_hand - i.quantity_reserved), 0)::int AS qty
      FROM product_batches b
      JOIN inventory i ON i.batch_id = b.id
      JOIN warehouses w ON w.id = i.warehouse_id AND w.is_active
      WHERE b.variant_id = ANY(${ids}::bigint[])
        AND (b.expires_on IS NULL OR b.expires_on >= current_date)
      GROUP BY b.variant_id`;
    for (const id of ids) map.set(Number(id), 0);
    for (const r of rows) map.set(Number(r.variant_id), Math.max(0, Number(r.qty)));
    return map;
  }

  /** Earliest expiry date among batches that still have stock. */
  async nearestExpiry(variantIds: bigint[]): Promise<Map<number, Date | null>> {
    const map = new Map<number, Date | null>();
    if (!variantIds.length) return map;
    const rows = await this.prisma.$queryRaw<{ variant_id: bigint; expires_on: Date | null }[]>`
      SELECT b.variant_id, MIN(b.expires_on) AS expires_on
      FROM product_batches b JOIN inventory i ON i.batch_id = b.id
      WHERE b.variant_id = ANY(${variantIds}::bigint[]) AND i.quantity_on_hand - i.quantity_reserved > 0
        AND (b.expires_on IS NULL OR b.expires_on >= current_date)
      GROUP BY b.variant_id`;
    for (const r of rows) map.set(Number(r.variant_id), r.expires_on);
    return map;
  }
}
