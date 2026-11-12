import Link from "next/link";
import { PenLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BookCover } from "@/components/trove/book-cover";
import { PageHeader } from "@/components/trove/page-header";
import { SpoilerText } from "@/components/trove/review-editor";
import { StarDisplay } from "@/components/trove/star-rating";
import { formatDate } from "@/lib/dates";
import { listReviews } from "@/lib/queries";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const reviews = await listReviews();
  return (
    <div>
      <PageHeader title="Reviews" description={`${reviews.length} review${reviews.length === 1 ? "" : "s"} written`} />
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <PenLine className="size-8" />
          <p>Open any book and write a review to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex gap-4">
                <Link href={`/books/${r.book.id}`} className="w-16 shrink-0 sm:w-20">
                  <BookCover src={r.book.cover_url} title={r.book.title} author={r.book.author} />
                </Link>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <Link href={`/books/${r.book.id}`} className="font-medium hover:underline">
                      {r.book.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{r.book.author}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={r.book.rating} />
                    <span className="text-xs text-muted-foreground">{formatDate(r.updated_at)}</span>
                  </div>
                  {r.headline && <p className="font-heading text-lg font-semibold">{r.headline}</p>}
                  <SpoilerText text={r.body} spoiler={r.contains_spoilers} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
