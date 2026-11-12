import books from "@/data/books.json";

/**
 * A known book from the bundled offline catalog (`src/data/books.json`).
 * Add entries to that file to make more books searchable. Only `title` and `author` are required.
 */
export type CatalogBook = {
  title: string;
  author: string;
  year?: number;
  pages?: number;
  genres?: string[];
  isbn?: string;
  description?: string;
};

/** Lowercase, strip accents and punctuation so "Brontë" matches "bronte" and "Hitchhikers" matches "Hitchhiker's". */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const INDEX = (books as CatalogBook[]).map((book) => ({
  book,
  title: normalize(book.title),
  author: normalize(book.author),
  isbn: book.isbn?.replace(/[^0-9xX]/g, "") ?? "",
}));

/** Search the offline catalog by title, author, or ISBN. Every word in the query must match. */
export function searchCatalog(query: string, limit = 8): CatalogBook[] {
  const q = normalize(query);
  if (!q) return [];
  const digits = query.replace(/[^0-9xX]/g, "");
  const words = q.split(" ");

  const scored: { book: CatalogBook; score: number }[] = [];
  for (const entry of INDEX) {
    if (digits.length >= 10 && entry.isbn === digits) {
      scored.push({ book: entry.book, score: 1000 });
      continue;
    }
    const haystack = `${entry.title} ${entry.author}`;
    if (!words.every((w) => haystack.includes(w))) continue;
    let score = 0;
    if (entry.title === q) score += 100;
    else if (entry.title.startsWith(q)) score += 50;
    else if (entry.title.includes(q)) score += 25;
    if (entry.author.includes(q)) score += 20;
    // Words that start a title word beat mid-word matches ("dune" > "redundant").
    for (const w of words) if (` ${haystack}`.includes(` ${w}`)) score += 5;
    scored.push({ book: entry.book, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, limit)
    .map((s) => s.book);
}
