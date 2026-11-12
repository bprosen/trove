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
  { title: "The Signal at Kepler's Edge", author: "Idris Vellmore", pages: 387, year: 2014, format: "ebook", status: "finished", genres: ["Science Fiction"], rating: 5, favorite: true, window: [75, 62],
    review: { headline: "Couldn't stop listening for the next transmission", body: "Funny, tense, and genuinely nerdy. The stranded engineer's voice carries the whole thing — I couldn't put it down." } },
  { title: "The House of Tides", author: "Elowen Brackfold", pages: 272, year: 2020, format: "physical", status: "finished", genres: ["Fantasy", "Literary Fiction"], rating: 5, favorite: true, window: [60, 52],
    review: { headline: "A dream of a book", body: "Strange, gentle and beautiful. The flooded halls are one of the most memorable settings I've ever read." } },
  { title: "Daughter of the Salt Isle", author: "Marisol Thornmere", pages: 393, year: 2018, format: "audiobook", status: "finished", genres: ["Fantasy", "Mythology"], rating: 4, window: [50, 33] },
  { title: "Everything the Orchard Kept", author: "Wynna Caldridge", pages: 352, year: 2018, format: "physical", status: "finished", genres: ["Memoir", "Nonfiction"], rating: 4, window: [32, 15] },
  { title: "Relay Beyond Tannis", author: "Idris Vellmore", pages: 496, year: 2021, format: "physical", status: "reading", genres: ["Science Fiction"], window: [14, 1], progress: 0.55 },
  { title: "The Lantern Oath", author: "Corvin Ashby", pages: 662, year: 2007, format: "ebook", status: "reading", genres: ["Fantasy"], window: [20, 3], progress: 0.2 },
  { title: "The Little Door Under Hollowhill", author: "Teodric Fenwick", pages: 300, year: 1937, format: "physical", status: "finished", genres: ["Fantasy", "Classics"], rating: 5, favorite: true, finishedDaysAgo: 140 },
  { title: "Letters from Larkspur Hall", author: "Rosalind Marrow", pages: 480, year: 1813, format: "physical", status: "finished", genres: ["Classics", "Romance"], rating: 4, finishedDaysAgo: 210 },
  { title: "The Quiet Ministry", author: "Osric Dunholt", pages: 328, year: 1949, format: "physical", status: "finished", genres: ["Classics", "Dystopian"], rating: 5, finishedDaysAgo: 260 },
  { title: "The Winter Accord", author: "Liesel Orrenwyn", pages: 304, year: 1969, format: "ebook", status: "finished", genres: ["Science Fiction", "Classics"], rating: 4, finishedDaysAgo: 100 },
  { title: "Rivers of Iron", author: "Halvard Pellcroft", pages: 464, year: 2015, format: "audiobook", status: "finished", genres: ["History", "Nonfiction"], rating: 3, finishedDaysAgo: 180 },
  { title: "The Patient Mind", author: "Nerys Galworth", pages: 499, year: 2011, format: "physical", status: "reading", genres: ["Psychology", "Nonfiction"], window: [40, 25], progress: 0.3 },
  { title: "Sands of Meridian", author: "Evander Quarrby", pages: 535, year: 1965, format: "physical", status: "want", genres: ["Science Fiction", "Classics"] },
  { title: "The Lattice of Small Lights", author: "Junia Wickstead", pages: 303, year: 2021, format: "ebook", status: "want", genres: ["Literary Fiction", "Science Fiction"] },
  { title: "The Five-Minute Practice", author: "Bastien Elholt", pages: 320, year: 2018, format: "physical", status: "want", genres: ["Self-Help", "Nonfiction"] },
  { title: "The Bellmaker's Sons", author: "Thaddeus Norvane", pages: 796, year: 1880, format: "physical", status: "want", genres: ["Classics", "Literary Fiction"] },
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
  { name: "All-time favorites", description: "The books I'd save in a fire.", titles: ["The Signal at Kepler's Edge", "The House of Tides", "The Little Door Under Hollowhill", "The Quiet Ministry"] },
  { name: "Classics challenge", description: "Working through the canon, one doorstopper at a time.", titles: ["Letters from Larkspur Hall", "The Quiet Ministry", "The Bellmaker's Sons", "Sands of Meridian", "The Winter Accord"] },
  { name: "Sci-fi shelf", description: null, titles: ["The Signal at Kepler's Edge", "Relay Beyond Tannis", "Sands of Meridian", "The Lattice of Small Lights", "The Winter Accord"] },
];
