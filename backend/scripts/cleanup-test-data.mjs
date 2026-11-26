#!/usr/bin/env node
/**
 * Removes data created by manual / automated API testing – NEVER seed or customer data.
 *
 *   node scripts/cleanup-test-data.mjs          → dry run: only lists what would be removed
 *   node scripts/cleanup-test-data.mjs --apply  → removes it in ONE transaction (back up first: npm run db:backup)
 *
 * What counts as test data (all markers are written only by the test scripts):
 *   - orders whose idempotency_key starts with "e2e-" or "idem-key-", or whose guest e-mail is guest@test.vn
 *   - orders containing a product variant whose SKU starts with "TEST-"
 *   - products having a variant SKU starting with "TEST-"
 *   - guest carts whose session token starts with "guest-e2e-" or "guest-test-token"
 *
 * Side effects of those orders are reversed before deletion: reserved/shipped stock, flash-sale counters,
 * sold counts, loyalty points (balance, lifetime points, tier), reviews, coupon usage and notifications.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(backendDir, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
const APPLY = process.argv.includes('--apply');
const c = new pg.Client({ connectionString: process.env.DATABASE_URL.replace(/\?schema=.*$/, '') });

const q = async (sql, params = []) => (await c.query(sql, params)).rows;

await c.connect();
try {
  await c.query('BEGIN');
  const products = await q(`SELECT DISTINCT p.id, p.name FROM products p JOIN product_variants v ON v.product_id = p.id WHERE v.sku LIKE 'TEST-%'`);
  const productIds = products.map((p) => p.id);
  const orders = await q(
    `SELECT o.id, o.order_number, o.status, o.user_id FROM orders o
     WHERE o.idempotency_key LIKE 'e2e-%' OR o.idempotency_key LIKE 'idem-key-%' OR o.guest_email = 'guest@test.vn'
        OR EXISTS (SELECT 1 FROM order_items oi JOIN product_variants v ON v.id = oi.variant_id WHERE oi.order_id = o.id AND v.sku LIKE 'TEST-%')
     ORDER BY o.id`,
  );
  const ids = orders.map((o) => o.id);
  const carts = await q(`SELECT id, session_token FROM carts WHERE session_token LIKE 'guest-e2e-%' OR session_token LIKE 'guest-test-token%'`);
  const loyalty = ids.length ? await q(`SELECT user_id, txn_type, points FROM loyalty_transactions WHERE order_id = ANY($1)`, [ids]) : [];
  const reviews = ids.length ? await q(`SELECT r.id FROM reviews r JOIN order_items oi ON oi.id = r.order_item_id WHERE oi.order_id = ANY($1)`, [ids]) : [];

  console.log(`Đơn hàng kiểm thử (${orders.length}):`);
  orders.forEach((o) => console.log(`  - #${o.id} ${o.order_number} [${o.status}]`));
  console.log(`Sản phẩm kiểm thử (${products.length}): ${products.map((p) => `#${p.id} ${p.name}`).join(', ') || '—'}`);
  console.log(`Giỏ hàng khách kiểm thử: ${carts.length} · Giao dịch điểm: ${loyalty.length} · Đánh giá: ${reviews.length}`);

  if (!APPLY) {
    await c.query('ROLLBACK');
    console.log('\nChạy thử (dry run) – chưa thay đổi gì. Thêm --apply để thực hiện (nên chạy npm run db:backup trước).');
    process.exit(0);
  }

  if (ids.length) {
    // 1. Stock: give back what the orders still hold
    await c.query(
      `UPDATE inventory i SET quantity_reserved = i.quantity_reserved - a.q FROM (
         SELECT oa.inventory_id, SUM(oa.quantity) q FROM order_allocations oa JOIN order_items oi ON oi.id = oa.order_item_id
         WHERE oi.order_id = ANY($1) AND oa.state = 'reserved' GROUP BY oa.inventory_id) a WHERE i.id = a.inventory_id`,
      [ids],
    );
    await c.query(
      `UPDATE inventory i SET quantity_on_hand = i.quantity_on_hand + a.q FROM (
         SELECT oa.inventory_id, SUM(oa.quantity) q FROM order_allocations oa JOIN order_items oi ON oi.id = oa.order_item_id
         WHERE oi.order_id = ANY($1) AND oa.state = 'shipped' GROUP BY oa.inventory_id) a WHERE i.id = a.inventory_id`,
      [ids],
    );
    // 2. Flash-sale counters (lines sold at a flash-sale price)
    await c.query(
      `UPDATE flash_sale_items f SET sold_count = GREATEST(f.sold_count - x.q, 0) FROM (
         SELECT fsi.id, SUM(oi.quantity) q FROM order_items oi JOIN flash_sale_items fsi ON fsi.variant_id = oi.variant_id AND fsi.sale_price = oi.unit_price
         WHERE oi.order_id = ANY($1) GROUP BY fsi.id) x WHERE f.id = x.id`,
      [ids],
    );
    // 3. Sold counts of delivered/completed orders (returned ones were already reversed)
    await c.query(
      `UPDATE products p SET sold_count = GREATEST(p.sold_count - x.q, 0) FROM (
         SELECT oi.product_id, SUM(oi.quantity) q FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.id = ANY($1) AND o.status IN ('delivered','completed') AND oi.product_id IS NOT NULL GROUP BY oi.product_id) x WHERE p.id = x.product_id`,
      [ids],
    );
    // 4. Loyalty: undo the point movements, then recompute the tier
    await c.query(
      `UPDATE loyalty_accounts la SET
         points_balance  = GREATEST(la.points_balance - x.total, 0),
         lifetime_points = GREATEST(la.lifetime_points - x.lifetime, 0),
         updated_at = now()
       FROM (SELECT user_id, SUM(points) total,
                    SUM(CASE WHEN txn_type = 'earn' THEN GREATEST(points,0) WHEN txn_type = 'adjust' THEN points ELSE 0 END) lifetime
             FROM loyalty_transactions WHERE order_id = ANY($1) GROUP BY user_id) x
       WHERE la.user_id = x.user_id`,
      [ids],
    );
    await c.query(`DELETE FROM loyalty_transactions WHERE order_id = ANY($1)`, [ids]);
    await c.query(
      `UPDATE loyalty_accounts la SET tier_id = (SELECT t.id FROM membership_tiers t WHERE t.min_points <= la.lifetime_points ORDER BY t.min_points DESC LIMIT 1)
       WHERE la.user_id IN (SELECT DISTINCT user_id FROM orders WHERE id = ANY($1) AND user_id IS NOT NULL)`,
      [ids],
    );
    // 5. Dependent rows without ON DELETE CASCADE
    await c.query(`DELETE FROM reviews WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ANY($1))`, [ids]);
    await c.query(`DELETE FROM coupon_usages WHERE order_id = ANY($1)`, [ids]);
    await c.query(`DELETE FROM notifications WHERE data->>'orderId' = ANY($1::text[])`, [ids.map(String)]);
    await c.query(`DELETE FROM stock_movements WHERE reference_type = 'order' AND reference_id = ANY($1)`, [ids]);
    // 6. The orders (items, allocations, payments, status history and shipments cascade)
    await c.query(`DELETE FROM orders WHERE id = ANY($1)`, [ids]);
  }

  if (productIds.length) {
    const batches = `SELECT b.id FROM product_batches b JOIN product_variants v ON v.id = b.variant_id WHERE v.product_id = ANY($1)`;
    await c.query(`DELETE FROM stock_movements WHERE batch_id IN (${batches})`, [productIds]);
    await c.query(`DELETE FROM inventory WHERE batch_id IN (${batches})`, [productIds]);
    await c.query(`DELETE FROM product_batches WHERE id IN (${batches})`, [productIds]);
    await c.query(`DELETE FROM products WHERE id = ANY($1)`, [productIds]);
  }
  if (carts.length) await c.query(`DELETE FROM carts WHERE id = ANY($1)`, [carts.map((x) => x.id)]);

  await c.query('COMMIT');
  console.log('\n✅ Đã dọn dữ liệu kiểm thử.');
} catch (e) {
  await c.query('ROLLBACK').catch(() => undefined);
  console.error('❌ Lỗi, đã hoàn tác toàn bộ:', e.message);
  process.exitCode = 1;
} finally {
  await c.end();
}
