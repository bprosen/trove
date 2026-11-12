/** XP + level math. Shared between server and client. */

export const XP_RULES = {
  perPage: 1,
  perMinute: 0.5,
  perSession: 5,
  perFinishedBook: 50,
  perReview: 25,
} as const;

/** Total XP required to *reach* `level` (level 1 = 0 XP). Level 2 = 100, 3 = 300, 4 = 600 … */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    xp,
    xpIntoLevel: xp - floor,
    xpForNext: ceil - floor,
    progress: (xp - floor) / (ceil - floor),
    title: levelTitle(level),
  };
}

export type LevelInfo = ReturnType<typeof levelFromXp>;

const TITLES: [number, string][] = [
  [1, "Curious Reader"],
  [3, "Page Turner"],
  [6, "Bookworm"],
  [10, "Bibliophile"],
  [15, "Lorekeeper"],
  [21, "Archivist"],
  [28, "Sage of the Stacks"],
  [36, "Living Legend"],
];

export function levelTitle(level: number): string {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return title;
}
