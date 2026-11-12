import { createFileRoute } from "@tanstack/react-router";
import { BookForm } from "@/components/trove/book-form";
import { PageHeader } from "@/components/trove/page-header";
import { getNewBookPage } from "@/lib/data";

export const Route = createFileRoute("/books/new")({
  loader: () => getNewBookPage(),
  head: () => ({ meta: [{ title: "Add book · Trove" }] }),
  component: NewBookPage,
});

function NewBookPage() {
  const { genreSuggestions } = Route.useLoaderData();
  return (
    <div>
      <PageHeader title="Add a book" description="+XP is waiting for your first one." />
      <BookForm genreSuggestions={genreSuggestions} />
    </div>
  );
}
