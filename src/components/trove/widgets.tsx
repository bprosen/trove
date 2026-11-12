import Link from "next/link";
import { Check, Flame, Sparkles, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ACHIEVEMENTS_BY_ID, TIER_STYLES } from "@/lib/achievements";
import { parseISODate } from "@/lib/dates";
import type { Quest, Stats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { AchievementIcon } from "./achievement-icon";

export function Ring({ value, size = 112, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cn("transition-[stroke-dashoffset] duration-700", v >= 1 ? "stroke-emerald-500" : "stroke-primary")}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function StreakCard({ stats }: { stats: Stats }) {
  const { currentStreak, longestStreak, streakAtRisk } = stats;
  const readToday = stats.todayPages > 0 || stats.todayMinutes > 0;
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-orange-500/10 blur-2xl" />
      <CardHeader>
        <CardDescription>Reading streak</CardDescription>
        <CardTitle className="flex items-baseline gap-2 text-4xl font-semibold tabular-nums">
          <Flame className={cn("size-8 self-center", currentStreak > 0 ? "fill-orange-500/30 text-orange-500" : "text-muted-foreground")} />
          {currentStreak}
          <span className="text-base font-normal text-muted-foreground">day{currentStreak === 1 ? "" : "s"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className={cn(streakAtRisk ? "font-medium text-orange-600 dark:text-orange-400" : "text-muted-foreground")}>
          {readToday
            ? "You've read today — streak secured."
            : streakAtRisk
              ? "Read today to keep your streak alive!"
              : "Log a session to start a new streak."}
        </p>
        <p className="text-muted-foreground">Best: {longestStreak} days</p>
      </CardContent>
    </Card>
  );
}

export function DailyGoalCard({ stats }: { stats: Stats }) {
  const goal = stats.settings.dailyPageGoal;
  const value = stats.todayPages / goal;
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Target className="size-4" /> Today&apos;s goal
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <Ring value={value}>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{stats.todayPages}</p>
            <p className="text-xs text-muted-foreground">of {goal} pages</p>
          </div>
        </Ring>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{value >= 1 ? "Goal smashed! 🎯" : `${Math.max(0, goal - stats.todayPages)} pages to go`}</p>
          <p className="text-muted-foreground">{stats.todayMinutes} min read today</p>
          <p className="text-muted-foreground">Goal hit on {stats.metrics.goalDays} days</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LevelCard({ stats }: { stats: Stats }) {
  const { level } = stats;
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Sparkles className="size-4" /> Level {level.level}
        </CardDescription>
        <CardTitle className="font-heading text-2xl">{level.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={level.progress * 100} className="h-2.5" />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{level.xp.toLocaleString()} XP total</span>
          <span>{(level.xpForNext - level.xpIntoLevel).toLocaleString()} XP to Lv {level.level + 1}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestRow({ q }: { q: Quest }) {
  const done = q.current >= q.target;
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border",
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30",
        )}
      >
        {done && <Check className="size-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className={cn(done && "text-muted-foreground line-through")}>{q.label}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {Math.min(q.current, q.target)}/{q.target} {q.unit}
          </span>
        </div>
        <Progress value={Math.min(100, (q.current / q.target) * 100)} className="mt-1.5 h-1.5" />
      </div>
    </li>
  );
}

export function QuestsCard({ stats }: { stats: Stats }) {
  const done = stats.quests.filter((q) => q.current >= q.target).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily quests</CardTitle>
        <CardDescription>
          {done === stats.quests.length ? "All done — come back tomorrow for new quests!" : `${done} of ${stats.quests.length} complete · resets at midnight`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {stats.quests.map((q) => (
            <QuestRow key={q.id} q={q} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function YearGoalCard({ stats }: { stats: Stats }) {
  const goal = stats.settings.yearlyBookGoal;
  const done = stats.finishedThisYear;
  const now = parseISODate(stats.today);
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  const expected = Math.floor(goal * yearProgress);
  const delta = done - expected;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{now.getFullYear()} reading challenge</CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {done} <span className="text-base font-normal text-muted-foreground">/ {goal} books</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={Math.min(100, (done / goal) * 100)} className="h-2.5" />
        <p className="text-sm text-muted-foreground">
          {done >= goal
            ? "Challenge complete! 🏆"
            : delta >= 0
              ? `${delta === 0 ? "Right on" : `${delta} book${delta === 1 ? "" : "s"} ahead of`} schedule`
              : `${-delta} book${delta === -1 ? "" : "s"} behind schedule`}
        </p>
      </CardContent>
    </Card>
  );
}

export function RecentAchievementsCard({ stats }: { stats: Stats }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            {stats.unlockedCount} unlocked · +{stats.achievementXp.toLocaleString()} XP
          </CardDescription>
        </div>
        <Link href="/achievements" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {stats.recentUnlocks.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="size-4" /> Add a book to unlock your first achievement.
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.recentUnlocks.map(({ id }) => {
              const def = ACHIEVEMENTS_BY_ID.get(id)!;
              return (
                <li key={id} className="flex items-center gap-3">
                  <AchievementIcon achievement={def} className="size-9" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{def.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {TIER_STYLES[def.tier].label} · {def.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StatTile({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="space-y-1 px-4">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {Icon && <Icon className="size-4" />}
          {label}
        </p>
        <p className="text-2xl font-semibold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
