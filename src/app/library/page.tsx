import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookGrid } from "@/components/trove/book-card";
import { LibraryFilters } from "@/components/trove/library-filters";
import { PageHeader } from "@/components/trove/page-header";
import { listBooks, listGenres, type BookSort } from "@/lib/queries";
import { BOOK_STATUSES, type BookStatus } from "@/lib/types";

export const metadata = { title: "Library" };

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = BOOK_STATUSES.includes(one(sp.status) as BookStatus) ? (one(sp.status) as BookStatus) : undefined;
  const sorts: BookSort[] = ["recent", "title", "author", "rating", "finished"];
  const sort = sorts.includes(one(sp.sort) as BookSort) ? (one(sp.sort) as BookSort) : "recent";
  const genreId = Number(one(sp.genre)) || undefined;

  const [books, all, genres] = await Promise.all([
    listBooks({ q: one(sp.q), status, genreId, sort, favorites: one(sp.fav) === "1" }),
    listBooks(),
    listGenres(),
  ]);
  const counts: Record<string, number> = { all: all.length };
  for (const b of all) counts[b.status] = (counts[b.status] ?? 0) + 1;

  return (
    <div>
      <PageHeader title="Library" description={`${all.length} books in your trove`}>
        <Button asChild>
          <Link href="/books/new">
            <Plus /> Add book
          </Link>
        </Button>
      </PageHeader>
      <div className="space-y-6">
        <LibraryFilters genres={genres} counts={counts} />
        {books.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            {all.length === 0 ? "Your library is empty." : "No books match these filters."}
          </div>
        ) : (
          <BookGrid books={books} />
        )}
      </div>
    </div>
  );
}
