/**
 * Read-side server functions. Route loaders call these; on the client they become RPC calls,
 * so the SQLite code in `*.server.ts` never ships to the browser.
 */
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { objectInput } from "./server-input";
import * as Q from "./queries.server";
import { getStats } from "./stats.server";
import { achievementStatuses } from "./achievements";
import type { LibrarySearch } from "./library-search";

export type { LibrarySearch };

/**
 * Header badges (streak + level) shown on every page, plus achievements whose unlock celebration
 * hasn't played yet. This is the root loader, so it re-runs after every mutation — that's how a
 * new unlock reaches the client no matter which action caused it.
 */
export const getHeaderStats = createServerFn({ method: "GET" }).handler(async () => {
  const s = await getStats();
  return {
    currentStreak: s.currentStreak,
    streakAtRisk: s.streakAtRisk,
    level: s.level,
    newUnlocks: s.unlocks.filter((u) => !u.seen).map((u) => u.id),
  };
});

export const getTodayPage = createServerFn({ method: "GET" }).handler(async () => {
  const [stats, books, sessions] = await Promise.all([getStats(), Q.listBooks(), Q.listSessions({ limit: 5 })]);
  return { stats, books, sessions };
});

export const getLibraryPage = createServerFn({ method: "GET" })
  .validator((d: LibrarySearch) => objectInput(d))
  .handler(async ({ data }) => {
    const [books, all, genres] = await Promise.all([
      Q.listBooks({ q: data.q, status: data.status, genreId: data.genre, sort: data.sort ?? "recent", favorites: data.fav === "1" }),
      Q.listBooks(),
      Q.listGenres(),
    ]);
    const counts: Record<string, number> = { all: all.length };
    for (const b of all) counts[b.status] = (counts[b.status] ?? 0) + 1;
    return { books, total: all.length, counts, genres };
  });

export const getBookPage = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => objectInput(d))
  .handler(async ({ data }) => {
    const book = Number.isInteger(data.id) ? await Q.getBook(data.id) : null;
    if (!book) throw notFound();
    const [review, sessions, collections, memberOf] = await Promise.all([
      Q.getReview(data.id),
      Q.listSessions({ bookId: data.id }),
      Q.listCollections(),
      Q.collectionIdsForBook(data.id),
    ]);
    return { book, review, sessions, collections, memberOf };
  });

export const getEditBookPage = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => objectInput(d))
  .handler(async ({ data }) => {
    const [book, genres] = await Promise.all([
      Number.isInteger(data.id) ? Q.getBook(data.id) : null,
      Q.listGenres(),
    ]);
    if (!book) throw notFound();
    return { book, genreSuggestions: genres.map((g) => g.name) };
  });

export const getNewBookPage = createServerFn({ method: "GET" }).handler(async () => {
  const genres = await Q.listGenres();
  return { genreSuggestions: genres.map((g) => g.name) };
});

export const getCollectionsPage = createServerFn({ method: "GET" }).handler(async () => {
  return { collections: await Q.listCollections() };
});

export const getCollectionPage = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => objectInput(d))
  .handler(async ({ data }) => {
    const [collection, all] = await Promise.all([
      Number.isInteger(data.id) ? Q.getCollection(data.id) : null,
      Q.listBooks({ sort: "title" }),
    ]);
    if (!collection) throw notFound();
    const inside = new Set(collection.books.map((b) => b.id));
    const addable = all.filter((b) => !inside.has(b.id)).map((b) => ({ id: b.id, title: b.title }));
    return { collection, addable };
  });

export const getGenresPage = createServerFn({ method: "GET" }).handler(async () => {
  const [genres, stats] = await Promise.all([Q.listGenres(), getStats()]);
  return { genres, stats };
});

export const getReviewsPage = createServerFn({ method: "GET" }).handler(async () => {
  return { reviews: await Q.listReviews() };
});

export const getSessionsPage = createServerFn({ method: "GET" }).handler(async () => {
  const [sessions, books, stats] = await Promise.all([Q.listSessions({ limit: 200 }), Q.listBooks(), getStats()]);
  return { sessions, books, stats };
});

export const getSettingsPage = createServerFn({ method: "GET" }).handler(async () => {
  return { settings: await Q.getSettings() };
});

export const getAchievementsPage = createServerFn({ method: "GET" }).handler(async () => {
  const s = await getStats();
  return { achievements: achievementStatuses(s.metrics, s.unlocks), level: s.level };
});

/** The stats page only needs the stats snapshot. */
export const getStatsPage = createServerFn({ method: "GET" }).handler(async () => {
  return { stats: await getStats() };
});
