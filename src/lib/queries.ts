import "server-only";
import { connection } from "next/server";
import { getDb } from "./db";
import type { Book, BookStatus, Collection, Genre, ReadingSession, Review, Settings } from "./types";

/**
 * Read layer. node:sqlite is synchronous, so every exported reader awaits
 * `connection()` first — otherwise Cache Components would bake build-time
 * rows into the static shell.
 */

type Row = Record<string, unknown>;

const DEFAULT_SETTINGS: Settings = { displayName: "Reader", dailyPageGoal: 30, yearlyBookGoal: 24 };

export function readSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (key === "displayName") s.displayName = value;
    if (key === "dailyPageGoal") s.dailyPageGoal = Number(value) || DEFAULT_SETTINGS.dailyPageGoal;
    if (key === "yearlyBookGoal") s.yearlyBookGoal = Number(value) || DEFAULT_SETTINGS.yearlyBookGoal;
  }
  return s;
}

export async function getSettings(): Promise<Settings> {
  await connection();
  return readSettings();
}

function genresFor(bookIds: number[]): Map<number, Genre[]> {
  const map = new Map<number, Genre[]>();
  if (bookIds.length === 0) return map;
  const rows = getDb()
    .prepare(
      `SELECT bg.book_id, g.id, g.name FROM book_genres bg JOIN genres g ON g.id = bg.genre_id
       WHERE bg.book_id IN (${bookIds.map(() => "?").join(",")}) ORDER BY g.name`,
    )
    .all(...bookIds) as { book_id: number; id: number; name: string }[];
  for (const r of rows) {
    const list = map.get(r.book_id) ?? [];
    list.push({ id: r.id, name: r.name });
    map.set(r.book_id, list);
  }
  return map;
}

function toBook(r: Row, genres: Genre[] = []): Book {
  return {
    id: r.id as number,
    title: r.title as string,
    author: r.author as string,
    isbn: (r.isbn as string) ?? null,
    cover_url: (r.cover_url as string) ?? null,
    description: (r.description as string) ?? null,
    page_count: (r.page_count as number) ?? null,
    published_year: (r.published_year as number) ?? null,
    format: r.format as Book["format"],
    status: r.status as BookStatus,
    rating: (r.rating as number) ?? null,
    favorite: Boolean(r.favorite),
    current_page: (r.current_page as number) ?? 0,
    started_at: (r.started_at as string) ?? null,
    finished_at: (r.finished_at as string) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    genres,
  };
}

function hydrate(rows: Row[]): Book[] {
  const g = genresFor(rows.map((r) => r.id as number));
  return rows.map((r) => toBook(r, g.get(r.id as number)));
}

export type BookSort = "recent" | "title" | "author" | "rating" | "finished";

export async function listBooks(opts: {
  q?: string;
  status?: BookStatus;
  genreId?: number;
  favorites?: boolean;
  sort?: BookSort;
} = {}): Promise<Book[]> {
  await connection();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.q) {
    where.push("(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like);
  }
  if (opts.status) {
    where.push("b.status = ?");
    params.push(opts.status);
  }
  if (opts.genreId) {
    where.push("EXISTS (SELECT 1 FROM book_genres bg WHERE bg.book_id = b.id AND bg.genre_id = ?)");
    params.push(opts.genreId);
  }
  if (opts.favorites) where.push("b.favorite = 1");
  const order = {
    recent: "b.updated_at DESC",
    title: "b.title COLLATE NOCASE ASC",
    author: "b.author COLLATE NOCASE ASC, b.title COLLATE NOCASE",
    rating: "b.rating IS NULL, b.rating DESC, b.title COLLATE NOCASE",
    finished: "b.finished_at IS NULL, b.finished_at DESC",
  }[opts.sort ?? "recent"];
  const rows = getDb()
    .prepare(`SELECT b.* FROM books b ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order}`)
    .all(...params) as Row[];
  return hydrate(rows);
}

export async function getBook(id: number): Promise<Book | null> {
  await connection();
  const row = getDb().prepare("SELECT * FROM books WHERE id = ?").get(id) as Row | undefined;
  return row ? hydrate([row])[0] : null;
}

