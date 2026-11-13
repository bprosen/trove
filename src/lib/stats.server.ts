import { all, get, type BookRow, type CountRow, type ReadingSessionRow } from "./db.server";
import { readSettings } from "./queries.server";
import { addDays, daysBetween, parseISODate, today as todayISO } from "./dates";
import { XP_RULES, levelFromXp, type LevelInfo } from "./gamification";
import { achievementXp } from "./achievements";
import { syncAchievements } from "./achievements.server";
import type { AchievementUnlockRow } from "./db.server";
import type { BookStatus, Settings } from "./types";

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
  | "readingDays"
  | "fiveStars"
  | "oneStars"
  | "longestReview"
  | "formatsFinished"
  | "maxPagesInDay"
  | "maxBooksInDay"
  | "weekendDays"
  | "comebacks"
  | "yearGoalMet";

/** Lifetime reading metrics computed from the database. */
export type Metrics = Record<MetricKey, number>;

type DayAgg = { pages: number; minutes: number; sessions: number; books: Set<number> };

type Snapshot = {
  settings: Settings;
  today: string;
  days: Map<string, DayAgg>;
  metrics: Metrics;
  byStatus: Record<BookStatus, number>;
  finishedDates: string[];
  ratings: number[];
  currentStreak: number;
  streakAtRisk: boolean;
  baseXp: number;
  /** Includes the bonus XP from unlocked achievements. */
  totalXp: number;
  unlocks: AchievementUnlockRow[];
  finishedThisYear: number;
};

