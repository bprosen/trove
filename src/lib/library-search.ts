import { BOOK_SORTS, BOOK_STATUSES, type BookSort, type BookStatus } from "./types";

/** Validated `/library` search params. Defaults (sort=recent, all shelves) are represented as `undefined`. */
export type LibrarySearch = {
  q?: string;
  status?: BookStatus;
  genre?: number;
  sort?: BookSort;
  fav?: "1";
};

/** Parse untrusted URL search params into a typed filter object, dropping anything invalid. */
export function parseLibrarySearch(raw: Record<string, unknown>): LibrarySearch {
  const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : undefined);
  const q = str(raw.q)?.trim();
  const status = str(raw.status);
  const sort = str(raw.sort);
  const genre = Number(str(raw.genre));
  return {
    q: q || undefined,
    status: BOOK_STATUSES.includes(status as BookStatus) ? (status as BookStatus) : undefined,
    genre: Number.isInteger(genre) && genre > 0 ? genre : undefined,
    sort: BOOK_SORTS.includes(sort as BookSort) && sort !== "recent" ? (sort as BookSort) : undefined,
    fav: str(raw.fav) === "1" ? "1" : undefined,
  };
}
