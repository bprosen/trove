import Link from "next/link";
import { Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Book } from "@/lib/types";
import { BookCover } from "./book-cover";
import { StarDisplay } from "./star-rating";
import { StatusBadge } from "./status-badge";

export function BookCard({ book }: { book: Book }) {
  const pct = book.status === "reading" && book.page_count ? Math.round((book.current_page / book.page_count) * 100) : null;
  return (
    <Link href={`/books/${book.id}`} className="group flex flex-col gap-2">
      <div className="relative transition-transform duration-200 group-hover:-translate-y-1">
        <BookCover src={book.cover_url} title={book.title} author={book.author} className="shadow-md group-hover:shadow-lg" />
        {book.favorite && (
          <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-background/90 shadow">
            <Heart className="size-3.5 fill-rose-500 text-rose-500" />
          </span>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium">{book.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author || "Unknown author"}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {book.status !== "finished" || !book.rating ? <StatusBadge status={book.status} /> : <StarDisplay rating={book.rating} />}
        </div>
        {pct != null && <Progress value={pct} className="h-1" />}
      </div>
    </Link>
  );
}

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
