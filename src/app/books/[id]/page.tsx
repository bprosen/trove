import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar, Clock, Gauge, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookMenu, CollectionsPopover, FavoriteButton, StatusSelect } from "@/components/trove/book-actions";
import { BookCover } from "@/components/trove/book-cover";
import { LogSessionDialog } from "@/components/trove/log-session-dialog";
import { ReviewEditor } from "@/components/trove/review-editor";
import { SessionList } from "@/components/trove/session-list";
import { StarRating } from "@/components/trove/star-rating";
import { StatusBadge } from "@/components/trove/status-badge";
import { StatTile } from "@/components/trove/widgets";
import { daysBetween, formatDate, today } from "@/lib/dates";
import { collectionIdsForBook, getBook, getReview, listCollections, listSessions } from "@/lib/queries";
import { FORMAT_LABELS } from "@/lib/types";

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const { id: raw } = await params;
  const id = Number(raw);
  const book = Number.isInteger(id) ? await getBook(id) : null;
  if (!book) notFound();

  const [review, sessions, collections, memberOf] = await Promise.all([
    getReview(id),
    listSessions({ bookId: id }),
    listCollections(),
    collectionIdsForBook(id),
  ]);

  const minutes = sessions.reduce((s, x) => s + x.minutes, 0);
  const pagesLogged = sessions.reduce((s, x) => s + x.pages, 0);
  const timedPages = sessions.filter((s) => s.minutes > 0).reduce((s, x) => s + x.pages, 0);
  const timedMinutes = sessions.filter((s) => s.pages > 0).reduce((s, x) => s + x.minutes, 0);
  const pagesPerHour = timedMinutes > 0 ? Math.round((timedPages / timedMinutes) * 60) : null;
  const pct = book.page_count ? Math.min(100, Math.round((book.current_page / book.page_count) * 100)) : null;

  // Estimate finish date from the average pace since starting.
  let eta: string | null = null;
  if (book.status === "reading" && book.page_count && book.started_at && pagesLogged > 0) {
    const elapsed = Math.max(1, daysBetween(book.started_at, today()) + 1);
    const perDay = pagesLogged / elapsed;
    const remaining = book.page_count - book.current_page;
    if (perDay > 0 && remaining > 0) eta = `~${Math.ceil(remaining / perDay)} days at your current pace`;
  }

  return (
    <div className="space-y-8">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Library
      </Link>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="mx-auto w-44 md:w-full">
          <BookCover src={book.cover_url} title={book.title} author={book.author} className="shadow-xl" />
        </div>
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={book.status} />
              <Badge variant="outline">{FORMAT_LABELS[book.format]}</Badge>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">{book.title}</h1>
            <p className="text-lg text-muted-foreground">{book.author || "Unknown author"}</p>
            <p className="text-sm text-muted-foreground">
              {[
                book.page_count && `${book.page_count} pages`,
                book.published_year && `Published ${book.published_year}`,
                book.isbn && `ISBN ${book.isbn}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {book.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {book.genres.map((g) => (
                  <Link key={g.id} href={`/library?genre=${g.id}`}>
                    <Badge variant="secondary" className="hover:bg-accent">
                      {g.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <StarRating key={book.rating ?? 0} bookId={book.id} rating={book.rating} />

          <div className="flex flex-wrap items-center gap-2">
            <StatusSelect book={book} />
            <LogSessionDialog books={[book]} defaultBookId={book.id}>
              <Button>
                <Timer /> Log session
              </Button>
            </LogSessionDialog>
            <CollectionsPopover bookId={book.id} collections={collections} memberOf={memberOf} />
            <FavoriteButton book={book} />
            <BookMenu book={book} />
          </div>

          {pct != null && book.status !== "want" && (
            <div className="max-w-md space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>
                  Page {book.current_page} of {book.page_count}
                </span>
                <span className="font-medium tabular-nums">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
              {eta && <p className="text-xs text-muted-foreground">{eta}</p>}
            </div>
          )}

          {book.description && <p className="max-w-prose leading-relaxed whitespace-pre-wrap text-muted-foreground">{book.description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={BookOpen} label="Sessions" value={sessions.length} />
        <StatTile icon={Clock} label="Time read" value={minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`} />
        <StatTile icon={Gauge} label="Pace" value={pagesPerHour ? `${pagesPerHour}` : "—"} hint={pagesPerHour ? "pages / hour" : undefined} />
        <StatTile
          icon={Calendar}
          label={book.finished_at ? "Finished" : "Started"}
          value={<span className="text-lg">{formatDate(book.finished_at ?? book.started_at) || "—"}</span>}
          hint={book.started_at && book.finished_at ? `${daysBetween(book.started_at, book.finished_at) + 1} days to read` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewEditor key={review?.updated_at ?? "new"} bookId={book.id} review={review} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reading log</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionList sessions={sessions} showBook={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
