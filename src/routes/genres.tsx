import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenreChart } from "@/components/trove/charts";
import { GenreManager } from "@/components/trove/genre-manager";
import { PageHeader } from "@/components/trove/page-header";
import { getGenresPage } from "@/lib/data";

export const Route = createFileRoute("/genres")({
  loader: () => getGenresPage(),
  head: () => ({ meta: [{ title: "Genres · Trove" }] }),
  component: GenresPage,
});

function GenresPage() {
  const { genres, stats } = Route.useLoaderData();
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
