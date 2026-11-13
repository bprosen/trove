/**
 * Achievement catalog. Shared between server (unlock detection) and client (rendering).
 *
 * Every achievement is a threshold on one lifetime metric from `stats.server.ts`. Unlocks are
 * stored permanently in `achievement_unlocks`, so deleting data later never takes one away.
 * Achievements must not depend on XP or level, because unlocking one awards XP.
 *
 * To add one, append to ACHIEVEMENTS — ids are stored in the database, so never rename an id.
 */
import type { MetricKey, Metrics } from "./stats.server";

export const TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_XP: Record<Tier, number> = { bronze: 25, silver: 50, gold: 100, platinum: 250 };

export const TIER_LABELS: Record<Tier, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };

export const CATEGORIES = ["library", "finishing", "reading", "streaks", "critic", "explorer", "secret"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  library: "Library",
  finishing: "Finishing",
  reading: "Pages & time",
  streaks: "Streaks & goals",
  critic: "Critic",
  explorer: "Explorer",
  secret: "Secret",
};

/** Icon keys, mapped to lucide components in the UI so this file stays React-free. */
export type AchievementIcon =
  | "book" | "library" | "books" | "folder" | "heart" | "check" | "medal" | "trophy" | "crown" | "weight"
  | "zap" | "target" | "users" | "layers" | "file" | "mountain" | "clock" | "hourglass" | "waves" | "timer"
  | "flame" | "calendar" | "sun" | "pen" | "newspaper" | "star" | "scroll" | "sparkles" | "compass" | "map"
  | "door" | "skull" | "undo" | "shuffle" | "rocket" | "infinity";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: Category;
  tier: Tier;
  icon: AchievementIcon;
  metric: MetricKey;
  target: number;
  /** Progress unit shown on locked cards, e.g. "pages". */
  unit: string;
  /** Hidden (name and description) until unlocked. */
  secret?: boolean;
};

const a = (
  id: string,
  name: string,
  description: string,
  category: Category,
  tier: Tier,
  icon: AchievementIcon,
  metric: MetricKey,
  target: number,
  unit: string,
  secret = false,
): Achievement => ({ id, name, description, category, tier, icon, metric, target, unit, secret });

