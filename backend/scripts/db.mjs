#!/usr/bin/env node
/**
 * Local PostgreSQL helper for NUTRIO (uses the `embedded-postgres` package).
 *
 *   node scripts/db.mjs start   – start the local server and keep it running (Ctrl+C to stop)
 *   node scripts/db.mjs setup   – create the database and run SQL files (only if it does not exist yet)
 *   node scripts/db.mjs migrate – run pending upgrade SQL files on an existing database
 *   node scripts/db.mjs stop    – clean shutdown with pg_ctl (use before backup)
 *   node scripts/db.mjs backup  – cold copy of backend/.pgdata into backend/backups (server must be stopped)
 *   node scripts/db.mjs restore <name> – restore a backup (current data is moved aside, never deleted)
 *   node scripts/db.mjs reset --yes – DROP the database and recreate it (destroys local data!)
 *
 * Connection details are read from DATABASE_URL in backend/.env.
 */
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');
const sqlDir = path.resolve(backendDir, '..', 'database', 'init');
const dataDir = path.join(backendDir, '.pgdata');

// ---- read .env (create it from .env.example if missing – never overwrite) ----
const envPath = path.join(backendDir, '.env');
if (!fs.existsSync(envPath)) {
  fs.copyFileSync(path.join(backendDir, '.env.example'), envPath);
  console.log('ℹ️  Created backend/.env from .env.example');
}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const url = new URL(process.env.DATABASE_URL);
const cfg = {
  user: decodeURIComponent(url.username || 'postgres'),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5433),
  database: url.pathname.replace(/^\//, '') || 'nutrio_db',
};

const server = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: cfg.user,
  password: cfg.password,
  port: cfg.port,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: (e) => {
    const msg = String(e);
    if (!/LOG:|NOTICE:/.test(msg)) console.error(msg.trim());
  },
});

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1' });
    s.once('connect', () => (s.end(), resolve(true)));
    s.once('error', () => resolve(false));
  });

/** Starts the server unless it is already running. Returns true if we started it. */
async function ensureStarted() {
  if (await isPortOpen(cfg.port)) return false;
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('⏳ Initialising local PostgreSQL cluster in backend/.pgdata ...');
    await server.initialise();
  }
  await server.start();
  return true;
}

const client = (database) =>
  new pg.Client({ host: 'localhost', port: cfg.port, user: cfg.user, password: cfg.password, database });

async function databaseExists() {
  const c = client('postgres');
  await c.connect();
  const r = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [cfg.database]);
  await c.end();
  return r.rowCount > 0;
}

async function runSqlFile(c, file) {
  const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
  process.stdout.write(`   ▸ ${file} ... `);
  await c.query(sql);
  console.log('ok');
}

