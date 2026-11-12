"use server";

import { revalidatePath } from "next/cache";
import type { DatabaseSync } from "node:sqlite";
import { tx } from "./db";
import { syncAchievements } from "./stats";
import { today } from "./dates";
import { BOOK_FORMATS, BOOK_STATUSES, type ActionResult, type BookFormat, type BookStatus } from "./types";
import { SAMPLE_BOOKS, SAMPLE_COLLECTIONS } from "./sample-data";

class UserError extends Error {}

/** Wrap a mutation: transaction → achievement sync → revalidate → uniform result. */
async function mutate<T>(fn: (db: DatabaseSync) => T): Promise<ActionResult<T>> {
  try {
    const data = tx(fn);
    const unlocked = syncAchievements();
    revalidatePath("/", "layout");
    return { ok: true, data, unlocked };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// ---------- validation helpers ----------

function str(v: unknown, field: string, { required = false, max = 2000 } = {}): string | null {
  if (v == null || v === "") {
    if (required) throw new UserError(`${field} is required`);
    return null;
  }
  if (typeof v !== "string") throw new UserError(`${field} must be text`);
  const s = v.trim();
  if (required && !s) throw new UserError(`${field} is required`);
  if (s.length > max) throw new UserError(`${field} is too long`);
  return s || null;
}

function int(v: unknown, field: string, { min = 0, max = 1_000_000 } = {}): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new UserError(`${field} must be a whole number`);
  if (n < min || n > max) throw new UserError(`${field} must be between ${min} and ${max}`);
  return n;
}

function isoDate(v: unknown, field: string): string | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new UserError(`${field} must be a date`);
  return v;
}

function id(v: unknown): number {
  const n = int(v, "id", { min: 1, max: Number.MAX_SAFE_INTEGER });
  if (n == null) throw new UserError("Missing id");
  return n;
}

function status(v: unknown): BookStatus {
  if (!BOOK_STATUSES.includes(v as BookStatus)) throw new UserError("Invalid status");
  return v as BookStatus;
}

function assertBook(db: DatabaseSync, bookId: number) {
  const row = db.prepare("SELECT id, status, page_count, current_page, started_at FROM books WHERE id = ?").get(bookId) as
    | { id: number; status: BookStatus; page_count: number | null; current_page: number; started_at: string | null }
    | undefined;
  if (!row) throw new UserError("Book not found");
  return row;
}

function setGenres(db: DatabaseSync, bookId: number, names: string[]) {
  db.prepare("DELETE FROM book_genres WHERE book_id = ?").run(bookId);
  const insertGenre = db.prepare("INSERT INTO genres (name) VALUES (?) ON CONFLICT(name) DO NOTHING");
  const findGenre = db.prepare("SELECT id FROM genres WHERE name = ? COLLATE NOCASE");
  const link = db.prepare("INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)");
  for (const raw of names) {
    const name = raw.trim().slice(0, 60);
    if (!name) continue;
    insertGenre.run(name);
    const g = findGenre.get(name) as { id: number };
    link.run(bookId, g.id);
  }
}

/** Apply the side effects of a status change (dates, progress). */
function applyStatus(db: DatabaseSync, bookId: number, next: BookStatus, on = today()) {
  const b = assertBook(db, bookId);
  if (next === "reading") {
    db.prepare("UPDATE books SET status = 'reading', started_at = COALESCE(started_at, ?), finished_at = NULL, updated_at = datetime('now') WHERE id = ?").run(on, bookId);
  } else if (next === "finished") {
    db.prepare(
      "UPDATE books SET status = 'finished', started_at = COALESCE(started_at, ?), finished_at = ?, current_page = COALESCE(page_count, current_page), updated_at = datetime('now') WHERE id = ?",
    ).run(b.started_at ?? on, on, bookId);
  } else if (next === "want") {
    db.prepare("UPDATE books SET status = 'want', started_at = NULL, finished_at = NULL, current_page = 0, updated_at = datetime('now') WHERE id = ?").run(bookId);
  } else {
    db.prepare("UPDATE books SET status = 'dnf', finished_at = NULL, updated_at = datetime('now') WHERE id = ?").run(bookId);
  }
}

