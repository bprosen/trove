import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { MIGRATIONS, migrate, openDb, schemaVersion, type Migration } from "./db.server";

const tables = (db: DatabaseSync) =>
  (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {
    name: string;
  }[]).map((r) => r.name);

describe("migrations", () => {
  it("creates the full schema on a new database", () => {
    const db = openDb(":memory:");
    expect(schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(tables(db)).toEqual([
      "book_genres",
      "books",
      "collection_books",
      "collections",
      "genres",
      "reading_sessions",
      "reviews",
      "settings",
    ]);
  });

  it("is a no-op when already up to date", () => {
    const db = openDb(":memory:");
    db.exec("INSERT INTO books (title) VALUES ('Example')");
    migrate(db);
    expect(schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(db.prepare("SELECT COUNT(*) AS n FROM books").get()).toEqual({ n: 1 });
  });

  it("adopts a pre-versioning database (user_version 0) without losing data", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL DEFAULT '')");
    db.exec("INSERT INTO books (title) VALUES ('Example 1')");
    expect(schemaVersion(db)).toBe(0);
    migrate(db);
    expect(schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(db.prepare("SELECT title FROM books").all()).toEqual([{ title: "Example 1" }]);
  });

  it("applies only pending migrations, in order", () => {
    const db = new DatabaseSync(":memory:");
    const extra: Migration[] = [
      ...MIGRATIONS,
      { name: "add books.subtitle", up: (d) => d.exec("ALTER TABLE books ADD COLUMN subtitle TEXT") },
    ];
    migrate(db, MIGRATIONS);
    migrate(db, extra);
    expect(schemaVersion(db)).toBe(extra.length);
    const cols = (db.prepare("PRAGMA table_info(books)").all() as { name: string }[]).map((c) => c.name);
    expect(cols).toContain("subtitle");
  });

  it("rolls back a failing migration and leaves the version unchanged", () => {
    const db = new DatabaseSync(":memory:");
    migrate(db, MIGRATIONS);
    const broken: Migration[] = [
      ...MIGRATIONS,
      {
        name: "half-finished change",
        up: (d) => {
          d.exec("CREATE TABLE temp_table (id INTEGER)");
          d.exec("THIS IS NOT SQL");
        },
      },
    ];
    expect(() => migrate(db, broken)).toThrow(/Migration 2 \("half-finished change"\) failed/);
    expect(schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(tables(db)).not.toContain("temp_table");
  });

  it("refuses to open a database from a newer app version", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(`PRAGMA user_version = ${MIGRATIONS.length + 1}`);
    expect(() => migrate(db)).toThrow(/newer version/);
  });
});
