import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = join(process.cwd(), 'data', 'noticeboard.sqlite');

function ensureDatabase() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  return db;
}

const globalForDb = globalThis as typeof globalThis & {
  __noticeboardDb?: DatabaseSync;
};

export const db = globalForDb.__noticeboardDb ?? ensureDatabase();

if (!globalForDb.__noticeboardDb) {
  globalForDb.__noticeboardDb = db;
}

export function getStoreValue<T>(key: string): T | null {
  const row = db
    .prepare('SELECT value FROM app_store WHERE key = ?')
    .get(key) as { value: string } | undefined;

  if (!row) {
    return null;
  }

  return JSON.parse(row.value) as T;
}

export function setStoreValue<T>(key: string, value: T) {
  db.prepare(`
    INSERT INTO app_store (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), new Date().toISOString());
}
