/**
 * Achievement catalog. Shared by server (unlock checks) and client (rendering, toasts).
 * Every achievement is "metric >= target", so progress is always displayable.
 */

export type MetricKey =
  | "booksAdded"
  | "booksFinished"
  | "pagesRead"
  | "minutesRead"
  | "sessions"
  | "longestStreak"
  | "reviews"
  | "rated"
  | "genresExplored"
  | "collections"
  | "favorites"
  | "maxPagesInSession"
  | "maxMinutesInSession"
  | "longestBookFinished"
  | "quickFinishes"
  | "goalDays"
  | "authorsFinished"
  | "dnf"
  | "readingDays";

export type Metrics = Record<MetricKey, number>;

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export const TIER_XP: Record<Tier, number> = { bronze: 25, silver: 75, gold: 200, platinum: 500 };

export type AchievementIcon =
  | "book-plus"
  | "library"
  | "book-check"
  | "trophy"
  | "file-text"
  | "flame"
  | "timer"
  | "pen-line"
  | "star"
  | "compass"
  | "folder-heart"
  | "heart"
  | "zap"
  | "mountain"
  | "rabbit"
  | "target"
  | "users"
  | "door-open"
  | "calendar-check"
  | "brain";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: "Collection" | "Reading" | "Consistency" | "Community" | "Feats";
  tier: Tier;
  icon: AchievementIcon;
  metric: MetricKey;
  target: number;
  /** Hidden achievements show as "???" until unlocked. */
  secret?: boolean;
};

const a = (x: Achievement) => x;