// ---------- books ----------

export type BookInput = {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  page_count?: number | string | null;
  published_year?: number | string | null;
  format?: BookFormat;
  status?: BookStatus;
  genres?: string[];
};

function parseBook(input: BookInput) {
  const format = input.format ?? "physical";
  if (!BOOK_FORMATS.includes(format)) throw new UserError("Invalid format");
  return {
    title: str(input.title, "Title", { required: true, max: 300 })!,
    author: str(input.author, "Author", { max: 200 }) ?? "",
    isbn: str(input.isbn, "ISBN", { max: 20 }),
    // Remote cover images are not supported (offline by default); books use generated covers.
    cover_url: null,
    description: str(input.description, "Description", { max: 5000 }),
    page_count: int(input.page_count, "Pages", { min: 1, max: 20000 }),
    published_year: int(input.published_year, "Year", { min: -3000, max: 3000 }),
    format,
    genres: Array.isArray(input.genres) ? input.genres.filter((g) => typeof g === "string").slice(0, 20) : [],
  };
}

export async function createBook(input: BookInput) {
  return mutate((db) => {
    const b = parseBook(input);
    const st = input.status ? status(input.status) : "want";
    const res = db
      .prepare(
        `INSERT INTO books (title, author, isbn, cover_url, description, page_count, published_year, format)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(b.title, b.author, b.isbn, b.cover_url, b.description, b.page_count, b.published_year, b.format);
    const bookId = Number(res.lastInsertRowid);
    setGenres(db, bookId, b.genres);
    if (st !== "want") applyStatus(db, bookId, st);
    return { id: bookId };
  });
}

export async function updateBook(bookId: number, input: BookInput) {
  return mutate((db) => {
    const bid = id(bookId);
    assertBook(db, bid);
    const b = parseBook(input);
    db.prepare(
      `UPDATE books SET title = ?, author = ?, isbn = ?, cover_url = ?, description = ?, page_count = ?,
       published_year = ?, format = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(b.title, b.author, b.isbn, b.cover_url, b.description, b.page_count, b.published_year, b.format, bid);
    setGenres(db, bid, b.genres);
    return { id: bid };
  });
}

export async function deleteBook(bookId: number) {
  return mutate((db) => {
    db.prepare("DELETE FROM books WHERE id = ?").run(id(bookId));
  });
}

export async function setBookStatus(bookId: number, next: BookStatus) {
  return mutate((db) => applyStatus(db, id(bookId), status(next)));
}

export async function setRating(bookId: number, rating: number | null) {
  return mutate((db) => {
    const r = rating == null ? null : int(rating, "Rating", { min: 1, max: 5 });
    assertBook(db, id(bookId));
    db.prepare("UPDATE books SET rating = ?, updated_at = datetime('now') WHERE id = ?").run(r, bookId);
  });
}

export async function toggleFavorite(bookId: number) {
  return mutate((db) => {
    assertBook(db, id(bookId));
    db.prepare("UPDATE books SET favorite = 1 - favorite, updated_at = datetime('now') WHERE id = ?").run(bookId);
  });
}

// ---------- sessions ----------

export type SessionInput = {
  bookId: number;
  date: string;
  startPage?: number | string | null;
  endPage?: number | string | null;
  pages?: number | string | null;
  minutes?: number | string | null;
  note?: string;
  finished?: boolean;
};

export async function logSession(input: SessionInput) {
  return mutate((db) => {
    const bookId = id(input.bookId);
    const book = assertBook(db, bookId);
    const date = isoDate(input.date, "Date") ?? today();
    if (date > today()) throw new UserError("Sessions can't be in the future");
    const start = int(input.startPage, "Start page", { max: 20000 });
    const end = int(input.endPage, "End page", { max: 20000 });
    let pages = int(input.pages, "Pages", { max: 5000 });
    if (start != null && end != null) {
      if (end < start) throw new UserError("End page must be after start page");
      pages = end - start;
    } else if (end != null && pages == null) {
      pages = Math.max(0, end - book.current_page);
    }
    pages ??= 0;
    const minutes = int(input.minutes, "Minutes", { max: 24 * 60 }) ?? 0;
    if (pages === 0 && minutes === 0) throw new UserError("Log at least some pages or minutes");
    const note = str(input.note, "Note", { max: 2000 });

    db.prepare(
      `INSERT INTO reading_sessions (book_id, date, start_page, end_page, pages, minutes, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(bookId, date, start, end, pages, minutes, note);

    const newPage = end ?? book.current_page + pages;
    const capped = book.page_count ? Math.min(newPage, book.page_count) : newPage;
    db.prepare("UPDATE books SET current_page = MAX(current_page, ?), updated_at = datetime('now') WHERE id = ?").run(capped, bookId);
    if (book.status === "want" || book.status === "dnf") applyStatus(db, bookId, "reading", date);
    if (input.finished) applyStatus(db, bookId, "finished", date);
  });
}

export async function deleteSession(sessionId: number) {
  return mutate((db) => {
    db.prepare("DELETE FROM reading_sessions WHERE id = ?").run(id(sessionId));
  });
}

// ---------- reviews ----------

export async function saveReview(bookId: number, input: { headline?: string; body: string; containsSpoilers?: boolean }) {
  return mutate((db) => {
    const bid = id(bookId);
    assertBook(db, bid);
    const headline = str(input.headline, "Headline", { max: 200 });
    const body = str(input.body, "Review", { required: true, max: 20000 })!;
    db.prepare(
      `INSERT INTO reviews (book_id, headline, body, contains_spoilers) VALUES (?, ?, ?, ?)
       ON CONFLICT(book_id) DO UPDATE SET headline = excluded.headline, body = excluded.body,
         contains_spoilers = excluded.contains_spoilers, updated_at = datetime('now')`,
    ).run(bid, headline, body, input.containsSpoilers ? 1 : 0);
  });
}

export async function deleteReview(bookId: number) {
  return mutate((db) => {
    db.prepare("DELETE FROM reviews WHERE book_id = ?").run(id(bookId));
  });
}

// ---------- genres ----------

export async function createGenre(name: string) {
  return mutate((db) => {
    const n = str(name, "Genre name", { required: true, max: 60 })!;
    const exists = db.prepare("SELECT 1 FROM genres WHERE name = ? COLLATE NOCASE").get(n);
    if (exists) throw new UserError(`"${n}" already exists`);
    db.prepare("INSERT INTO genres (name) VALUES (?)").run(n);
  });
}

export async function renameGenre(genreId: number, name: string) {
  return mutate((db) => {
    const n = str(name, "Genre name", { required: true, max: 60 })!;
    const clash = db.prepare("SELECT id FROM genres WHERE name = ? COLLATE NOCASE AND id != ?").get(n, id(genreId));
    if (clash) throw new UserError(`"${n}" already exists`);
    db.prepare("UPDATE genres SET name = ? WHERE id = ?").run(n, genreId);
  });
}

export async function deleteGenre(genreId: number) {
  return mutate((db) => {
    db.prepare("DELETE FROM genres WHERE id = ?").run(id(genreId));
  });
}

// ---------- collections ----------

export async function createCollection(input: { name: string; description?: string }) {
  return mutate((db) => {
    const name = str(input.name, "Name", { required: true, max: 100 })!;
    const description = str(input.description, "Description", { max: 1000 });
    const res = db.prepare("INSERT INTO collections (name, description) VALUES (?, ?)").run(name, description);
    return { id: Number(res.lastInsertRowid) };
  });
}

export async function updateCollection(collectionId: number, input: { name: string; description?: string }) {
  return mutate((db) => {
    const name = str(input.name, "Name", { required: true, max: 100 })!;
    const description = str(input.description, "Description", { max: 1000 });
    db.prepare("UPDATE collections SET name = ?, description = ? WHERE id = ?").run(name, description, id(collectionId));
  });
}

export async function deleteCollection(collectionId: number) {
  return mutate((db) => {
    db.prepare("DELETE FROM collections WHERE id = ?").run(id(collectionId));
  });
}

export async function setBookInCollection(collectionId: number, bookId: number, included: boolean) {
  return mutate((db) => {
    const cid = id(collectionId);
    const bid = id(bookId);
    assertBook(db, bid);
    if (!db.prepare("SELECT 1 FROM collections WHERE id = ?").get(cid)) throw new UserError("Collection not found");
    if (included) db.prepare("INSERT OR IGNORE INTO collection_books (collection_id, book_id) VALUES (?, ?)").run(cid, bid);
    else db.prepare("DELETE FROM collection_books WHERE collection_id = ? AND book_id = ?").run(cid, bid);
  });
}

// ---------- settings & data ----------

export async function updateSettings(input: { displayName: string; dailyPageGoal: number | string; yearlyBookGoal: number | string }) {
  return mutate((db) => {
    const values = {
      displayName: str(input.displayName, "Name", { required: true, max: 60 })!,
      dailyPageGoal: String(int(input.dailyPageGoal, "Daily page goal", { min: 1, max: 2000 }) ?? 30),
      yearlyBookGoal: String(int(input.yearlyBookGoal, "Yearly book goal", { min: 1, max: 1000 }) ?? 24),
    };
    const up = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    for (const [k, v] of Object.entries(values)) up.run(k, v);
  });
}

export async function loadSampleData() {
  return mutate((db) => {
    const count = (db.prepare("SELECT COUNT(*) AS n FROM books").get() as { n: number }).n;
    if (count > 0) throw new UserError("Sample data can only be loaded into an empty library");
    const ids = new Map<string, number>();
    const insertBook = db.prepare(
      `INSERT INTO books (title, author, page_count, published_year, cover_url, isbn, format, status, rating, favorite, current_page, started_at, finished_at, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertSession = db.prepare("INSERT INTO reading_sessions (book_id, date, pages, minutes, start_page, end_page) VALUES (?, ?, ?, ?, ?, ?)");
    const insertReview = db.prepare("INSERT INTO reviews (book_id, headline, body) VALUES (?, ?, ?)");
    for (const s of SAMPLE_BOOKS()) {
      const res = insertBook.run(
        s.title, s.author, s.pages, s.year, s.cover, null, s.format, s.status, s.rating ?? null,
        s.favorite ? 1 : 0, s.currentPage, s.startedAt ?? null, s.finishedAt ?? null, s.description ?? null,
      );
      const bookId = Number(res.lastInsertRowid);
      ids.set(s.title, bookId);
      setGenres(db, bookId, s.genres);
      for (const sess of s.sessions) insertSession.run(bookId, sess.date, sess.pages, sess.minutes, sess.start, sess.start + sess.pages);
      if (s.review) insertReview.run(bookId, s.review.headline, s.review.body);
    }
    for (const c of SAMPLE_COLLECTIONS) {
      const res = db.prepare("INSERT INTO collections (name, description) VALUES (?, ?)").run(c.name, c.description);
      const cid = Number(res.lastInsertRowid);
      for (const t of c.titles) {
        const bid = ids.get(t);
        if (bid) db.prepare("INSERT INTO collection_books (collection_id, book_id) VALUES (?, ?)").run(cid, bid);
      }
    }
  });
}

export async function resetAllData() {
  return mutate((db) => {
    db.exec(`DELETE FROM reading_sessions; DELETE FROM reviews; DELETE FROM collection_books; DELETE FROM collections;
             DELETE FROM book_genres; DELETE FROM genres; DELETE FROM books; DELETE FROM achievements_unlocked;`);
  });
}
