import { all, get, type BookRow, type CollectionRow, type ReviewRow, type ReadingSessionRow, type SettingRow } from "./db.server";
import type { Book, BookSort, BookStatus, Collection, Genre, ReadingSession, Review, Settings } from "./types";

/** Read layer: typed SQL reads mapped to the domain types in `types.ts`. */

const DEFAULT_SETTINGS: Settings = { displayName: "Reader", dailyPageGoal: 30, yearlyBookGoal: 24 };

export function readSettings(): Settings {
  const rows = all<SettingRow>("SELECT key, value FROM settings");
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (key === "displayName") s.displayName = value;
    if (key === "dailyPageGoal") s.dailyPageGoal = Number(value) || DEFAULT_SETTINGS.dailyPageGoal;
    if (key === "yearlyBookGoal") s.yearlyBookGoal = Number(value) || DEFAULT_SETTINGS.yearlyBookGoal;
  }
  return s;
}

export async function getSettings(): Promise<Settings> {
  return readSettings();
}

function genresFor(bookIds: number[]): Map<number, Genre[]> {
  const map = new Map<number, Genre[]>();
  if (bookIds.length === 0) return map;
  const rows = all<{ book_id: number; id: number; name: string }>(
    `SELECT bg.book_id, g.id, g.name FROM book_genres bg JOIN genres g ON g.id = bg.genre_id
     WHERE bg.book_id IN (${bookIds.map(() => "?").join(",")}) ORDER BY g.name`,
    ...bookIds,
  );
  for (const r of rows) {
    const list = map.get(r.book_id) ?? [];
    list.push({ id: r.id, name: r.name });
    map.set(r.book_id, list);
  }
  return map;
}

function toBook(r: BookRow, genres: Genre[] = []): Book {
  return { ...r, favorite: r.favorite === 1, genres };
}

function hydrate(rows: BookRow[]): Book[] {
  const g = genresFor(rows.map((r) => r.id));
  return rows.map((r) => toBook(r, g.get(r.id)));
}

export type { BookSort };

export async function listBooks(
  opts: {
    q?: string;
    status?: BookStatus;
    genreId?: number;
    favorites?: boolean;
    sort?: BookSort;
  } = {},
): Promise<Book[]> {
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
  const rows = all<BookRow>(
    `SELECT b.* FROM books b ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}`,
    ...params,
  );
  return hydrate(rows);
}

export async function getBook(id: number): Promise<Book | null> {
  const row = get<BookRow>("SELECT * FROM books WHERE id = ?", id);
  return row ? hydrate([row])[0] : null;
}

export async function listGenres(): Promise<(Genre & { bookCount: number; finishedCount: number; avgRating: number | null })[]> {
  const rows = all<{ id: number; name: string; bookCount: number; finishedCount: number | null; avgRating: number | null }>(
    `SELECT g.id, g.name,
            COUNT(b.id) AS bookCount,
            SUM(CASE WHEN b.status = 'finished' THEN 1 ELSE 0 END) AS finishedCount,
            AVG(b.rating) AS avgRating
     FROM genres g
     LEFT JOIN book_genres bg ON bg.genre_id = g.id
     LEFT JOIN books b ON b.id = bg.book_id
     GROUP BY g.id ORDER BY bookCount DESC, g.name COLLATE NOCASE`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    bookCount: r.bookCount,
    finishedCount: r.finishedCount ?? 0,
    avgRating: r.avgRating,
  }));
}

function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    book_id: r.book_id,
    headline: r.headline,
    body: r.body,
    contains_spoilers: r.contains_spoilers === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function getReview(bookId: number): Promise<Review | null> {
  const row = get<ReviewRow>("SELECT * FROM reviews WHERE book_id = ?", bookId);
  return row ? toReview(row) : null;
}

export async function listReviews(): Promise<(Review & { book: Pick<Book, "id" | "title" | "author" | "cover_url" | "rating"> })[]> {
  const rows = all<ReviewRow & Pick<BookRow, "title" | "author" | "cover_url" | "rating">>(
    `SELECT r.*, b.title, b.author, b.cover_url, b.rating FROM reviews r
     JOIN books b ON b.id = r.book_id ORDER BY r.updated_at DESC`,
  );
  return rows.map((r) => ({
    ...toReview(r),
    book: { id: r.book_id, title: r.title, author: r.author, cover_url: r.cover_url, rating: r.rating },
  }));
}

export async function listSessions(opts: { bookId?: number; limit?: number } = {}): Promise<ReadingSession[]> {
  return all<ReadingSessionRow & { book_title: string; book_cover: string | null }>(
    `SELECT s.*, b.title AS book_title, b.cover_url AS book_cover
     FROM reading_sessions s JOIN books b ON b.id = s.book_id
     ${opts.bookId ? "WHERE s.book_id = ?" : ""}
     ORDER BY s.date DESC, s.id DESC
     ${opts.limit ? `LIMIT ${Math.floor(opts.limit)}` : ""}`,
    ...(opts.bookId ? [opts.bookId] : []),
  ).map((r) => ({ ...r }));
}

function collectionCovers(id: number): (string | null)[] {
  return all<Pick<BookRow, "cover_url">>(
    `SELECT b.cover_url FROM collection_books cb JOIN books b ON b.id = cb.book_id
     WHERE cb.collection_id = ? ORDER BY cb.added_at DESC LIMIT 4`,
    id,
  ).map((r) => r.cover_url);
}

export async function listCollections(): Promise<Collection[]> {
  const rows = all<CollectionRow & { book_count: number }>(
    `SELECT c.*, COUNT(cb.book_id) AS book_count FROM collections c
     LEFT JOIN collection_books cb ON cb.collection_id = c.id
     GROUP BY c.id ORDER BY c.created_at DESC`,
  );
  return rows.map((r) => ({ ...r, covers: collectionCovers(r.id) }));
}

export async function getCollection(id: number): Promise<(Collection & { books: Book[] }) | null> {
  const r = get<CollectionRow>("SELECT * FROM collections WHERE id = ?", id);
  if (!r) return null;
  const books = hydrate(
    all<BookRow>(
      `SELECT b.* FROM collection_books cb JOIN books b ON b.id = cb.book_id
       WHERE cb.collection_id = ? ORDER BY cb.added_at DESC`,
      id,
    ),
  );
  return { ...r, book_count: books.length, covers: books.slice(0, 4).map((b) => b.cover_url), books };
}

export async function collectionIdsForBook(bookId: number): Promise<number[]> {
  return all<{ collection_id: number }>("SELECT collection_id FROM collection_books WHERE book_id = ?", bookId).map(
    (r) => r.collection_id,
  );
}