export const ACHIEVEMENTS: Achievement[] = [
  // Collection
  a({ id: "first-book", name: "Once Upon a Time", description: "Add your first book", category: "Collection", tier: "bronze", icon: "book-plus", metric: "booksAdded", target: 1 }),
  a({ id: "shelf-10", name: "Shelf Starter", description: "Add 10 books to your library", category: "Collection", tier: "bronze", icon: "library", metric: "booksAdded", target: 10 }),
  a({ id: "shelf-50", name: "Home Library", description: "Add 50 books to your library", category: "Collection", tier: "silver", icon: "library", metric: "booksAdded", target: 50 }),
  a({ id: "shelf-200", name: "The Great Library", description: "Add 200 books to your library", category: "Collection", tier: "gold", icon: "library", metric: "booksAdded", target: 200 }),
  a({ id: "curator-1", name: "Curator", description: "Create a collection", category: "Collection", tier: "bronze", icon: "folder-heart", metric: "collections", target: 1 }),
  a({ id: "curator-5", name: "Master Curator", description: "Create 5 collections", category: "Collection", tier: "silver", icon: "folder-heart", metric: "collections", target: 5 }),
  a({ id: "favorites-5", name: "Heart on the Shelf", description: "Mark 5 books as favorites", category: "Collection", tier: "bronze", icon: "heart", metric: "favorites", target: 5 }),

  // Reading
  a({ id: "finish-1", name: "The End", description: "Finish your first book", category: "Reading", tier: "bronze", icon: "book-check", metric: "booksFinished", target: 1 }),
  a({ id: "finish-10", name: "Decathlon", description: "Finish 10 books", category: "Reading", tier: "silver", icon: "book-check", metric: "booksFinished", target: 10 }),
  a({ id: "finish-50", name: "Half Century", description: "Finish 50 books", category: "Reading", tier: "gold", icon: "trophy", metric: "booksFinished", target: 50 }),
  a({ id: "finish-100", name: "Centurion", description: "Finish 100 books", category: "Reading", tier: "platinum", icon: "trophy", metric: "booksFinished", target: 100 }),
  a({ id: "pages-1k", name: "Thousand Pages", description: "Read 1,000 pages", category: "Reading", tier: "bronze", icon: "file-text", metric: "pagesRead", target: 1_000 }),
  a({ id: "pages-10k", name: "Ten Thousand Pages", description: "Read 10,000 pages", category: "Reading", tier: "silver", icon: "file-text", metric: "pagesRead", target: 10_000 }),
  a({ id: "pages-50k", name: "Paper Mountain", description: "Read 50,000 pages", category: "Reading", tier: "gold", icon: "mountain", metric: "pagesRead", target: 50_000 }),
  a({ id: "hours-10", name: "Time Well Spent", description: "Log 10 hours of reading", category: "Reading", tier: "bronze", icon: "timer", metric: "minutesRead", target: 600 }),
  a({ id: "hours-100", name: "Hundred Hours", description: "Log 100 hours of reading", category: "Reading", tier: "gold", icon: "timer", metric: "minutesRead", target: 6_000 }),
  a({ id: "genres-3", name: "Genre Curious", description: "Read books from 3 different genres", category: "Reading", tier: "bronze", icon: "compass", metric: "genresExplored", target: 3 }),
  a({ id: "genres-10", name: "Genre Explorer", description: "Read books from 10 different genres", category: "Reading", tier: "silver", icon: "compass", metric: "genresExplored", target: 10 }),
  a({ id: "authors-10", name: "Many Voices", description: "Finish books by 10 different authors", category: "Reading", tier: "silver", icon: "users", metric: "authorsFinished", target: 10 }),

  // Consistency
  a({ id: "session-1", name: "Bookmark", description: "Log your first reading session", category: "Consistency", tier: "bronze", icon: "calendar-check", metric: "sessions", target: 1 }),
  a({ id: "session-50", name: "Creature of Habit", description: "Log 50 reading sessions", category: "Consistency", tier: "silver", icon: "calendar-check", metric: "sessions", target: 50 }),
  a({ id: "session-250", name: "Ritual", description: "Log 250 reading sessions", category: "Consistency", tier: "gold", icon: "calendar-check", metric: "sessions", target: 250 }),
  a({ id: "streak-3", name: "Kindling", description: "Read 3 days in a row", category: "Consistency", tier: "bronze", icon: "flame", metric: "longestStreak", target: 3 }),
  a({ id: "streak-7", name: "On Fire", description: "Read 7 days in a row", category: "Consistency", tier: "silver", icon: "flame", metric: "longestStreak", target: 7 }),
  a({ id: "streak-30", name: "Unstoppable", description: "Read 30 days in a row", category: "Consistency", tier: "gold", icon: "flame", metric: "longestStreak", target: 30 }),
  a({ id: "streak-100", name: "Eternal Flame", description: "Read 100 days in a row", category: "Consistency", tier: "platinum", icon: "flame", metric: "longestStreak", target: 100 }),
  a({ id: "goal-7", name: "Goal Getter", description: "Hit your daily page goal on 7 days", category: "Consistency", tier: "bronze", icon: "target", metric: "goalDays", target: 7 }),
  a({ id: "goal-30", name: "Bullseye", description: "Hit your daily page goal on 30 days", category: "Consistency", tier: "silver", icon: "target", metric: "goalDays", target: 30 }),
  a({ id: "days-365", name: "A Year in Pages", description: "Read on 365 different days", category: "Consistency", tier: "platinum", icon: "calendar-check", metric: "readingDays", target: 365 }),

  // Community (reviews & ratings)
  a({ id: "review-1", name: "Critic", description: "Write your first review", category: "Community", tier: "bronze", icon: "pen-line", metric: "reviews", target: 1 }),
  a({ id: "review-10", name: "Columnist", description: "Write 10 reviews", category: "Community", tier: "silver", icon: "pen-line", metric: "reviews", target: 10 }),
  a({ id: "review-50", name: "Literary Critic", description: "Write 50 reviews", category: "Community", tier: "gold", icon: "pen-line", metric: "reviews", target: 50 }),
  a({ id: "rated-10", name: "Star Struck", description: "Rate 10 books", category: "Community", tier: "bronze", icon: "star", metric: "rated", target: 10 }),

  // Feats
  a({ id: "marathon", name: "Marathon", description: "Read 100+ pages in one session", category: "Feats", tier: "silver", icon: "zap", metric: "maxPagesInSession", target: 100 }),
  a({ id: "deep-focus", name: "Deep Focus", description: "Read for 2+ hours in one session", category: "Feats", tier: "silver", icon: "brain", metric: "maxMinutesInSession", target: 120 }),
  a({ id: "tome", name: "Tome Tamer", description: "Finish a book with 600+ pages", category: "Feats", tier: "gold", icon: "mountain", metric: "longestBookFinished", target: 600 }),
  a({ id: "speedy", name: "Speed Reader", description: "Finish a book within 7 days of starting it", category: "Feats", tier: "silver", icon: "rabbit", metric: "quickFinishes", target: 1, secret: true }),
  a({ id: "dnf", name: "Life's Too Short", description: "Mark a book as did-not-finish", category: "Feats", tier: "bronze", icon: "door-open", metric: "dnf", target: 1, secret: true }),
];

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((x) => [x.id, x]));

export function isEarned(def: Achievement, m: Metrics): boolean {
  return m[def.metric] >= def.target;
}

export const TIER_STYLES: Record<Tier, { label: string; ring: string; bg: string; text: string }> = {
  bronze: { label: "Bronze", ring: "ring-amber-700/40", bg: "bg-amber-700/10", text: "text-amber-800 dark:text-amber-500" },
  silver: { label: "Silver", ring: "ring-slate-400/50", bg: "bg-slate-400/15", text: "text-slate-600 dark:text-slate-300" },
  gold: { label: "Gold", ring: "ring-yellow-500/50", bg: "bg-yellow-400/15", text: "text-yellow-700 dark:text-yellow-400" },
  platinum: { label: "Platinum", ring: "ring-cyan-400/50", bg: "bg-cyan-400/15", text: "text-cyan-700 dark:text-cyan-300" },
};