/** One pass over the DB producing every number the gamification layer needs. */
function snapshot(): Snapshot {
  const settings = readSettings();
  const today = todayISO();

  const books = all<
    Pick<BookRow, "id" | "author" | "format" | "status" | "rating" | "favorite" | "page_count" | "started_at" | "finished_at">
  >("SELECT id, author, format, status, rating, favorite, page_count, started_at, finished_at FROM books");

  const sessions = all<Pick<ReadingSessionRow, "book_id" | "date" | "pages" | "minutes">>(
    "SELECT book_id, date, pages, minutes FROM reading_sessions",
  );

  const days = new Map<string, DayAgg>();
  const booksWithSessions = new Set<number>();
  let sessionPages = 0;
  let minutesRead = 0;
  let maxPagesInSession = 0;
  let maxMinutesInSession = 0;
  for (const s of sessions) {
    booksWithSessions.add(s.book_id);
    sessionPages += s.pages;
    minutesRead += s.minutes;
    maxPagesInSession = Math.max(maxPagesInSession, s.pages);
    maxMinutesInSession = Math.max(maxMinutesInSession, s.minutes);
    const d = days.get(s.date) ?? { pages: 0, minutes: 0, sessions: 0, books: new Set<number>() };
    d.pages += s.pages;
    d.minutes += s.minutes;
    d.sessions += 1;
    d.books.add(s.book_id);
    days.set(s.date, d);
  }

  const byStatus: Record<BookStatus, number> = { want: 0, reading: 0, finished: 0, dnf: 0 };
  const authors = new Set<string>();
  const finishedDates: string[] = [];
  const ratings: number[] = [];
  let unsessionedFinishedPages = 0;
  let longestBookFinished = 0;
  let quickFinishes = 0;
  let favorites = 0;
  const formatsFinished = new Set<string>();
  for (const b of books) {
    byStatus[b.status]++;
    if (b.rating != null) ratings.push(b.rating);
    if (b.favorite) favorites++;
    if (b.status === "finished") {
      if (b.author) authors.add(b.author.trim().toLowerCase());
      formatsFinished.add(b.format);
      if (b.finished_at) finishedDates.push(b.finished_at);
      longestBookFinished = Math.max(longestBookFinished, b.page_count ?? 0);
      if (!booksWithSessions.has(b.id)) unsessionedFinishedPages += b.page_count ?? 0;
      // Only books with logged sessions: marking an already-read book "finished" sets both dates to today.
      if (b.started_at && b.finished_at && booksWithSessions.has(b.id) && daysBetween(b.started_at, b.finished_at) <= 7) {
        quickFinishes++;
      }
    }
  }

  const count = (sql: string) => get<CountRow>(sql)?.n ?? 0;
  const genresExplored = count(
    `SELECT COUNT(DISTINCT bg.genre_id) AS n FROM book_genres bg JOIN books b ON b.id = bg.book_id
     WHERE b.status IN ('reading','finished')`,
  );
  const reviews = count("SELECT COUNT(*) AS n FROM reviews");
  const collections = count("SELECT COUNT(*) AS n FROM collections");
  const longestReview = count("SELECT COALESCE(MAX(LENGTH(body)), 0) AS n FROM reviews");

  // Streaks — a "reading day" is any day with pages or minutes logged.
  const readingDates = [...days.entries()]
    .filter(([, d]) => d.pages > 0 || d.minutes > 0)
    .map(([date]) => date)
    .sort();
  const readSet = new Set(readingDates);
  let longestStreak = 0;
  let run = 0;
  let comebacks = 0;
  let weekendDays = 0;
  let prev: string | null = null;
  for (const d of readingDates) {
    const gap = prev ? daysBetween(prev, d) : 0;
    run = gap === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    // 30+ full days without reading, then back at it.
    if (gap > 30) comebacks++;
    const dow = parseISODate(d).getDay();
    if (dow === 0 || dow === 6) weekendDays++;
    prev = d;
  }
  let currentStreak = 0;
  let cursor = readSet.has(today) ? today : addDays(today, -1);
  while (readSet.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }
  const streakAtRisk = currentStreak > 0 && !readSet.has(today);

  const goalDays = [...days.values()].filter((d) => d.pages >= settings.dailyPageGoal).length;
  let maxPagesInDay = 0;
  let maxBooksInDay = 0;
  for (const d of days.values()) {
    maxPagesInDay = Math.max(maxPagesInDay, d.pages);
    maxBooksInDay = Math.max(maxBooksInDay, d.books.size);
  }
  const finishedThisYear = finishedDates.filter((d) => d.startsWith(today.slice(0, 4))).length;
  const pagesRead = sessionPages + unsessionedFinishedPages;

  const metrics: Metrics = {
    booksAdded: books.length,
    booksFinished: byStatus.finished,
    pagesRead,
    minutesRead,
    sessions: sessions.length,
    longestStreak,
    reviews,
    rated: ratings.length,
    genresExplored,
    collections,
    favorites,
    maxPagesInSession,
    maxMinutesInSession,
    longestBookFinished,
    quickFinishes,
    goalDays,
    authorsFinished: authors.size,
    dnf: byStatus.dnf,
    readingDays: readingDates.length,
    fiveStars: ratings.filter((r) => r === 5).length,
    oneStars: ratings.filter((r) => r === 1).length,
    longestReview,
    formatsFinished: formatsFinished.size,
    maxPagesInDay,
    maxBooksInDay,
    weekendDays,
    comebacks,
    yearGoalMet: settings.yearlyBookGoal > 0 && finishedThisYear >= settings.yearlyBookGoal ? 1 : 0,
  };

  const baseXp = Math.floor(
    pagesRead * XP_RULES.perPage +
      minutesRead * XP_RULES.perMinute +
      sessions.length * XP_RULES.perSession +
      byStatus.finished * XP_RULES.perFinishedBook +
      reviews * XP_RULES.perReview,
  );

  const unlocks = syncAchievements(metrics);
  const totalXp = baseXp + achievementXp(unlocks.map((u) => u.id));

  return {
    settings, today, days, metrics, byStatus, finishedDates, ratings, currentStreak, streakAtRisk,
    baseXp, totalXp, unlocks, finishedThisYear,
  };
}

export type Quest = { id: string; label: string; current: number; target: number; unit: string; xp: number };

function dailyQuests(snap: Snapshot): Quest[] {
  const t = snap.days.get(snap.today);
  const pages = t?.pages ?? 0;
  const minutes = t?.minutes ?? 0;
  const goal = snap.settings.dailyPageGoal;
  const rotating: Quest[] = [
    { id: "minutes-30", label: "Read for 30 minutes", current: minutes, target: 30, unit: "min", xp: 15 },
    { id: "two-books", label: "Read from 2 different books", current: t?.books.size ?? 0, target: 2, unit: "books", xp: 15 },
    { id: "overachiever", label: "Read 150% of your page goal", current: pages, target: Math.ceil(goal * 1.5), unit: "pages", xp: 20 },
    { id: "two-sessions", label: "Log 2 reading sessions", current: t?.sessions ?? 0, target: 2, unit: "sessions", xp: 10 },
  ];
  const dayIndex = Math.floor(parseISODate(snap.today).getTime() / 86_400_000);
  return [
    { id: "read-today", label: "Log a reading session", current: t?.sessions ?? 0, target: 1, unit: "session", xp: 5 },
    { id: "daily-goal", label: `Read ${goal} pages`, current: pages, target: goal, unit: "pages", xp: 10 },
    rotating[dayIndex % rotating.length],
  ];
}

