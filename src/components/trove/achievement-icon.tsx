import {
  BookCheck,
  BookPlus,
  Brain,
  CalendarCheck,
  Compass,
  DoorOpen,
  FileText,
  Flame,
  FolderHeart,
  Heart,
  Library,
  Mountain,
  PenLine,
  Rabbit,
  Star,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { TIER_STYLES, type Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";

const ICONS: Record<Achievement["icon"], LucideIcon> = {
  "book-plus": BookPlus,
  library: Library,
  "book-check": BookCheck,
  trophy: Trophy,
  "file-text": FileText,
  flame: Flame,
  timer: Timer,
  "pen-line": PenLine,
  star: Star,
  compass: Compass,
  "folder-heart": FolderHeart,
  heart: Heart,
  zap: Zap,
  mountain: Mountain,
  rabbit: Rabbit,
  target: Target,
  users: Users,
  "door-open": DoorOpen,
  "calendar-check": CalendarCheck,
  brain: Brain,
};

export function AchievementIcon({
  achievement,
  locked = false,
  className,
}: {
  achievement: Achievement;
  locked?: boolean;
  className?: string;
}) {
  const Icon = ICONS[achievement.icon];
  const tier = TIER_STYLES[achievement.tier];
  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full ring-2",
        locked ? "bg-muted text-muted-foreground/50 ring-border" : [tier.bg, tier.ring, tier.text],
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}