export const ACHIEVEMENTS: Achievement[] = [
  // Library
  a("shelf-starter", "Shelf Starter", "Add your first book", "library", "bronze", "book", "booksAdded", 1, "books"),
  a("growing-shelf", "Growing Shelf", "Add 10 books to your library", "library", "silver", "library", "booksAdded", 10, "books"),
  a("personal-library", "Personal Library", "Add 50 books to your library", "library", "gold", "books", "booksAdded", 50, "books"),
  a("curator", "Curator", "Create a collection", "library", "bronze", "folder", "collections", 1, "collections"),
  a("soft-spot", "Soft Spot", "Mark 5 books as favorites", "library", "bronze", "heart", "favorites", 5, "favorites"),

  // Finishing
  a("the-end", "The End", "Finish your first book", "finishing", "bronze", "check", "booksFinished", 1, "books"),
  a("double-digits", "Double Digits", "Finish 10 books", "finishing", "silver", "medal", "booksFinished", 10, "books"),
  a("quarter-century", "Quarter Century", "Finish 25 books", "finishing", "gold", "trophy", "booksFinished", 25, "books"),
  a("centurion", "Centurion", "Finish 100 books", "finishing", "platinum", "crown", "booksFinished", 100, "books"),
  a("doorstopper", "Doorstopper", "Finish a book of 500+ pages", "finishing", "silver", "weight", "longestBookFinished", 500, "pages"),
  a("brick-lifter", "Brick Lifter", "Finish a book of 800+ pages", "finishing", "gold", "weight", "longestBookFinished", 800, "pages"),
  a("speed-reader", "Speed Reader", "Finish a book within a week of starting it", "finishing", "silver", "zap", "quickFinishes", 1, "books"),
  a("challenge-accepted", "Challenge Accepted", "Hit your yearly book goal", "finishing", "gold", "target", "yearGoalMet", 1, "goal"),
  a("well-connected", "Well Connected", "Finish books by 10 different authors", "finishing", "silver", "users", "authorsFinished", 10, "authors"),
  a("format-fluent", "Format Fluent", "Finish a physical book, an e-book and an audiobook", "finishing", "silver", "layers", "formatsFinished", 3, "formats"),

  // Pages & time
  a("first-session", "Opening Chapter", "Log your first reading session", "reading", "bronze", "book", "sessions", 1, "sessions"),
  a("habit-former", "Habit Former", "Log 50 reading sessions", "reading", "silver", "calendar", "sessions", 50, "sessions"),
  a("creature-of-habit", "Creature of Habit", "Log 250 reading sessions", "reading", "gold", "calendar", "sessions", 250, "sessions"),
  a("first-thousand", "First Thousand", "Read 1,000 pages", "reading", "bronze", "file", "pagesRead", 1_000, "pages"),
  a("ten-thousand", "Ten Thousand Pages", "Read 10,000 pages", "reading", "silver", "file", "pagesRead", 10_000, "pages"),
  a("paper-trail", "Paper Trail", "Read 50,000 pages", "reading", "gold", "scroll", "pagesRead", 50_000, "pages"),
  a("paper-mountain", "Paper Mountain", "Read 100,000 pages", "reading", "platinum", "mountain", "pagesRead", 100_000, "pages"),
  a("ten-hours", "Ten Hours In", "Read for 10 hours in total", "reading", "bronze", "clock", "minutesRead", 600, "min"),
  a("hundred-hours", "Hundred Hours", "Read for 100 hours in total", "reading", "gold", "hourglass", "minutesRead", 6_000, "min"),
  a("deep-dive", "Deep Dive", "Read 100 pages in one session", "reading", "silver", "waves", "maxPagesInSession", 100, "pages"),
  a("marathon", "Marathon Session", "Read for 3 hours in one session", "reading", "gold", "timer", "maxMinutesInSession", 180, "min"),
  a("binge-reader", "Binge Reader", "Read 200 pages in a single day", "reading", "gold", "rocket", "maxPagesInDay", 200, "pages"),

  // Streaks & goals
  a("warming-up", "Warming Up", "Read 3 days in a row", "streaks", "bronze", "flame", "longestStreak", 3, "days"),
  a("on-fire", "On Fire", "Read 7 days in a row", "streaks", "silver", "flame", "longestStreak", 7, "days"),
  a("unstoppable", "Unstoppable", "Read 30 days in a row", "streaks", "gold", "flame", "longestStreak", 30, "days"),
  a("eternal-flame", "Eternal Flame", "Read 100 days in a row", "streaks", "platinum", "infinity", "longestStreak", 100, "days"),
  a("goal-getter", "Goal Getter", "Hit your daily page goal", "streaks", "bronze", "target", "goalDays", 1, "days"),
  a("goal-machine", "Goal Machine", "Hit your daily page goal on 30 days", "streaks", "gold", "target", "goalDays", 30, "days"),
  a("weekend-warrior", "Weekend Warrior", "Read on 10 weekend days", "streaks", "bronze", "sun", "weekendDays", 10, "days"),

  // Critic
  a("critic", "Critic", "Write your first review", "critic", "bronze", "pen", "reviews", 1, "reviews"),
  a("columnist", "Columnist", "Write 10 reviews", "critic", "silver", "newspaper", "reviews", 10, "reviews"),
  a("essayist", "Essayist", "Write a review over 1,000 characters", "critic", "silver", "scroll", "longestReview", 1_000, "chars"),
  a("opinionated", "Opinionated", "Rate 10 books", "critic", "bronze", "star", "rated", 10, "ratings"),
  a("starstruck", "Starstruck", "Give 5 books a five-star rating", "critic", "silver", "sparkles", "fiveStars", 5, "books"),

  // Explorer
  a("genre-curious", "Genre Curious", "Read books from 3 genres", "explorer", "bronze", "compass", "genresExplored", 3, "genres"),
  a("genre-hopper", "Genre Hopper", "Read books from 10 genres", "explorer", "gold", "map", "genresExplored", 10, "genres"),

  // Secret
  a("lifes-too-short", "Life's Too Short", "Mark a book as did-not-finish", "secret", "bronze", "door", "dnf", 1, "books", true),
  a("harsh-critic", "Harsh Critic", "Give a book one star", "secret", "bronze", "skull", "oneStars", 1, "books", true),
  a("the-return", "The Return", "Read again after a break of 30+ days", "secret", "silver", "undo", "comebacks", 1, "times", true),
  a("juggler", "Juggler", "Read from 3 different books in one day", "secret", "silver", "shuffle", "maxBooksInDay", 3, "books", true),
];

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((x) => [x.id, x]));

/** Ids of every achievement whose threshold `metrics` meets. */
export function earnedIds(metrics: Metrics): string[] {
  return ACHIEVEMENTS.filter((x) => metrics[x.metric] >= x.target).map((x) => x.id);
}

/** Total bonus XP for a set of unlocked ids. Unknown ids (removed achievements) count as 0. */
export function achievementXp(ids: Iterable<string>): number {
  let xp = 0;
  for (const id of ids) {
    const x = ACHIEVEMENTS_BY_ID.get(id);
    if (x) xp += TIER_XP[x.tier];
  }
  return xp;
}

export type AchievementStatus = Achievement & {
  current: number;
  unlocked: boolean;
  unlockedAt: string | null;
  xp: number;
};

/** Merge the catalog with live metrics and stored unlocks for display. */
export function achievementStatuses(metrics: Metrics, unlocks: { id: string; unlocked_at: string }[]): AchievementStatus[] {
  const at = new Map(unlocks.map((u) => [u.id, u.unlocked_at]));
  return ACHIEVEMENTS.map((x) => ({
    ...x,
    current: Math.min(metrics[x.metric], x.target),
    unlocked: at.has(x.id),
    unlockedAt: at.get(x.id) ?? null,
    xp: TIER_XP[x.tier],
  }));
}
