import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenreChart } from "@/components/trove/charts";
import { GenreManager } from "@/components/trove/genre-manager";
import { PageHeader } from "@/components/trove/page-header";
import { listGenres } from "@/lib/queries";
import { getStats } from "@/lib/stats";

export const metadata = { title: "Genres" };

export default async function GenresPage() {
  const [genres, stats] = await Promise.all([listGenres(), getStats()]);
  const explored = stats.metrics.genresExplored;
  return (
    <div className="space-y-6">
      <PageHeader title="Genres" description={`You've explored ${explored} genre${explored === 1 ? "" : "s"}. Finish books in a genre to rank up your mastery.`} />
      {stats.genreBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your genre mix</CardTitle>
            <CardDescription>Books you&apos;re reading or have finished</CardDescription>
          </CardHeader>
          <CardContent>
            <GenreChart data={stats.genreBreakdown} />
          </CardContent>
        </Card>
      )}
      <GenreManager genres={genres} />
    </div>
  );
}