export async function listGenres(): Promise<(Genre & { bookCount: number; finishedCount: number; avgRating: number | null })[]> {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT g.id, g.name,
              COUNT(b.id) AS bookCount,
              SUM(CASE WHEN b.status = 'finished' THEN 1 ELSE 0 END) AS finishedCount,
              AVG(b.rating) AS avgRating
       FROM genres g
       LEFT JOIN book_genres bg ON bg.genre_id = g.id
       LEFT JOIN books b ON b.id = bg.book_id
       GROUP BY g.id ORDER BY bookCount DESC, g.name COLLATE NOCASE`,
    )
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    bookCount: Number(r.bookCount ?? 0),
    finishedCount: Number(r.finishedCount ?? 0),
    avgRating: r.avgRating == null ? null : Number(r.avgRating),
  }));
}

function toReview(r: Row): Review {
  return {
    id: r.id as number,
    book_id: r.book_id as number,
    headline: (r.headline as string) ?? null,
    body: r.body as string,
    contains_spoilers: Boolean(r.contains_spoilers),
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

export async function getReview(bookId: number): Promise<Review | null> {
  await connection();
  const row = getDb().prepare("SELECT * FROM reviews WHERE book_id = ?").get(bookId) as Row | undefined;
  return row ? toReview(row) : null;
}

export async function listReviews(): Promise<(Review & { book: Pick<Book, "id" | "title" | "author" | "cover_url" | "rating"> })[]> {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT r.*, b.title, b.author, b.cover_url, b.rating FROM reviews r
       JOIN books b ON b.id = r.book_id ORDER BY r.updated_at DESC`,
    )
    .all() as Row[];
  return rows.map((r) => ({
    ...toReview(r),
    book: {
      id: r.book_id as number,
      title: r.title as string,
      author: r.author as string,
      cover_url: (r.cover_url as string) ?? null,
      rating: (r.rating as number) ?? null,
    },
  }));
}

export async function listSessions(opts: { bookId?: number; limit?: number } = {}): Promise<ReadingSession[]> {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT s.*, b.title AS book_title, b.cover_url AS book_cover
       FROM reading_sessions s JOIN books b ON b.id = s.book_id
       ${opts.bookId ? "WHERE s.book_id = ?" : ""}
       ORDER BY s.date DESC, s.id DESC
       ${opts.limit ? `LIMIT ${Math.floor(opts.limit)}` : ""}`,
    )
    .all(...(opts.bookId ? [opts.bookId] : [])) as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    book_id: r.book_id as number,
    book_title: r.book_title as string,
    book_cover: (r.book_cover as string) ?? null,
    date: r.date as string,
    start_page: (r.start_page as number) ?? null,
    end_page: (r.end_page as number) ?? null,
    pages: r.pages as number,
    minutes: r.minutes as number,
    note: (r.note as string) ?? null,
    created_at: r.created_at as string,
  }));
}

function collectionCovers(id: number): (string | null)[] {
  const rows = getDb()
    .prepare(
      `SELECT b.cover_url FROM collection_books cb JOIN books b ON b.id = cb.book_id
       WHERE cb.collection_id = ? ORDER BY cb.added_at DESC LIMIT 4`,
    )
    .all(id) as { cover_url: string | null }[];
  return rows.map((r) => r.cover_url);
}

export async function listCollections(): Promise<Collection[]> {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT c.*, COUNT(cb.book_id) AS book_count FROM collections c
       LEFT JOIN collection_books cb ON cb.collection_id = c.id
       GROUP BY c.id ORDER BY c.created_at DESC`,
    )
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    description: (r.description as string) ?? null,
    created_at: r.created_at as string,
    book_count: Number(r.book_count),
    covers: collectionCovers(r.id as number),
  }));
}

export async function getCollection(id: number): Promise<(Collection & { books: Book[] }) | null> {
  await connection();
  const r = getDb().prepare("SELECT * FROM collections WHERE id = ?").get(id) as Row | undefined;
  if (!r) return null;
  const bookRows = getDb()
    .prepare(
      `SELECT b.* FROM collection_books cb JOIN books b ON b.id = cb.book_id
       WHERE cb.collection_id = ? ORDER BY cb.added_at DESC`,
    )
    .all(id) as Row[];
  const books = hydrate(bookRows);
  return {
    id: r.id as number,
    name: r.name as string,
    description: (r.description as string) ?? null,
    created_at: r.created_at as string,
    book_count: books.length,
    covers: books.slice(0, 4).map((b) => b.cover_url),
    books,
  };
}

export async function collectionIdsForBook(bookId: number): Promise<number[]> {
  await connection();
  const rows = getDb().prepare("SELECT collection_id FROM collection_books WHERE book_id = ?").all(bookId) as {
    collection_id: number;
  }[];
  return rows.map((r) => r.collection_id);
}

export async function getUnlocked(): Promise<Map<string, string>> {
  await connection();
  const rows = getDb().prepare("SELECT achievement_id, unlocked_at FROM achievements_unlocked").all() as {
    achievement_id: string;
    unlocked_at: string;
  }[];
  return new Map(rows.map((r) => [r.achievement_id, r.unlocked_at]));
}
