import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Ensure tables exist (no drizzle-kit required at runtime)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Globe',
    color TEXT NOT NULL DEFAULT '#3b82f6',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    background_image TEXT NOT NULL DEFAULT '',
    bg_opacity REAL NOT NULL DEFAULT 1
  );
`);

// Idempotent column migration (ignored if column already exists)
try {
  sqlite.exec(`ALTER TABLE services ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;`);
} catch {
  // Column already exists
}
try {
  sqlite.exec(`ALTER TABLE services ADD COLUMN glass_effect INTEGER NOT NULL DEFAULT 1;`);
} catch {
  // Column already exists
}
try {
  sqlite.exec(`ALTER TABLE settings ADD COLUMN open_in_new_tab INTEGER NOT NULL DEFAULT 0;`);
} catch {
  // Column already exists
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>>;
};

export const db =
  globalForDb.db ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
