import Link from "next/link";
import { FolderHeart } from "lucide-react";
import { BookCover } from "@/components/trove/book-cover";
import { CollectionDialog } from "@/components/trove/collection-dialog";
import { PageHeader } from "@/components/trove/page-header";
import { listCollections } from "@/lib/queries";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <div>
      <PageHeader title="Collections" description="Curate shelves for any mood, theme, or challenge.">
        <CollectionDialog />
      </PageHeader>
      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <FolderHeart className="size-8" />
          <p>No collections yet. Create one to unlock the Curator achievement.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`} className="group rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-32 items-end justify-center gap-1 overflow-hidden rounded-lg bg-muted/60 px-4 pt-4">
                {c.covers.length === 0 ? (
                  <FolderHeart className="mb-10 size-8 text-muted-foreground" />
                ) : (
                  c.covers.map((src, i) => (
                    <div key={i} className="w-16 translate-y-4 transition-transform group-hover:translate-y-2" style={{ transitionDelay: `${i * 40}ms` }}>
                      <BookCover src={src} title={c.name} />
                    </div>
                  ))
                )}
              </div>
              <p className="font-heading text-lg font-semibold">{c.name}</p>
              <p className="text-sm text-muted-foreground">
                {c.book_count} book{c.book_count === 1 ? "" : "s"}
                {c.description && ` · ${c.description}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
