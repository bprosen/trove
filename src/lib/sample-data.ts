import { addDays, today } from "./dates";
import type { BookFormat, BookStatus } from "./types";

type SampleSession = { date: string; pages: number; minutes: number; start: number };
type SampleBook = {
  title: string;
  author: string;
  pages: number;
  year: number;
  /** Always null: sample books use the generated cloth-bound cover so nothing is fetched online. */
  cover: null;
  format: BookFormat;
  status: BookStatus;
  genres: string[];
  rating?: number;
  favorite?: boolean;
  currentPage: number;
  startedAt?: string;
  finishedAt?: string;
  description?: string;
  sessions: SampleSession[];
  review?: { headline: string; body: string };
};

/** Small deterministic PRNG so sample data looks organic but is reproducible. */
function prng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

type Seed = Omit<SampleBook, "cover" | "sessions" | "currentPage" | "startedAt" | "finishedAt"> & {
  /** [startDaysAgo, endDaysAgo] — sessions are generated across this window. */
  window?: [number, number];
  /** For reading books: how far in they are. */
  progress?: number;
  /** For finished books without sessions: finished N days ago. */
  finishedDaysAgo?: number;
};

const SEEDS: Seed[] = [
  { title: "Example 1", author: "Author 1", pages: 387, year: 2014, format: "ebook", status: "finished", genres: ["Science Fiction"], rating: 5, favorite: true, window: [75, 62],
    review: { headline: "Example review 1", body: "Example review text." } },
  { title: "Example 2", author: "Author 2", pages: 272, year: 2020, format: "physical", status: "finished", genres: ["Fantasy", "Literary Fiction"], rating: 5, favorite: true, window: [60, 52],
    review: { headline: "Example review 2", body: "Example review text." } },
  { title: "Example 3", author: "Author 3", pages: 393, year: 2018, format: "audiobook", status: "finished", genres: ["Fantasy", "Mythology"], rating: 4, window: [50, 33] },
  { title: "Example 4", author: "Author 4", pages: 352, year: 2018, format: "physical", status: "finished", genres: ["Memoir", "Nonfiction"], rating: 4, window: [32, 15] },
  { title: "Example 5", author: "Author 1", pages: 496, year: 2021, format: "physical", status: "reading", genres: ["Science Fiction"], window: [14, 1], progress: 0.55 },
  { title: "Example 6", author: "Author 5", pages: 662, year: 2007, format: "ebook", status: "reading", genres: ["Fantasy"], window: [20, 3], progress: 0.2 },
  { title: "Example 7", author: "Author 6", pages: 300, year: 1937, format: "physical", status: "finished", genres: ["Fantasy", "Classics"], rating: 5, favorite: true, finishedDaysAgo: 140 },
  { title: "Example 8", author: "Author 7", pages: 480, year: 1813, format: "physical", status: "finished", genres: ["Classics", "Romance"], rating: 4, finishedDaysAgo: 210 },
  { title: "Example 9", author: "Author 8", pages: 328, year: 1949, format: "physical", status: "finished", genres: ["Classics", "Dystopian"], rating: 5, finishedDaysAgo: 260 },
  { title: "Example 10", author: "Author 9", pages: 304, year: 1969, format: "ebook", status: "finished", genres: ["Science Fiction", "Classics"], rating: 4, finishedDaysAgo: 100 },
  { title: "Example 11", author: "Author 10", pages: 464, year: 2015, format: "audiobook", status: "finished", genres: ["History", "Nonfiction"], rating: 3, finishedDaysAgo: 180 },
  { title: "Example 12", author: "Author 11", pages: 499, year: 2011, format: "physical", status: "reading", genres: ["Psychology", "Nonfiction"], window: [40, 25], progress: 0.3 },
  { title: "Example 13", author: "Author 12", pages: 535, year: 1965, format: "physical", status: "want", genres: ["Science Fiction", "Classics"] },
  { title: "Example 14", author: "Author 13", pages: 303, year: 2021, format: "ebook", status: "want", genres: ["Literary Fiction", "Science Fiction"] },
  { title: "Example 15", author: "Author 14", pages: 320, year: 2018, format: "physical", status: "want", genres: ["Self-Help", "Nonfiction"] },
  { title: "Example 16", author: "Author 15", pages: 796, year: 1880, format: "physical", status: "want", genres: ["Classics", "Literary Fiction"] },
];

export function SAMPLE_BOOKS(): SampleBook[] {
  const t = today();
  const rand = prng(42);
  return SEEDS.map(({ window, progress, finishedDaysAgo, ...s }) => {
    const book: SampleBook = { ...s, cover: null, currentPage: 0, sessions: [] };
    if (finishedDaysAgo != null) {
      book.finishedAt = addDays(t, -finishedDaysAgo);
      book.startedAt = addDays(t, -finishedDaysAgo - 14);
      book.currentPage = s.pages;
    }
    if (window) {
      const [from, to] = window;
      const totalPages = s.status === "finished" ? s.pages : Math.round(s.pages * (progress ?? 0.3));
      const days: number[] = [];
      for (let d = from; d >= to; d--) {
        // Always read in the last week (builds a live streak); otherwise ~70% of days.
        if (d === from || d === to || d <= 6 || rand() < 0.7) days.push(d);
      }
      const weights = days.map(() => 0.5 + rand());
      const sum = weights.reduce((a, b) => a + b, 0);
      let page = 0;
      days.forEach((d, i) => {
        const pages =
          i === days.length - 1
            ? totalPages - page
            : Math.min(totalPages - page, Math.max(1, Math.round((weights[i] / sum) * totalPages)));
        if (pages <= 0) return;
        book.sessions.push({ date: addDays(t, -d), pages, minutes: Math.round(pages * (1.2 + rand() * 0.6)), start: page });
        page += pages;
      });
      book.currentPage = page;
      book.startedAt = addDays(t, -from);
      if (s.status === "finished") book.finishedAt = addDays(t, -to);
    }
    return book;
  });
}

export const SAMPLE_COLLECTIONS = [
  { name: "Collection 1", description: "Example description.", titles: ["Example 1", "Example 2", "Example 7", "Example 9"] },
  { name: "Collection 2", description: "Example description.", titles: ["Example 8", "Example 9", "Example 16", "Example 13", "Example 10"] },
  { name: "Collection 3", description: null, titles: ["Example 1", "Example 5", "Example 13", "Example 14", "Example 10"] },
];
