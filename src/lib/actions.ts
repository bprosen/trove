/**
 * Mutations exposed to the client as TanStack Start server functions (RPC).
 * Each wrapper keeps the old positional call signature so components can call e.g. `updateBook(id, input)`.
 * The actual validation and SQL live in `mutations.server.ts`, which never reaches the browser bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { objectInput } from "./server-input";
import * as M from "./mutations.server";
import type { BookInput, SessionInput } from "./mutations.server";
import type { BookStatus } from "./types";

export type { BookInput, SessionInput };

type CollectionInput = { name: string; description?: string };
type ReviewInput = { headline?: string; body: string; containsSpoilers?: boolean };
type SettingsInput = { displayName: string; dailyPageGoal: number | string; yearlyBookGoal: number | string };

// ---------- books ----------

const createBookFn = createServerFn({ method: "POST" })
  .validator((d: BookInput) => objectInput(d))
  .handler(({ data }) => M.createBook(data));
export const createBook = (input: BookInput) => createBookFn({ data: input });

const updateBookFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number; input: BookInput }) => objectInput(d))
  .handler(({ data }) => M.updateBook(data.bookId, data.input));
export const updateBook = (bookId: number, input: BookInput) => updateBookFn({ data: { bookId, input } });

const deleteBookFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number }) => objectInput(d))
  .handler(({ data }) => M.deleteBook(data.bookId));
export const deleteBook = (bookId: number) => deleteBookFn({ data: { bookId } });

const setBookStatusFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number; status: BookStatus }) => objectInput(d))
  .handler(({ data }) => M.setBookStatus(data.bookId, data.status));
export const setBookStatus = (bookId: number, status: BookStatus) => setBookStatusFn({ data: { bookId, status } });

const setRatingFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number; rating: number | null }) => objectInput(d))
  .handler(({ data }) => M.setRating(data.bookId, data.rating));
export const setRating = (bookId: number, rating: number | null) => setRatingFn({ data: { bookId, rating } });

const toggleFavoriteFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number }) => objectInput(d))
  .handler(({ data }) => M.toggleFavorite(data.bookId));
export const toggleFavorite = (bookId: number) => toggleFavoriteFn({ data: { bookId } });

// ---------- sessions ----------

const logSessionFn = createServerFn({ method: "POST" })
  .validator((d: SessionInput) => objectInput(d))
  .handler(({ data }) => M.logSession(data));
export const logSession = (input: SessionInput) => logSessionFn({ data: input });

const deleteSessionFn = createServerFn({ method: "POST" })
  .validator((d: { sessionId: number }) => objectInput(d))
  .handler(({ data }) => M.deleteSession(data.sessionId));
export const deleteSession = (sessionId: number) => deleteSessionFn({ data: { sessionId } });

// ---------- reviews ----------

const saveReviewFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number; input: ReviewInput }) => objectInput(d))
  .handler(({ data }) => M.saveReview(data.bookId, data.input));
export const saveReview = (bookId: number, input: ReviewInput) => saveReviewFn({ data: { bookId, input } });

const deleteReviewFn = createServerFn({ method: "POST" })
  .validator((d: { bookId: number }) => objectInput(d))
  .handler(({ data }) => M.deleteReview(data.bookId));
export const deleteReview = (bookId: number) => deleteReviewFn({ data: { bookId } });

// ---------- genres ----------

const createGenreFn = createServerFn({ method: "POST" })
  .validator((d: { name: string }) => objectInput(d))
  .handler(({ data }) => M.createGenre(data.name));
export const createGenre = (name: string) => createGenreFn({ data: { name } });

const renameGenreFn = createServerFn({ method: "POST" })
  .validator((d: { genreId: number; name: string }) => objectInput(d))
  .handler(({ data }) => M.renameGenre(data.genreId, data.name));
export const renameGenre = (genreId: number, name: string) => renameGenreFn({ data: { genreId, name } });

const deleteGenreFn = createServerFn({ method: "POST" })
  .validator((d: { genreId: number }) => objectInput(d))
  .handler(({ data }) => M.deleteGenre(data.genreId));
export const deleteGenre = (genreId: number) => deleteGenreFn({ data: { genreId } });

// ---------- collections ----------

const createCollectionFn = createServerFn({ method: "POST" })
  .validator((d: CollectionInput) => objectInput(d))
  .handler(({ data }) => M.createCollection(data));
export const createCollection = (input: CollectionInput) => createCollectionFn({ data: input });

const updateCollectionFn = createServerFn({ method: "POST" })
  .validator((d: { collectionId: number; input: CollectionInput }) => objectInput(d))
  .handler(({ data }) => M.updateCollection(data.collectionId, data.input));
export const updateCollection = (collectionId: number, input: CollectionInput) =>
  updateCollectionFn({ data: { collectionId, input } });

const deleteCollectionFn = createServerFn({ method: "POST" })
  .validator((d: { collectionId: number }) => objectInput(d))
  .handler(({ data }) => M.deleteCollection(data.collectionId));
export const deleteCollection = (collectionId: number) => deleteCollectionFn({ data: { collectionId } });

const setBookInCollectionFn = createServerFn({ method: "POST" })
  .validator((d: { collectionId: number; bookId: number; included: boolean }) => objectInput(d))
  .handler(({ data }) => M.setBookInCollection(data.collectionId, data.bookId, data.included));
export const setBookInCollection = (collectionId: number, bookId: number, included: boolean) =>
  setBookInCollectionFn({ data: { collectionId, bookId, included } });

// ---------- settings & data ----------

const updateSettingsFn = createServerFn({ method: "POST" })
  .validator((d: SettingsInput) => objectInput(d))
  .handler(({ data }) => M.updateSettings(data));
export const updateSettings = (input: SettingsInput) => updateSettingsFn({ data: input });

const loadSampleDataFn = createServerFn({ method: "POST" }).handler(() => M.loadSampleData());
export const loadSampleData = () => loadSampleDataFn();

const resetAllDataFn = createServerFn({ method: "POST" }).handler(() => M.resetAllData());
export const resetAllData = () => resetAllDataFn();