/** Upgrade files: 03_*.sql and later. Tracked in table _sql_migrations. */
async function runMigrations(c) {
  await c.query('CREATE TABLE IF NOT EXISTS _sql_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
  const done = new Set((await c.query('SELECT name FROM _sql_migrations')).rows.map((r) => r.name));
  const files = fs.readdirSync(sqlDir).filter((f) => /^\d+_.*\.sql$/.test(f) && Number(f.split('_')[0]) >= 3).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    await c.query('BEGIN');
    try {
      await runSqlFile(c, f);
      await c.query('INSERT INTO _sql_migrations(name) VALUES ($1)', [f]);
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
  }
}

async function setup({ force = false } = {}) {
  const startedHere = await ensureStarted();
  try {
    if (await databaseExists()) {
      if (!force) {
        console.log(`✅ Database "${cfg.database}" already exists – running pending migrations only.`);
        const c = client(cfg.database);
        await c.connect();
        await runMigrations(c);
        await c.end();
        return;
      }
    }
    console.log(`⏳ Creating database "${cfg.database}" ...`);
    const admin = client('postgres');
    await admin.connect();
    await admin.query(`CREATE DATABASE "${cfg.database}" ENCODING 'UTF8' TEMPLATE template0`);
    await admin.end();

    const c = client(cfg.database);
    await c.connect();
    await runSqlFile(c, '01_schema.sql');
    await runSqlFile(c, '02_seed.sql');
    await runMigrations(c);
    await c.end();
    console.log('✅ Schema + base seed loaded. Next: `npm run db:seed` to load the NUTRIO demo catalog.');
  } finally {
    if (startedHere) await server.stop();
  }
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'start') {
    const started = await ensureStarted();
    if (!started) {
      console.log(`ℹ️  PostgreSQL is already listening on port ${cfg.port}.`);
      return;
    }
    console.log(`🐘 PostgreSQL running on localhost:${cfg.port} (data: backend/.pgdata). Press Ctrl+C to stop.`);
    const stop = async () => {
      console.log('\n⏹  Stopping PostgreSQL ...');
      await server.stop();
      process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    setInterval(() => {}, 1 << 30);
  } else if (cmd === 'stop') {
    // Clean shutdown with pg_ctl (also works when the "db:start" window was closed and left the server running)
    if (!(await isPortOpen(cfg.port))) {
      console.log(`ℹ️  PostgreSQL is not running on port ${cfg.port}.`);
      return;
    }
    const { spawnSync } = await import('node:child_process');
    const win = process.platform === 'win32';
    const pkg = `${win ? 'windows' : process.platform}-${process.arch}`;
    const bin = path.join(backendDir, 'node_modules', '@embedded-postgres', pkg, 'native', 'bin', win ? 'pg_ctl.exe' : 'pg_ctl');
    const r = spawnSync(bin, ['stop', '-D', dataDir, '-m', 'fast'], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('❌ pg_ctl could not stop the server. If a stale process still holds the port, end the postgres.exe process whose path is inside backend/node_modules/@embedded-postgres.');
      process.exit(1);
    }
    console.log('✅ PostgreSQL stopped cleanly.');
  } else if (cmd === 'backup' || cmd === 'restore' || cmd === 'backups') {
    // Cold (file-level) backup of backend/.pgdata. The embedded PostgreSQL 18 has no pg_dump,
    // so the server must be stopped to get a consistent copy.
    const backupDir = path.join(backendDir, 'backups');
    if (cmd === 'backups') {
      const list = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).filter((d) => d.startsWith('pgdata-')).sort() : [];
      console.log(list.length ? list.map((d) => `  ${d}`).join('\n') : 'Chưa có bản sao lưu nào.');
      return;
    }
    if (await isPortOpen(cfg.port)) {
      console.error(`PostgreSQL đang chạy trên cổng ${cfg.port}. Hãy dừng backend rồi chạy "npm run db:stop" (hoặc Ctrl+C ở cửa sổ "npm run db:start") rồi chạy lại lệnh.`);
      process.exit(1);
    }
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    if (cmd === 'backup') {
      if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) throw new Error('Không tìm thấy dữ liệu trong backend/.pgdata');
      const target = path.join(backupDir, `pgdata-${stamp}`);
      fs.mkdirSync(backupDir, { recursive: true });
      fs.cpSync(dataDir, target, { recursive: true, filter: (src) => !/postmaster\.pid$/.test(src) });
      console.log(`✅ Đã sao lưu vào backend/backups/pgdata-${stamp}`);
    } else {
      const name = process.argv[3];
      const source = name && path.join(backupDir, path.basename(name));
      if (!source || !fs.existsSync(path.join(source, 'PG_VERSION'))) {
        console.error('Dùng: node scripts/db.mjs restore <tên-thư-mục-backup>  (xem danh sách: npm run db:backups)');
        process.exit(1);
      }
      // Never delete the current data: keep it next to the new copy
      if (fs.existsSync(dataDir)) fs.renameSync(dataDir, `${dataDir}.before-restore-${stamp}`);
      fs.cpSync(source, dataDir, { recursive: true });
      console.log(`✅ Đã khôi phục từ ${path.basename(source)}. Dữ liệu cũ được giữ tại backend/.pgdata.before-restore-${stamp}`);
    }
  } else if (cmd === 'run') {
    // Runs a command while the database is up, e.g. `node scripts/db.mjs run npm run db:seed`
    const startedHere = await ensureStarted();
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.argv.slice(3).join(' '), { stdio: 'inherit', shell: true, cwd: backendDir });
    if (startedHere) await server.stop();
    process.exit(r.status ?? 1);
  } else if (cmd === 'setup') {
    await setup();
  } else if (cmd === 'migrate') {
    const startedHere = await ensureStarted();
    const c = client(cfg.database);
    await c.connect();
    await runMigrations(c);
    await c.end();
    if (startedHere) await server.stop();
    console.log('✅ Migrations up to date.');
  } else if (cmd === 'reset') {
    if (!process.argv.includes('--yes')) {
      console.error('This deletes ALL local NUTRIO data. Re-run with --yes to confirm.');
      process.exit(1);
    }
    const startedHere = await ensureStarted();
    const admin = client('postgres');
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS "${cfg.database}" WITH (FORCE)`);
    await admin.end();
    if (startedHere) await server.stop();
    await setup({ force: true });
  } else {
    console.log('Usage: node scripts/db.mjs <start|stop|setup|migrate|backup|backups|restore <name>|run <cmd>|reset --yes>');
  }
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
