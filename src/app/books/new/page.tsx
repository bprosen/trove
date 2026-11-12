import { BookForm } from "@/components/trove/book-form";
import { PageHeader } from "@/components/trove/page-header";
import { listGenres } from "@/lib/queries";

export const metadata = { title: "Add book" };

export default async function NewBookPage() {
  const genres = await listGenres();
  return (
    <div>
      <PageHeader title="Add a book" description="+XP and an achievement are waiting for your first one." />
      <BookForm genreSuggestions={genres.map((g) => g.name)} />
    </div>
  );
}
