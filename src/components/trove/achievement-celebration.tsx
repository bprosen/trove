import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS_BY_ID, TIER_LABELS, TIER_XP, type Achievement } from "@/lib/achievements";
import { markAchievementsSeen } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { AchievementBadge, TIER_STYLES } from "./achievement-badge";

/** More than this many unlocks at once collapse into one summary screen instead of a long queue. */
const BATCH_THRESHOLD = 3;
const SINGLE_DURATION_MS = 5200;

type Item = { key: number; kind: "single"; achievement: Achievement } | { key: number; kind: "batch"; achievements: Achievement[] };

// Tiny pub/sub so any component (e.g. the achievements page) can replay a celebration.
const replayListeners = new Set<(a: Achievement[]) => void>();
export function replayCelebration(ids: string[]) {
  const list = ids.map((id) => ACHIEVEMENTS_BY_ID.get(id)).filter((x): x is Achievement => !!x);
  for (const l of replayListeners) l(list);
}

async function fireConfetti(achievements: Achievement[]) {
  const { default: confetti } = await import("canvas-confetti");
  const best = achievements.reduce((b, x) => (TIER_XP[x.tier] > TIER_XP[b.tier] ? x : b), achievements[0]);
  const colors = [...new Set(achievements.flatMap((x) => TIER_STYLES[x.tier].confetti))];
  const base = { colors, zIndex: 200, disableForReducedMotion: true, ticks: 260 } as const;
  const big = best.tier === "gold" || best.tier === "platinum" || achievements.length > 1;

  // Side cannons aimed at the medallion.
  confetti({ ...base, particleCount: big ? 90 : 55, angle: 60, spread: 60, startVelocity: 58, origin: { x: 0, y: 0.75 } });
  confetti({ ...base, particleCount: big ? 90 : 55, angle: 120, spread: 60, startVelocity: 58, origin: { x: 1, y: 0.75 } });
  // Star burst out of the badge itself once it lands.
  setTimeout(() => {
    confetti({ ...base, particleCount: big ? 60 : 30, spread: 360, startVelocity: big ? 32 : 22, shapes: ["star"], scalar: 1.2, gravity: 0.6, origin: { x: 0.5, y: 0.4 } });
  }, 380);
  if (best.tier === "platinum") {
    // Platinum gets a lingering shower from the top.
    const end = Date.now() + 1600;
    const rain = () => {
      confetti({ ...base, particleCount: 6, angle: 270, spread: 120, startVelocity: 12, gravity: 0.5, origin: { x: Math.random(), y: -0.05 } });
      if (Date.now() < end) requestAnimationFrame(rain);
    };
    setTimeout(rain, 700);
  }
}

/**
 * Full-screen unlock celebration, mounted once in the root layout.
 * `newUnlocks` comes from the root loader, which re-runs after every mutation; each id is played once
 * and immediately marked seen on the server.
 */
