import { notFound } from "next/navigation";
import { BookForm } from "@/components/trove/book-form";
import { PageHeader } from "@/components/trove/page-header";
import { getBook, listGenres } from "@/lib/queries";

export default async function EditBookPage({ params }: PageProps<"/books/[id]/edit">) {
  const { id } = await params;
  const [book, genres] = await Promise.all([getBook(Number(id)), listGenres()]);
  if (!book) notFound();
  return (
    <div>
      <PageHeader title={`Edit “${book.title}”`} />
      <BookForm book={book} genreSuggestions={genres.map((g) => g.name)} />
    </div>
  );
}
