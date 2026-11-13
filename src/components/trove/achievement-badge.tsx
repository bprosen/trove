import {
  BookCheck, BookOpen, CalendarCheck, Clock, Compass, Crown, DoorOpen, FileText, Flame, FolderHeart, Heart,
  Hourglass, Infinity as InfinityIcon, Layers, Library, LibraryBig, Lock, Map as MapIcon, Medal, Mountain,
  Newspaper, PenLine, Rocket, ScrollText, Shuffle, Skull, Sparkles, Star, Sun, Target, Timer, Trophy, Undo2,
  Users, Waves, Weight, Zap, type LucideIcon,
} from "lucide-react";
import type { AchievementIcon, Tier } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export const ACHIEVEMENT_ICONS: Record<AchievementIcon, LucideIcon> = {
  book: BookOpen, library: Library, books: LibraryBig, folder: FolderHeart, heart: Heart, check: BookCheck,
  medal: Medal, trophy: Trophy, crown: Crown, weight: Weight, zap: Zap, target: Target, users: Users,
  layers: Layers, file: FileText, mountain: Mountain, clock: Clock, hourglass: Hourglass, waves: Waves,
  timer: Timer, flame: Flame, calendar: CalendarCheck, sun: Sun, pen: PenLine, newspaper: Newspaper, star: Star,
  scroll: ScrollText, sparkles: Sparkles, compass: Compass, map: MapIcon, door: DoorOpen, skull: Skull,
  undo: Undo2, shuffle: Shuffle, rocket: Rocket, infinity: InfinityIcon,
};

/** Per-tier colors: medallion gradient, glow, and confetti palette. */
export const TIER_STYLES: Record<Tier, { ring: string; disc: string; glow: string; text: string; confetti: string[] }> = {
  bronze: {
    ring: "linear-gradient(135deg, #f0b27a 0%, #b8682f 45%, #7a3f17 100%)",
    disc: "radial-gradient(circle at 30% 25%, #d98a4e, #8f4c1f 70%)",
    glow: "#e08a45",
    text: "text-orange-700 dark:text-orange-300",
    confetti: ["#f0b27a", "#c97a3d", "#8f4c1f", "#ffd9b0"],
  },
  silver: {
    ring: "linear-gradient(135deg, #ffffff 0%, #b9c2ce 45%, #6b7686 100%)",
    disc: "radial-gradient(circle at 30% 25%, #c9d1db, #6f7b8c 70%)",
    glow: "#b4c4d8",
    text: "text-slate-600 dark:text-slate-300",
    confetti: ["#ffffff", "#d5dbe3", "#9aa6b5", "#6b7686"],
  },
  gold: {
    ring: "linear-gradient(135deg, #fff3b0 0%, #f2c230 40%, #a86e00 100%)",
    disc: "radial-gradient(circle at 30% 25%, #f7d354, #b07a05 70%)",
    glow: "#f5c518",
    text: "text-amber-600 dark:text-amber-300",
    confetti: ["#fff3b0", "#f7d046", "#e0a800", "#ffffff"],
  },
  platinum: {
    ring: "conic-gradient(from 210deg, #a5f3fc, #818cf8, #f0abfc, #fde68a, #a5f3fc)",
    disc: "radial-gradient(circle at 30% 25%, #8b9cf7, #4c3fb3 75%)",
    glow: "#a78bfa",
    text: "text-violet-600 dark:text-violet-300",
    confetti: ["#a5f3fc", "#818cf8", "#f0abfc", "#fde68a", "#ffffff"],
  },
};

type BadgeProps = {
  tier: Tier;
  icon: AchievementIcon;
  locked?: boolean;
  /** Locked secret achievements hide their icon. */
  hidden?: boolean;
  size?: number;
  /** Animated light sweep across the medallion. */
  shine?: boolean;
  className?: string;
};

/** Round medallion: tier-colored rim, embossed disc, icon in the middle. */
export function AchievementBadge({ tier, icon, locked, hidden, size = 64, shine, className }: BadgeProps) {
  const style = TIER_STYLES[tier];
  const Icon = hidden ? Lock : ACHIEVEMENT_ICONS[icon];
  const rim = Math.max(3, Math.round(size * 0.08));
  return (
    <div
      className={cn("relative shrink-0 rounded-full", locked && "opacity-60 grayscale", className)}
      style={{
        width: size,
        height: size,
        padding: rim,
        background: locked ? "var(--muted)" : style.ring,
        boxShadow: locked ? undefined : `0 ${size * 0.06}px ${size * 0.25}px -${size * 0.08}px ${style.glow}`,
      }}
      aria-hidden
    >
      <div
        className="relative grid size-full place-items-center overflow-hidden rounded-full"
        style={{
          background: locked ? "var(--secondary)" : style.disc,
          boxShadow: "inset 0 2px 4px rgb(255 255 255 / 0.35), inset 0 -3px 6px rgb(0 0 0 / 0.3)",
        }}
      >
        <Icon
          className={cn(locked ? "text-muted-foreground" : "text-white drop-shadow-[0_1px_1px_rgb(0_0_0_/_0.45)]")}
          style={{ width: size * 0.42, height: size * 0.42 }}
          strokeWidth={2.2}
        />
        {shine && !locked && (
          <span className="ach-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-transparent via-white/60 to-transparent" />
        )}
      </div>
    </div>
  );
}