export function AchievementCelebration({ newUnlocks }: { newUnlocks: string[] }) {
  const [queue, setQueue] = useState<Item[]>([]);
  const handled = useRef(new Set<string>());
  const nextKey = useRef(0);

  const enqueue = useCallback((list: Achievement[]) => {
    if (list.length === 0) return;
    const items: Item[] =
      list.length > BATCH_THRESHOLD
        ? [{ key: nextKey.current++, kind: "batch", achievements: list }]
        : list.map((achievement) => ({ key: nextKey.current++, kind: "single", achievement }));
    setQueue((q) => [...q, ...items]);
  }, []);

  useEffect(() => {
    const fresh = newUnlocks.filter((id) => !handled.current.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) handled.current.add(id);
    markAchievementsSeen(fresh).catch(() => {
      // Not fatal: worst case the celebration replays on the next load.
    });
    // Rarest first, so a gold unlock isn't buried behind a bronze one.
    const list = fresh
      .map((id) => ACHIEVEMENTS_BY_ID.get(id))
      .filter((x): x is Achievement => !!x)
      .sort((x, y) => TIER_XP[y.tier] - TIER_XP[x.tier]);
    enqueue(list);
  }, [newUnlocks, enqueue]);

  useEffect(() => {
    replayListeners.add(enqueue);
    return () => {
      replayListeners.delete(enqueue);
    };
  }, [enqueue]);

  const current = queue[0];
  const advance = useCallback(() => setQueue((q) => q.slice(1)), []);
  const dismissAll = useCallback(() => setQueue([]), []);

  useEffect(() => {
    if (!current) return;
    fireConfetti(current.kind === "single" ? [current.achievement] : current.achievements).catch(() => {});
    if (current.kind !== "single") return;
    const t = setTimeout(advance, SINGLE_DURATION_MS);
    return () => clearTimeout(t);
  }, [current, advance]);

  if (!current) return null;
  const remaining = queue.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Achievement unlocked"
      className="ach-overlay fixed inset-0 z-[150] grid place-items-center overflow-hidden bg-black/65 p-4 backdrop-blur-sm"
      style={{ animation: "ach-backdrop 250ms ease-out" }}
      onClick={advance}
      // Focus starts on the Continue button inside, so key events bubble up here.
      onKeyDown={(e) => {
        if (e.key === "Escape") dismissAll();
      }}
    >
      {current.kind === "single" ? (
        <SingleUnlock key={current.key} achievement={current.achievement} remaining={remaining} onNext={advance} />
      ) : (
        <BatchUnlock key={current.key} achievements={current.achievements} remaining={remaining} onNext={advance} />
      )}
    </div>
  );
}

const rise = (delayMs: number): CSSProperties => ({ animation: `ach-rise 500ms ${delayMs}ms cubic-bezier(.2,.8,.2,1) both` });

/** Rotating light rays + pulsing glow behind a medallion. */
function Aura({ color, size }: { color: string; size: number }) {
  return (
    <>
      <div
        className="absolute rounded-full blur-2xl"
        style={{ width: size * 0.9, height: size * 0.9, background: color, animation: "ach-glow-pulse 2.4s ease-in-out infinite" }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.6,
          height: size * 1.6,
          background: `repeating-conic-gradient(from 0deg, ${color}55 0deg 8deg, transparent 8deg 24deg)`,
          maskImage: "radial-gradient(circle, black 15%, transparent 68%)",
          WebkitMaskImage: "radial-gradient(circle, black 15%, transparent 68%)",
          animation: "ach-spin 14s linear infinite",
        }}
      />
      <div
        className="absolute rounded-full border-4"
        style={{ width: size * 0.7, height: size * 0.7, borderColor: color, animation: "ach-shockwave 900ms 250ms ease-out both" }}
      />
      <div
        className="absolute rounded-full border-2"
        style={{ width: size * 0.7, height: size * 0.7, borderColor: color, animation: "ach-shockwave 1100ms 450ms ease-out both" }}
      />
    </>
  );
}

/** Little sparkles that fly out of the badge after it lands. */
function Twinkles({ color, count = 10, radius = 120 }: { color: string; count?: number; radius?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => ({ i, id: `twinkle-${i}` })).map(({ i, id }) => {
        const angle = (i / count) * Math.PI * 2 + 0.3;
        const r = radius * (0.75 + ((i * 37) % 10) / 20);
        return (
          <Sparkles
            key={id}
            className="absolute size-4"
            style={
              {
                color: i % 3 === 0 ? "#fff" : color,
                "--dx": `${Math.cos(angle) * r}px`,
                "--dy": `${Math.sin(angle) * r}px`,
                animation: `ach-twinkle 1400ms ${350 + i * 45}ms ease-out both`,
              } as CSSProperties
            }
          />
        );
      })}
    </>
  );
}

function XpCounter({ to, delayMs }: { to: number; delayMs: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delayMs;
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / dur));
      setN(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delayMs]);
  return <span className="tabular-nums">+{n} XP</span>;
}

