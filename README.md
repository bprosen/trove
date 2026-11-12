# Trove

A gamified personal book registry. Track your library, log reading sessions, rate and review books, organize collections and genres, and keep coming back for streaks, daily quests, XP, and achievements.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, shadcn/ui, and Recharts. Data lives in a local SQLite file via Node's built-in `node:sqlite`, so there's no database server and no native modules to compile.

Trove runs fully offline: no external APIs, no web fonts (system font stacks), and no remote images (books get generated covers). All bundled book data, including the sample library, is fictional.

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. On an empty library you can **Load sample library** to explore with ~2 months of generated reading history.

Requirements: Node 22.13+ (for `node:sqlite`) and pnpm.

The database is created at `data/trove.db` on first request (it's gitignored). Override the location with `TROVE_DB_PATH=/path/to/file.db`. Node prints a one-time `ExperimentalWarning` for SQLite. It's harmless.

## Features

| Area | What you get |
| --- | --- |
| **Library** | Add (with autofill from a built-in offline catalog of fictional books, `src/data/books.json`), edit, delete; shelves (want / reading / finished / DNF); formats; favorites; search, genre filter, sort |
| **Books** | 1–5 star rating, progress bar, pace (pages/hour), finish-date estimate, per-book reading log |
| **Sessions** | Log pages (from/to) and minutes, notes, “I finished this book”; 30-day charts; full history |
| **Reviews** | One review per book with headline and spoiler blur; reviews feed |
| **Collections** | Custom shelves; add and remove books from either side |
| **Genres** | Create, rename, delete; per-genre mastery ranks (Novice to Grandmaster); genre mix chart |
| **Stats** | Totals, year heatmap, pages/day, books per month, genres, weekday pattern, rating distribution |
| **Gamification** | XP and levels with titles, daily streak (with “at risk” nudge), daily page goal ring, 3 daily quests (one rotates), yearly reading challenge, 38 tiered achievements (incl. secret ones) with toast and confetti on unlock |

## Project layout

```
src/
  app/                 routes (each has a loading.tsx so navigations stay instant)
  components/
    ui/                shadcn/ui primitives
    trove/             app components (forms, charts, widgets, nav…)
  lib/
    db.ts              SQLite connection + schema (auto-migrates with CREATE IF NOT EXISTS)
    queries.ts         read layer (every reader awaits connection() for request-time data)
    actions.ts         server actions: validate, mutate in a transaction, sync achievements, revalidate
    stats.ts           one-pass metrics snapshot: streaks, XP, quests, chart series
    achievements.ts    achievement catalog (shared by server and client)
    gamification.ts    XP rules and level curve
```

### How gamification works

- **XP** is derived, not stored: pages (+1), minutes (+0.5), sessions (+5), finished books (+50), reviews (+25), plus each unlocked achievement's tier bonus (25 / 75 / 200 / 500). Level *n* needs `50·n·(n−1)` total XP.
- **Achievements** are `metric >= target` rules over a stats snapshot. After every mutation, `syncAchievements()` persists newly earned ones and returns their ids, so the client can celebrate. Once unlocked, they stay unlocked even if you delete data.
- **Streaks** count consecutive days with any logged pages or minutes. If you haven't read yet today, yesterday's streak is still alive but flagged “at risk.”

## Notes and next steps

- This is single-user and has no authentication. Before deploying it publicly, add auth (e.g. Auth.js or Clerk) and a `user_id` column on each table, and check ownership inside every server action.
- Dates use the server's local timezone, which is right when you run it locally.
- For a hosted deployment, swap `node:sqlite` for Turso/libSQL or Postgres. The SQL is plain and portable.
# trove
