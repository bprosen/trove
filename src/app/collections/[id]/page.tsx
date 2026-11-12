import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookCard } from "@/components/trove/book-card";
import { CollectionToolbar, RemoveFromCollection } from "@/components/trove/collection-manage";
import { PageHeader } from "@/components/trove/page-header";
import { getCollection, listBooks } from "@/lib/queries";

export default async function CollectionPage({ params }: PageProps<"/collections/[id]">) {
  const { id } = await params;
  const [collection, all] = await Promise.all([getCollection(Number(id)), listBooks({ sort: "title" })]);
  if (!collection) notFound();
  const inside = new Set(collection.books.map((b) => b.id));
  const addable = all.filter((b) => !inside.has(b.id)).map((b) => ({ id: b.id, title: b.title }));

  return (
    <div className="space-y-6">
      <Link href="/collections" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Collections
      </Link>
      <PageHeader title={collection.name} description={collection.description ?? `${collection.book_count} books`}>
        <CollectionToolbar collection={collection} addable={addable} />
      </PageHeader>
      {collection.books.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          This collection is empty. Use “Add a book…” to start filling it.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {collection.books.map((b) => (
            <div key={b.id} className="group/item relative">
              <RemoveFromCollection collectionId={collection.id} bookId={b.id} />
              <BookCard book={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
