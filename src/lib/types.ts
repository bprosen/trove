export const BOOK_STATUSES = ["want", "reading", "finished", "dnf"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const STATUS_LABELS: Record<BookStatus, string> = {
  want: "Want to read",
  reading: "Reading",
  finished: "Finished",
  dnf: "Did not finish",
};

export const BOOK_FORMATS = ["physical", "ebook", "audiobook"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const FORMAT_LABELS: Record<BookFormat, string> = {
  physical: "Physical",
  ebook: "E-book",
  audiobook: "Audiobook",
};

export type Genre = { id: number; name: string };

export type Book = {
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
  favorite: boolean;
  current_page: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  genres: Genre[];
};

export type Review = {
  id: number;
  book_id: number;
  headline: string | null;
  body: string;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
};

export type ReadingSession = {
  id: number;
  book_id: number;
  book_title: string;
  book_cover: string | null;
  date: string;
  start_page: number | null;
  end_page: number | null;
  pages: number;
  minutes: number;
  note: string | null;
  created_at: string;
};

export type Collection = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  book_count: number;
  covers: (string | null)[];
};

export type Settings = {
  displayName: string;
  dailyPageGoal: number;
  yearlyBookGoal: number;
};

/** Result shape returned by every mutating server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; unlocked: string[] }
  | { ok: false; error: string };
