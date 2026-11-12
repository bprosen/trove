import { BookCheck, Clock, FileText, Flame, Library, PenLine, Star, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenreChart, MonthlyFinishedChart, PagesPerDayChart, RatingChart, WeekdayChart } from "@/components/trove/charts";
import { ReadingHeatmap } from "@/components/trove/heatmap";
import { PageHeader } from "@/components/trove/page-header";
import { StatTile } from "@/components/trove/widgets";
import { getStats } from "@/lib/stats";

export const metadata = { title: "Stats" };

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function StatsPage() {
  const s = await getStats();
  const m = s.metrics;
  const hours = Math.round(m.minutesRead / 60);
  const bestDay = s.weekday.reduce((a, b) => (b.pages > a.pages ? b : a), s.weekday[0]);
  const ratedTotal = s.ratingDistribution.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Stats" description="Your reading life, by the numbers." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Library} label="Books in library" value={m.booksAdded} />
        <StatTile icon={BookCheck} label="Books finished" value={m.booksFinished} hint={`${s.finishedThisYear} this year`} />
        <StatTile icon={FileText} label="Pages read" value={m.pagesRead.toLocaleString()} />
        <StatTile icon={Clock} label="Hours read" value={hours.toLocaleString()} />
        <StatTile icon={Flame} label="Longest streak" value={`${m.longestStreak} days`} hint={`Current: ${s.currentStreak}`} />
        <StatTile icon={Star} label="Average rating" value={s.avgRating ? s.avgRating.toFixed(1) : "—"} hint={`${m.rated} rated`} />
        <StatTile icon={PenLine} label="Reviews" value={m.reviews} />
        <StatTile icon={Users} label="Authors finished" value={m.authorsFinished} />
      </div>

      <ChartCard title="Reading calendar">
        <ReadingHeatmap data={s.heatmap} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pages per day" description="Last 30 days">
          <PagesPerDayChart data={s.last30} />
        </ChartCard>
        <ChartCard title={`Books finished in ${s.today.slice(0, 4)}`} description={`${s.finishedThisYear} of ${s.settings.yearlyBookGoal} goal`}>
          <MonthlyFinishedChart data={s.monthlyFinished} />
        </ChartCard>
        <ChartCard title="Genres" description="Books you're reading or have finished">
          {s.genreBreakdown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Tag books with genres to see your mix.</p>
          ) : (
            <GenreChart data={s.genreBreakdown} />
          )}
        </ChartCard>
        <div className="grid gap-4">
          <ChartCard title="When you read" description={bestDay.pages > 0 ? `${bestDay.day} is your biggest reading day` : "Total pages by weekday"}>
            <WeekdayChart data={s.weekday} />
          </ChartCard>
          <ChartCard title="Ratings" description={ratedTotal ? `${ratedTotal} books rated` : "Rate books to see your distribution"}>
            <RatingChart data={s.ratingDistribution} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
