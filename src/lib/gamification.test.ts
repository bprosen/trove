import { describe, expect, it } from "vitest";
import { levelFromXp, levelTitle, xpForLevel } from "./gamification";

describe("level curve", () => {
  it("matches 50·n·(n−1)", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
  });

  it("derives level and progress from XP", () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNext: 100, progress: 0 });
    expect(levelFromXp(150)).toMatchObject({ level: 2, xpIntoLevel: 50, xpForNext: 200, progress: 0.25 });
    expect(levelFromXp(300).level).toBe(3);
  });

  it("assigns titles by level", () => {
    expect(levelTitle(1)).toBe("Curious Reader");
    expect(levelTitle(3)).toBe("Page Turner");
    expect(levelTitle(99)).toBe("Living Legend");
  });
});
