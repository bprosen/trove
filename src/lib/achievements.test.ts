// Pure catalog logic, plus the unlock flow against an in-memory database.
import { beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, achievementStatuses, achievementXp, earnedIds, TIER_XP } from "./achievements";
import { markAchievementsSeen } from "./achievements.server";
import { addDays, today } from "./dates";
import * as M from "./mutations.server";
import { getStats, type Metrics } from "./stats.server";

const zero = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.metric, 0])) as Metrics;

describe("catalog", () => {
  it("has unique ids and positive targets", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.target).toBeGreaterThan(0);
  });

  it("earns achievements exactly at their threshold", () => {
    expect(earnedIds(zero)).toEqual([]);
    expect(earnedIds({ ...zero, longestStreak: 6 })).toEqual(["warming-up"]);
    expect(earnedIds({ ...zero, longestStreak: 7 })).toEqual(["warming-up", "on-fire"]);
  });

  it("sums tier XP and ignores unknown ids", () => {
    expect(achievementXp(["the-end", "centurion", "no-such-thing"])).toBe(TIER_XP.bronze + TIER_XP.platinum);
  });

  it("caps displayed progress at the target", () => {
    const s = achievementStatuses({ ...zero, booksAdded: 999 }, [{ id: "shelf-starter", unlocked_at: "2026-01-01 10:00:00" }]);
    expect(s.find((a) => a.id === "shelf-starter")).toMatchObject({ current: 1, unlocked: true, unlockedAt: "2026-01-01 10:00:00" });
    expect(s.find((a) => a.id === "growing-shelf")).toMatchObject({ current: 10, unlocked: false });
  });
});

describe("unlocking", () => {
  beforeEach(async () => {
    await M.resetAllData();
  });

  async function addBook(input: Partial<M.BookInput> = {}) {
    const res = await M.createBook({ title: "Test Book", author: "A. Writer", page_count: 200, ...input });
    if (!res.ok || !res.data) throw new Error("createBook failed");
    return res.data.id;
  }

  const ids = async () => (await getStats()).unlocks.map((u) => u.id).sort();

  it("unlocks from actions, awards XP, and tracks the seen flag", async () => {
    expect(await ids()).toEqual([]);
    const before = (await getStats()).level.xp;

    const id = await addBook();
    await M.setBookStatus(id, "finished");
    const stats = await getStats();
    expect(stats.unlocks.map((u) => u.id).sort()).toEqual(["shelf-starter", "the-end"]);
    expect(stats.unlocks.every((u) => u.seen === 0)).toBe(true);
    // 200 pages + 50 for finishing + bronze bonuses.
    expect(stats.level.xp - before).toBe(200 + 50 + 2 * TIER_XP.bronze);

    markAchievementsSeen(["the-end"]);
    const seen = Object.fromEntries((await getStats()).unlocks.map((u) => [u.id, u.seen]));
    expect(seen).toEqual({ "shelf-starter": 0, "the-end": 1 });
  });

  it("keeps unlocks after the data behind them is deleted", async () => {
    const id = await addBook();
    await M.saveReview(id, { body: "Loved it." });
    expect(await ids()).toContain("critic");
    await M.deleteBook(id);
    expect(await ids()).toContain("critic");
  });

  it("detects streaks, secret achievements and comebacks", async () => {
    const id = await addBook();
    for (let i = 40; i >= 38; i--) await M.logSession({ bookId: id, date: addDays(today(), -i), pages: 5 });
    await M.logSession({ bookId: id, date: today(), pages: 5 });
    await M.setRating(id, 1);
    const got = await ids();
    expect(got).toEqual(expect.arrayContaining(["first-session", "warming-up", "the-return", "harsh-critic"]));
    expect(got).not.toContain("on-fire");
  });

  it("is cleared by a full reset", async () => {
    await addBook();
    expect(await ids()).not.toEqual([]);
    await M.resetAllData();
    expect(await ids()).toEqual([]);
  });
});
