import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = process.env.TROVE_DB_PATH ?? path.join(process.cwd(), "data", "trove.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

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
`;

declare global {
  var __troveDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  if (DB_PATH !== ":memory:") mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  return db;
}

/** Shared connection; cached on globalThis so dev HMR doesn't open a new handle each reload. */
export function getDb(): DatabaseSync {
  globalThis.__troveDb ??= open();
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
