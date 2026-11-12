"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ACHIEVEMENTS_BY_ID, TIER_STYLES, TIER_XP } from "@/lib/achievements";
import type { ActionResult } from "@/lib/types";
import { AchievementIcon } from "./achievement-icon";

async function confettiBurst() {
  const { default: confetti } = await import("canvas-confetti");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.75 }, disableForReducedMotion: true });
}

/** Show a celebratory toast (and confetti) for each newly unlocked achievement. */
export function celebrate(ids: string[]) {
  if (ids.length === 0) return;
  void confettiBurst();
  ids.forEach((id, i) => {
    const def = ACHIEVEMENTS_BY_ID.get(id);
    if (!def) return;
    setTimeout(() => {
      toast.custom(
        () => (
          <div className="flex w-[356px] items-center gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg">
            <AchievementIcon achievement={def} />
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Achievement unlocked · {TIER_STYLES[def.tier].label}
              </p>
              <p className="font-heading font-semibold">{def.name}</p>
              <p className="text-sm text-muted-foreground">
                {def.description} · <span className="font-medium text-primary">+{TIER_XP[def.tier]} XP</span>
              </p>
            </div>
          </div>
        ),
        { duration: 6000 },
      );
    }, i * 400);
  });
}

/** Run a server action with pending state, error toasts, and achievement celebrations. */
export function useMutation() {
  const [pending, startTransition] = useTransition();

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    opts: { success?: string; onSuccess?: (data: T | undefined) => void } = {},
  ) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (opts.success) toast.success(opts.success);
      celebrate(res.unlocked);
      opts.onSuccess?.(res.data);
    });
  }

  return { pending, run };
}
