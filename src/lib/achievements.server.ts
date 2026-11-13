import { all, run, type AchievementUnlockRow } from "./db.server";
import { ACHIEVEMENTS_BY_ID, earnedIds } from "./achievements";
import type { Metrics } from "./stats.server";

/**
 * Record any newly earned achievements and return every stored unlock.
 * Idempotent, so it's safe to call on every stats read: new rows are only written the first time
 * a threshold is crossed, and existing unlocks are never revoked.
 */
export function syncAchievements(metrics: Metrics): AchievementUnlockRow[] {
  let unlocks = all<AchievementUnlockRow>("SELECT id, unlocked_at, seen FROM achievement_unlocks");
  const have = new Set(unlocks.map((u) => u.id));
  const fresh = earnedIds(metrics).filter((id) => !have.has(id));
  if (fresh.length > 0) {
    for (const id of fresh) run("INSERT OR IGNORE INTO achievement_unlocks (id) VALUES (?)", id);
    unlocks = all<AchievementUnlockRow>("SELECT id, unlocked_at, seen FROM achievement_unlocks");
  }
  // Drop rows for achievements that no longer exist in the catalog.
  return unlocks.filter((u) => ACHIEVEMENTS_BY_ID.has(u.id));
}

/** Mark unlock celebrations as played so they don't show again. */
export function markAchievementsSeen(ids: string[]): void {
  for (const id of ids) run("UPDATE achievement_unlocks SET seen = 1 WHERE id = ?", id);
}
