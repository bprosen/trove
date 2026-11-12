import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/trove/page-header";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements · Trove" }] }),
  component: AchievementsPage,
});

const ACHIEVEMENTS = [
  { id: "first-book", name: "Shelf Starter", description: "Add your first book", unlocked: true },
  { id: "first-finish", name: "The End", description: "Finish your first book", unlocked: true },
  { id: "streak-7", name: "On Fire", description: "Read 7 days in a row", unlocked: false },
  { id: "review-1", name: "Critic", description: "Write your first review", unlocked: false },
];

function AchievementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Achievements" />
      <ul className="space-y-2">
        {ACHIEVEMENTS.map((a) => (
          <li key={a.id} className="rounded-md border p-3">
            <p className="font-medium">{a.name}</p>
            <p className="text-sm text-muted-foreground">{a.description}</p>
            <p className="text-xs text-muted-foreground">{a.unlocked ? "Unlocked" : "Locked"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
