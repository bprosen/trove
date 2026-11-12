import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { getStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

export async function HeaderStats() {
  const s = await getStats();
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        title={s.streakAtRisk ? "Read today to keep your streak alive!" : "Current reading streak"}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium tabular-nums",
          s.currentStreak > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground",
          s.streakAtRisk && "animate-pulse border-orange-400/60",
        )}
      >
        <Flame className={cn("size-4", s.currentStreak > 0 && "fill-orange-500/30")} />
        {s.currentStreak}
        <span className="sr-only">day streak</span>
      </Link>
      <Link
        href="/achievements"
        className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
        title={`${s.level.xpIntoLevel} / ${s.level.xpForNext} XP to level ${s.level.level + 1}`}
      >
        <Sparkles className="size-4 text-primary" />
        <span className="font-medium">Lv {s.level.level}</span>
        <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round(s.level.progress * 100)}%` }} />
        </span>
      </Link>
    </div>
  );
}

export function HeaderStatsFallback() {
  return <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />;
}