function Footer({ remaining, onNext, label }: { remaining: number; onNext: () => void; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="flex flex-col items-center gap-2" style={rise(1100)}>
      <Button
        ref={ref}
        size="lg"
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      >
        {remaining > 0 ? `Next (${remaining} more)` : label}
      </Button>
      <p className="text-xs text-white/50">Click anywhere to continue · Esc to close all</p>
    </div>
  );
}

function SingleUnlock({ achievement: a, remaining, onNext }: { achievement: Achievement; remaining: number; onNext: () => void }) {
  const style = TIER_STYLES[a.tier];
  const size = 168;
  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center text-white" aria-live="assertive">
      <div className="relative grid place-items-center" style={{ width: size * 1.6, height: size * 1.3 }}>
        <Aura color={style.glow} size={size * 1.6} />
        <Twinkles color={style.glow} />
        <div style={{ animation: "ach-pop 750ms cubic-bezier(.2,.9,.3,1.2) both" }}>
          <div style={{ animation: "ach-flip 1100ms cubic-bezier(.15,.85,.25,1) both, ach-float 3s 1.2s ease-in-out infinite" }}>
            <AchievementBadge tier={a.tier} icon={a.icon} size={size} shine />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.35em] text-white/70 uppercase" style={rise(450)}>
          {a.secret ? "Secret achievement unlocked" : "Achievement unlocked"}
        </p>
        <h2 className="font-heading text-4xl font-semibold" style={rise(600)}>
          {a.name}
        </h2>
        <p className="text-white/80" style={rise(720)}>
          {a.description}
        </p>
      </div>

      <div className="flex items-center gap-2" style={rise(850)}>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-black uppercase"
          style={{ background: style.ring }}
        >
          {TIER_LABELS[a.tier]}
        </span>
        <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-semibold">
          <XpCounter to={TIER_XP[a.tier]} delayMs={850} />
        </span>
      </div>

      <Footer remaining={remaining} onNext={onNext} label="Awesome!" />

      <div className="absolute -bottom-6 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full origin-left rounded-full"
          style={{ background: style.glow, animation: `ach-timer ${SINGLE_DURATION_MS}ms linear both` }}
        />
      </div>
    </div>
  );
}

function BatchUnlock({ achievements, remaining, onNext }: { achievements: Achievement[]; remaining: number; onNext: () => void }) {
  const xp = achievements.reduce((s, a) => s + TIER_XP[a.tier], 0);
  const best = achievements[0];
  const shown = achievements.slice(0, 24);
  return (
    <div className="relative flex w-full max-w-2xl flex-col items-center gap-6 text-center text-white" aria-live="assertive">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.35em] text-white/70 uppercase" style={rise(0)}>
          Achievements unlocked
        </p>
        <h2 className="font-heading text-5xl font-semibold" style={rise(120)}>
          {achievements.length} at once!
        </h2>
        <p className="text-lg font-semibold" style={{ ...rise(250), color: TIER_STYLES[best.tier].glow }}>
          <XpCounter to={xp} delayMs={300} />
        </p>
      </div>

      <ul className="grid w-full grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6">
        {shown.map((a, i) => (
          <li
            key={a.id}
            className="flex flex-col items-center gap-1.5"
            style={{ animation: `ach-pop 600ms ${300 + i * 70}ms cubic-bezier(.2,.9,.3,1.2) both` }}
          >
            <AchievementBadge tier={a.tier} icon={a.icon} size={60} shine={a.tier === "gold" || a.tier === "platinum"} />
            <span className={cn("line-clamp-2 text-xs leading-tight font-medium text-white/90")}>{a.name}</span>
          </li>
        ))}
      </ul>
      {achievements.length > shown.length && (
        <p className="text-sm text-white/70">…and {achievements.length - shown.length} more</p>
      )}

      <Footer remaining={remaining} onNext={onNext} label="Let's go!" />
    </div>
  );
}
