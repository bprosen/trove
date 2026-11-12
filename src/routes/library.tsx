import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookGrid } from "@/components/trove/book-card";
import { LibraryFilters } from "@/components/trove/library-filters";
import { PageHeader } from "@/components/trove/page-header";
import { getLibraryPage } from "@/lib/data";
import { parseLibrarySearch } from "@/lib/library-search";

export const Route = createFileRoute("/library")({
  validateSearch: parseLibrarySearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getLibraryPage({ data: deps }),
  head: () => ({ meta: [{ title: "Library · Trove" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const { books, total, counts, genres } = Route.useLoaderData();

  return (
    <div>
      <PageHeader title="Library" description={`${total} books in your trove`}>
        <Button asChild>
          <Link to="/books/new">
            <Plus /> Add book
          </Link>
        </Button>
      </PageHeader>
      <div className="space-y-6">
        <LibraryFilters genres={genres} counts={counts} />
        {books.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            {total === 0 ? "Your library is empty." : "No books match these filters."}
          </div>
        ) : (
          <BookGrid books={books} />
        )}
      </div>
    </div>
  );
}