export type DayPoint = { date: string; pages: number; minutes: number };

export type Stats = {
  settings: Settings;
  today: string;
  metrics: Metrics;
  level: LevelInfo;
  currentStreak: number;
  longestStreak: number;
  streakAtRisk: boolean;
  todayPages: number;
  todayMinutes: number;
  quests: Quest[];
  finishedThisYear: number;
  byStatus: Record<BookStatus, number>;
  avgRating: number | null;
  ratingDistribution: { rating: number; count: number }[];
  last30: DayPoint[];
  heatmap: DayPoint[];
  monthlyFinished: { month: string; books: number }[];
  weekday: { day: string; pages: number }[];
  genreBreakdown: { name: string; books: number }[];
  weekPages: number;
  lastWeekPages: number;
  unlocks: AchievementUnlockRow[];
};

export async function getStats(): Promise<Stats> {
  const snap = snapshot();

  const point = (date: string): DayPoint => {
    const d = snap.days.get(date);
    return { date, pages: d?.pages ?? 0, minutes: d?.minutes ?? 0 };
  };
  const range = (n: number) => Array.from({ length: n }, (_, i) => point(addDays(snap.today, i - n + 1)));

  // Heatmap: full weeks (Sun–Sat), ~1 year back, ending with the current week.
  const todayDow = parseISODate(snap.today).getDay();
  const heatStart = addDays(snap.today, -(52 * 7) - todayDow);
  const heatLen = daysBetween(heatStart, snap.today) + 1;
  const heatmap = Array.from({ length: heatLen }, (_, i) => point(addDays(heatStart, i)));

  const year = snap.today.slice(0, 4);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyFinished = monthNames.map((month, i) => ({
    month,
    books: snap.finishedDates.filter((d) => d.startsWith(`${year}-${String(i + 1).padStart(2, "0")}`)).length,
  }));

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayTotals = new Array(7).fill(0);
  for (const [date, d] of snap.days) weekdayTotals[parseISODate(date).getDay()] += d.pages;
  const weekday = weekdayNames.map((day, i) => ({ day, pages: weekdayTotals[i] }));

  const genreRows = all<{ name: string; books: number }>(
    `SELECT g.name, COUNT(*) AS books FROM book_genres bg
     JOIN genres g ON g.id = bg.genre_id JOIN books b ON b.id = bg.book_id
     WHERE b.status IN ('reading','finished')
     GROUP BY g.id ORDER BY books DESC, g.name`,
  );
  // Categorical palette has 8 validated slots — fold the tail into "Other".
  const genreBreakdown = genreRows.slice(0, 7).map((r) => ({ name: r.name, books: r.books }));
  const otherCount = genreRows.slice(7).reduce((s, r) => s + r.books, 0);
  if (otherCount > 0) genreBreakdown.push({ name: "Other", books: otherCount });

  const sumPages = (pts: DayPoint[]) => pts.reduce((s, p) => s + p.pages, 0);
  const last14 = range(14);
  const avgRating = snap.ratings.length ? snap.ratings.reduce((a, b) => a + b, 0) / snap.ratings.length : null;

  return {
    settings: snap.settings,
    today: snap.today,
    metrics: snap.metrics,
    level: levelFromXp(snap.totalXp),
    currentStreak: snap.currentStreak,
    longestStreak: snap.metrics.longestStreak,
    streakAtRisk: snap.streakAtRisk,
    todayPages: snap.days.get(snap.today)?.pages ?? 0,
    todayMinutes: snap.days.get(snap.today)?.minutes ?? 0,
    quests: dailyQuests(snap),
    finishedThisYear: snap.finishedThisYear,
    byStatus: snap.byStatus,
    avgRating,
    ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: snap.ratings.filter((r) => r === rating).length,
    })),
    last30: range(30),
    heatmap,
    monthlyFinished,
    weekday,
    genreBreakdown,
    weekPages: sumPages(last14.slice(7)),
    lastWeekPages: sumPages(last14.slice(0, 7)),
    unlocks: snap.unlocks,
  };
}
