import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge, TIER_STYLES } from "@/components/trove/achievement-badge";
import { replayCelebration } from "@/components/trove/achievement-celebration";
import { PageHeader } from "@/components/trove/page-header";
import { Ring } from "@/components/trove/widgets";
import { CATEGORIES, CATEGORY_LABELS, TIER_LABELS, TIERS, type AchievementStatus } from "@/lib/achievements";
import { getAchievementsPage } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  loader: () => getAchievementsPage(),
  head: () => ({ meta: [{ title: "Achievements · Trove" }] }),
  component: AchievementsPage,
});

type Filter = "all" | "unlocked" | "locked";

/** `unlocked_at` is SQLite `datetime('now')`: UTC, "YYYY-MM-DD HH:MM:SS". */
function unlockedDate(s: string) {
  return new Date(`${s.replace(" ", "T")}Z`);
}

function formatUnlocked(s: string) {
  return unlockedDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const isNew = (a: AchievementStatus) => !!a.unlockedAt && Date.now() - unlockedDate(a.unlockedAt).getTime() < 86_400_000;

function AchievementsPage() {
  const { achievements, level } = Route.useLoaderData();
  const [filter, setFilter] = useState<Filter>("all");

  const unlocked = achievements.filter((a) => a.unlocked);
  const earnedXp = unlocked.reduce((s, a) => s + a.xp, 0);
  const recent = [...unlocked].sort((x, y) => (y.unlockedAt ?? "").localeCompare(x.unlockedAt ?? "")).slice(0, 6);
  const nextUp = achievements
    .filter((a) => !a.unlocked && !a.secret && a.current > 0)
    .sort((x, y) => y.current / y.target - x.current / x.target)
    .slice(0, 3);

  const visible = achievements.filter((a) => filter === "all" || (filter === "unlocked" ? a.unlocked : !a.unlocked));

  return (
    <div className="space-y-6">
      <PageHeader title="Achievements" description={`${unlocked.length} of ${achievements.length} unlocked · every unlock earns bonus XP.`} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <Ring value={unlocked.length / achievements.length} size={132} stroke={12}>
              <div>
                <p className="text-3xl font-semibold tabular-nums">{Math.round((unlocked.length / achievements.length) * 100)}%</p>
                <p className="text-xs text-muted-foreground">complete</p>
              </div>
            </Ring>
            <div className="w-full flex-1 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {TIERS.map((tier) => {
                  const all = achievements.filter((a) => a.tier === tier);
                  const got = all.filter((a) => a.unlocked).length;
                  return (
                    <div key={tier} className="flex flex-col items-center gap-1 text-center">
                      <AchievementBadge tier={tier} icon="trophy" size={40} locked={got === 0} />
                      <span className="text-sm font-semibold tabular-nums">
                        {got}/{all.length}
                      </span>
                      <span className="text-xs text-muted-foreground">{TIER_LABELS[tier]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="size-4 text-primary" /> Achievement XP
                </span>
                <span className="font-semibold tabular-nums">
                  {earnedXp.toLocaleString()} <span className="font-normal text-muted-foreground">· Lv {level.level} {level.title}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Almost there</CardTitle>
            <CardDescription>{nextUp.length ? "Your closest locked achievements" : "Start reading to make progress"}</CardDescription>
          </CardHeader>
          <CardContent>
            {nextUp.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a book or log a session and your progress shows up here.</p>
            ) : (
              <ul className="space-y-3">
                {nextUp.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <AchievementBadge tier={a.tier} icon={a.icon} size={36} locked />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{a.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {a.current.toLocaleString()}/{a.target.toLocaleString()} {a.unit}
                        </span>
                      </div>
                      <Progress value={(a.current / a.target) * 100} className="mt-1.5 h-1.5" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex gap-5 overflow-x-auto pb-1">
              {recent.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => replayCelebration([a.id])}
                    className="group flex w-20 flex-col items-center gap-1.5 text-center"
                    title="Replay unlock"
                  >
                    <AchievementBadge tier={a.tier} icon={a.icon} size={56} shine className="transition-transform group-hover:-translate-y-1 group-hover:scale-105" />
                    <span className="line-clamp-2 text-xs leading-tight font-medium">{a.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({achievements.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlocked.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({achievements.length - unlocked.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {filter === "unlocked" ? "Nothing unlocked yet — your first one is a book away." : "You've unlocked everything. Legendary."}
        </p>
      )}

      {CATEGORIES.map((cat) => {
        const items = visible.filter((a) => a.category === cat);
        if (items.length === 0) return null;
        const got = achievements.filter((a) => a.category === cat && a.unlocked).length;
        const total = achievements.filter((a) => a.category === cat).length;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="flex items-baseline gap-2 font-heading text-xl font-semibold">
              {CATEGORY_LABELS[cat]}
              <span className="font-sans text-sm font-normal text-muted-foreground tabular-nums">
                {got}/{total}
              </span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <AchievementCard key={a.id} a={a} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AchievementCard({ a }: { a: AchievementStatus }) {
  const hidden = !!a.secret && !a.unlocked;
  const style = TIER_STYLES[a.tier];
  return (
    <li
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-xl border bg-card p-4 transition-all",
        a.unlocked ? "hover:-translate-y-0.5 hover:shadow-lg" : "border-dashed",
      )}
    >
      {a.unlocked && (
        <div
          className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
          style={{ background: style.glow }}
        />
      )}
      <AchievementBadge
        tier={a.tier}
        icon={a.icon}
        size={60}
        locked={!a.unlocked}
        hidden={hidden}
        shine={a.unlocked && (a.tier === "gold" || a.tier === "platinum")}
        className={cn(a.unlocked && "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6")}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate font-semibold", !a.unlocked && "text-muted-foreground")}>{hidden ? "???" : a.name}</p>
          {isNew(a) && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">New</span>}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{hidden ? "A secret achievement. Keep reading to discover it." : a.description}</p>
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          <span className={cn("font-medium", a.unlocked ? style.text : "text-muted-foreground")}>
            {TIER_LABELS[a.tier]} · {a.xp} XP
          </span>
          {a.unlocked && a.unlockedAt ? (
            <span className="text-muted-foreground">{formatUnlocked(a.unlockedAt)}</span>
          ) : (
            !hidden && (
              <span className="text-muted-foreground tabular-nums">
                {a.current.toLocaleString()}/{a.target.toLocaleString()} {a.unit}
              </span>
            )
          )}
        </div>
        {!a.unlocked && !hidden && <Progress value={(a.current / a.target) * 100} className="h-1" />}
      </div>
      {a.unlocked && (
        <button
          type="button"
          onClick={() => replayCelebration([a.id])}
          className="absolute top-2 right-2 grid size-7 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
          aria-label={`Replay ${a.name} unlock`}
          title="Replay unlock"
        >
          <Play className="size-3.5" />
        </button>
      )}
      {!a.unlocked && hidden && <Trophy className="absolute right-3 bottom-3 size-4 text-muted-foreground/30" aria-hidden />}
    </li>
  );
}
