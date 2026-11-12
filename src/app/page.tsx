import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookCover } from "@/components/trove/book-cover";
import { ReadingHeatmap } from "@/components/trove/heatmap";
import { LogSessionDialog } from "@/components/trove/log-session-dialog";
import { SampleDataButton } from "@/components/trove/sample-data-button";
import { SessionList } from "@/components/trove/session-list";
import { toSessionBooks } from "@/components/trove/session-books";
import {
  DailyGoalCard,
  LevelCard,
  QuestsCard,
  RecentAchievementsCard,
  StreakCard,
  YearGoalCard,
} from "@/components/trove/widgets";
import { listBooks, listSessions } from "@/lib/queries";
import { getStats } from "@/lib/stats";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function TodayPage() {
  const [stats, books, sessions] = await Promise.all([getStats(), listBooks(), listSessions({ limit: 5 })]);
  const reading = books.filter((b) => b.status === "reading");
  const sessionBooks = toSessionBooks(books);

  if (books.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-8" />
        </span>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Welcome to Trove</h1>
          <p className="text-muted-foreground">
            Your personal book registry. Track what you read, log sessions, write reviews, keep your streak alive, and
            unlock achievements along the way.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/books/new">
              <Plus /> Add your first book
            </Link>
          </Button>
          <SampleDataButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {greeting()}, {stats.settings.displayName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {stats.weekPages > 0
              ? `${stats.weekPages.toLocaleString()} pages in the last 7 days${
                  stats.lastWeekPages > 0
                    ? ` — ${stats.weekPages >= stats.lastWeekPages ? "up" : "down"} ${Math.abs(
                        Math.round(((stats.weekPages - stats.lastWeekPages) / stats.lastWeekPages) * 100),
                      )}% from the week before`
                    : ""
                }.`
              : "Pick up a book and log your first session of the week."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/books/new">
              <Plus /> Add book
            </Link>
          </Button>
          <LogSessionDialog books={sessionBooks} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StreakCard stats={stats} />
        <DailyGoalCard stats={stats} />
        <LevelCard stats={stats} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <QuestsCard stats={stats} />
        <Card>
          <CardHeader>
            <CardTitle>Continue reading</CardTitle>
            <CardDescription>
              {reading.length === 0 ? "Nothing in progress — start something from your shelf." : `${reading.length} in progress`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reading.length === 0 ? (
              <Button variant="outline" asChild>
                <Link href="/library?status=want">Browse want-to-read</Link>
              </Button>
            ) : (
              <ul className="space-y-4">
                {reading.slice(0, 4).map((b) => {
                  const pct = b.page_count ? Math.round((b.current_page / b.page_count) * 100) : null;
                  return (
                    <li key={b.id} className="flex items-center gap-4">
                      <Link href={`/books/${b.id}`} className="w-12 shrink-0">
                        <BookCover src={b.cover_url} title={b.title} author={b.author} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/books/${b.id}`} className="line-clamp-1 font-medium hover:underline">
                          {b.title}
                        </Link>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{b.author}</p>
                        {pct != null && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={pct} className="h-1.5" />
                            <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                              p. {b.current_page}/{b.page_count}
                            </span>
                          </div>
                        )}
                      </div>
                      <LogSessionDialog books={sessionBooks} defaultBookId={b.id}>
                        <Button size="sm" variant="secondary">
                          Log
                        </Button>
                      </LogSessionDialog>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your reading year</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadingHeatmap data={stats.heatmap} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <YearGoalCard stats={stats} />
        <RecentAchievementsCard stats={stats} />
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Recent sessions</CardTitle>
            <Link href="/sessions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <SessionList sessions={sessions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
