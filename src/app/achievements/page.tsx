import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AchievementIcon } from "@/components/trove/achievement-icon";
import { PageHeader } from "@/components/trove/page-header";
import { LevelCard } from "@/components/trove/widgets";
import { ACHIEVEMENTS, TIER_STYLES, TIER_XP, type Achievement } from "@/lib/achievements";
import { formatDate } from "@/lib/dates";
import { XP_RULES } from "@/lib/gamification";
import { getUnlocked } from "@/lib/queries";
import { getStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const metadata = { title: "Achievements" };

const CATEGORIES: Achievement["category"][] = ["Reading", "Consistency", "Collection", "Community", "Feats"];

export default async function AchievementsPage() {
  const [stats, unlocked] = await Promise.all([getStats(), getUnlocked()]);
  const total = ACHIEVEMENTS.length;

  return (
    <div className="space-y-8">
      <PageHeader title="Achievements" description={`${unlocked.size} of ${total} unlocked`} />

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <LevelCard stats={stats} />
        <Card>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <p className="col-span-2 mb-1 font-medium">How to earn XP</p>
            <span className="text-muted-foreground">Each page read</span>
            <span className="text-right">+{XP_RULES.perPage}</span>
            <span className="text-muted-foreground">Each minute read</span>
            <span className="text-right">+{XP_RULES.perMinute}</span>
            <span className="text-muted-foreground">Each session logged</span>
            <span className="text-right">+{XP_RULES.perSession}</span>
            <span className="text-muted-foreground">Each book finished</span>
            <span className="text-right">+{XP_RULES.perFinishedBook}</span>
            <span className="text-muted-foreground">Each review written</span>
            <span className="text-right">+{XP_RULES.perReview}</span>
            <span className="text-muted-foreground">Achievements</span>
            <span className="text-right">+{TIER_XP.bronze}–{TIER_XP.platinum}</span>
          </CardContent>
        </Card>
      </div>

      {CATEGORIES.map((cat) => {
        const defs = ACHIEVEMENTS.filter((a) => a.category === cat);
        const got = defs.filter((d) => unlocked.has(d.id)).length;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="flex items-baseline gap-2 font-heading text-xl font-semibold">
              {cat} <span className="text-sm font-normal text-muted-foreground">{got}/{defs.length}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {defs.map((def) => {
                const at = unlocked.get(def.id);
                const hidden = def.secret && !at;
                const current = Math.min(stats.metrics[def.metric], def.target);
                return (
                  <Card key={def.id} className={cn("gap-0 py-4 transition-colors", !at && "bg-muted/30")}>
                    <CardContent className="flex gap-3 px-4">
                      {hidden ? (
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground ring-2 ring-border">
                          <Lock className="size-5" />
                        </span>
                      ) : (
                        <AchievementIcon achievement={def} locked={!at} />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("font-medium", !at && "text-muted-foreground")}>{hidden ? "Secret achievement" : def.name}</p>
                          <span className={cn("shrink-0 text-xs font-medium", TIER_STYLES[def.tier].text)}>
                            {TIER_STYLES[def.tier].label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{hidden ? "Keep reading to discover it." : def.description}</p>
                        {at ? (
                          <p className="text-xs text-muted-foreground">
                            Unlocked {formatDate(at)} · +{TIER_XP[def.tier]} XP
                          </p>
                        ) : (
                          !hidden && (
                            <div className="flex items-center gap-2 pt-1">
                              <Progress value={(current / def.target) * 100} className="h-1.5" />
                              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                {current.toLocaleString()}/{def.target.toLocaleString()}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
