import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { BookFormat, BookStatus } from "./types";

// ---------- migrations ----------

/**
 * One schema change. Migrations run in order, each inside its own transaction, and the number
 * already applied is stored in SQLite's `PRAGMA user_version`.
 *
 * To change the schema, APPEND a new migration — never edit or reorder ones that have shipped,
 * because existing databases have already run them.
 */
export type Migration = { name: string; up: (db: DatabaseSync) => void };

export const MIGRATIONS: Migration[] = [
  {
    // Uses IF NOT EXISTS so databases created before versioning existed (user_version 0) adopt it in place.
    name: "initial schema",
    up: (db) =>
      db.exec(`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL DEFAULT '',
          isbn TEXT,
          cover_url TEXT,
          description TEXT,
          page_count INTEGER,
          published_year INTEGER,
          format TEXT NOT NULL DEFAULT 'physical',
          status TEXT NOT NULL DEFAULT 'want',
          rating INTEGER,
          favorite INTEGER NOT NULL DEFAULT 0,
          current_page INTEGER NOT NULL DEFAULT 0,
          started_at TEXT,
          finished_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS genres (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS book_genres (
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
          PRIMARY KEY (book_id, genre_id)
        );

        CREATE TABLE IF NOT EXISTS collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS collection_books (
          collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          added_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (collection_id, book_id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
          headline TEXT,
          body TEXT NOT NULL,
          contains_spoilers INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS reading_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          start_page INTEGER,
          end_page INTEGER,
          pages INTEGER NOT NULL DEFAULT 0,
          minutes INTEGER NOT NULL DEFAULT 0,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_date ON reading_sessions(date);
        CREATE INDEX IF NOT EXISTS idx_sessions_book ON reading_sessions(book_id);

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `),
  },
  {
    name: "achievement unlocks",
    up: (db) =>
      db.exec(`
        CREATE TABLE achievement_unlocks (
          id TEXT PRIMARY KEY,
          unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
          seen INTEGER NOT NULL DEFAULT 0
        );
      `),
  },
];

export function schemaVersion(db: DatabaseSync): number {
  return (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
}

/** Bring `db` up to the latest schema. Safe to call on every startup. */
export function migrate(db: DatabaseSync, migrations: Migration[] = MIGRATIONS): void {
  const current = schemaVersion(db);
  if (current > migrations.length) {
    throw new Error(
      `Database schema is version ${current}, but this app only knows ${migrations.length} migration(s). ` +
        "It was probably opened by a newer version of Trove.",
    );
  }
  for (let v = current; v < migrations.length; v++) {
    const m = migrations[v];
    db.exec("BEGIN");
    try {
      m.up(db);
      // PRAGMA can't take bound parameters; `v` is a loop counter, not user input.
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${v + 1} ("${m.name}") failed`, { cause: err });
    }
  }
}

// ---------- connection ----------

const DB_PATH = process.env.TROVE_DB_PATH ?? path.join(process.cwd(), "data", "trove.db");

declare global {
  var __troveDb: DatabaseSync | undefined;
}

/** Open a connection with Trove's pragmas and run pending migrations. */
export function openDb(file: string = DB_PATH): DatabaseSync {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  // Connection-level settings: these can't run inside a migration's transaction.
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

/** Shared connection; cached on globalThis so dev HMR doesn't open a new handle each reload. */
export function getDb(): DatabaseSync {
  globalThis.__troveDb ??= openDb();
  return globalThis.__troveDb;
}

/** Run `fn` inside a transaction, rolling back on error. */
export function tx<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

// ---------- typed query helpers ----------

const statements = new WeakMap<DatabaseSync, Map<string, StatementSync>>();
// A few queries build SQL dynamically (filters, IN-lists), so keep the cache bounded.
const MAX_CACHED_STATEMENTS = 200;

/** Prepared statements are cached per connection and SQL string. */
function statement(sql: string): StatementSync {
  const db = getDb();
  let cache = statements.get(db);
  if (!cache) {
    cache = new Map();
    statements.set(db, cache);
  }
  let stmt = cache.get(sql);
  if (!stmt) {
    if (cache.size >= MAX_CACHED_STATEMENTS) cache.clear();
    stmt = db.prepare(sql);
    cache.set(sql, stmt);
  }
  return stmt;
}

/**
 * All rows of a query, typed as `T`. `T` must describe the selected columns — use the row types
 * below for `SELECT *`, or an inline type for custom column lists and aggregates.
 */
export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return statement(sql).all(...params) as T[];
}

/** First row of a query, or `undefined` if there is none. */
export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return statement(sql).get(...params) as T | undefined;
}

/** Execute a write. Returns `{ changes, lastInsertRowid }`. */
export function run(sql: string, ...params: SQLInputValue[]) {
  return statement(sql).run(...params);
}

// ---------- row types (one per table, matching the schema above) ----------

/** SQLite has no boolean type; flags are stored as 0/1. */
export type Flag = 0 | 1;

export type BookRow = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  description: string | null;
  page_count: number | null;
  published_year: number | null;
  format: BookFormat;
  status: BookStatus;
  rating: number | null;
  favorite: Flag;
  current_page: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GenreRow = { id: number; name: string; created_at: string };

export type BookGenreRow = { book_id: number; genre_id: number };

export type CollectionRow = { id: number; name: string; description: string | null; created_at: string };

export type CollectionBookRow = { collection_id: number; book_id: number; added_at: string };

export type ReviewRow = {
  id: number;
  book_id: number;
  headline: string | null;
  body: string;
  contains_spoilers: Flag;
  created_at: string;
  updated_at: string;
};

export type ReadingSessionRow = {
  id: number;
  book_id: number;
  date: string;
  start_page: number | null;
  end_page: number | null;
  pages: number;
  minutes: number;
  note: string | null;
  created_at: string;
};

export type SettingRow = { key: string; value: string };

/** `seen` flips to 1 once the client has played the unlock celebration. */
export type AchievementUnlockRow = { id: string; unlocked_at: string; seen: Flag };

/** Single-number aggregate, e.g. `SELECT COUNT(*) AS n ...`. */
export type CountRow = { n: number };
