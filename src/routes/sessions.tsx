import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MinutesPerDayChart, PagesPerDayChart } from "@/components/trove/charts";
import { LogSessionDialog } from "@/components/trove/log-session-dialog";
import { PageHeader } from "@/components/trove/page-header";
import { SessionList } from "@/components/trove/session-list";
import { toSessionBooks } from "@/components/trove/session-books";
import { getSessionsPage } from "@/lib/data";

export const Route = createFileRoute("/sessions")({
  loader: () => getSessionsPage(),
  head: () => ({ meta: [{ title: "Sessions · Trove" }] }),
  component: SessionsPage,
});

function SessionsPage() {
  const { sessions, books, stats } = Route.useLoaderData();
  const last30Pages = stats.last30.reduce((s, d) => s + d.pages, 0);
  const last30Minutes = stats.last30.reduce((s, d) => s + d.minutes, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Reading sessions" description={`${stats.metrics.sessions} sessions logged · ${stats.metrics.readingDays} reading days`}>
        <LogSessionDialog books={toSessionBooks(books)} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pages per day</CardTitle>
            <CardDescription>{last30Pages.toLocaleString()} pages in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <PagesPerDayChart data={stats.last30} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Minutes per day</CardTitle>
            <CardDescription>{Math.round(last30Minutes / 60)} hours in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <MinutesPerDayChart data={stats.last30} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionList sessions={sessions} />
        </CardContent>
      </Card>
    </div>
  );
}
