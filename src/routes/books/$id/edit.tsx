import { createFileRoute } from "@tanstack/react-router";
import { BookForm } from "@/components/trove/book-form";
import { PageHeader } from "@/components/trove/page-header";
import { getEditBookPage } from "@/lib/data";

export const Route = createFileRoute("/books/$id/edit")({
  loader: ({ params }) => getEditBookPage({ data: { id: Number(params.id) } }),
  head: ({ loaderData }) => ({ meta: [{ title: `Edit ${loaderData?.book.title ?? "book"} · Trove` }] }),
  component: EditBookPage,
});

function EditBookPage() {
  const { book, genreSuggestions } = Route.useLoaderData();
  return (
    <div>
      <PageHeader title={`Edit “${book.title}”`} />
      <BookForm book={book} genreSuggestions={genreSuggestions} />
    </div>
  );
}
