#!/usr/bin/env node
/**
 * Re-opens expired demo flash sales so the "Flash Sale" section can be shown in a demo.
 * Nothing is deleted: each expired, still-active flash sale gets a new window that starts now
 * and lasts as long as the original one.
 *
 *   node scripts/refresh-demo-dates.mjs          → dry run (lists what would change)
 *   node scripts/refresh-demo-dates.mjs --apply  → applies the change
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
await c.connect();
try {
  const { rows } = await c.query(
    `SELECT id, name, starts_at, ends_at FROM flash_sales WHERE is_active AND ends_at < now() ORDER BY id`,
  );
  if (!rows.length) console.log('Không có flash sale nào hết hạn.');
  for (const f of rows) console.log(`  - #${f.id} ${f.name}: ${f.starts_at.toISOString()} → ${f.ends_at.toISOString()}`);
  if (rows.length && APPLY) {
    await c.query(
      `UPDATE flash_sales SET starts_at = now() - interval '1 hour', ends_at = now() - interval '1 hour' + (ends_at - starts_at)
       WHERE id = ANY($1)`,
      [rows.map((r) => r.id)],
    );
    console.log(`✅ Đã mở lại ${rows.length} flash sale (thời lượng giữ nguyên, bắt đầu từ bây giờ).`);
  } else if (rows.length) {
    console.log('\nChạy thử (dry run) – chưa thay đổi gì. Thêm --apply để thực hiện.');
  }
} finally {
  await c.end();
}
