"use client";

import { useState } from "react";
import { formatDate } from "@/lib/dates";
import type { DayPoint } from "@/lib/stats";
import { cn } from "@/lib/utils";

const LEVEL_CLASSES = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

function bucket(pages: number, max: number) {
  if (pages <= 0) return 0;
  const r = pages / Math.max(max, 1);
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1;
}

/** GitHub-style calendar of pages read per day. Data starts on a Sunday. */
export function ReadingHeatmap({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<DayPoint | null>(null);
  const max = Math.max(...data.map((d) => d.pages), 1);
  const weeks: DayPoint[][] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
  const total = data.reduce((s, d) => s + d.pages, 0);
  const active = data.filter((d) => d.pages > 0 || d.minutes > 0).length;

  return (
    <div className="space-y-3">
      <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
        {hover ? (
          <>
            <span className="font-medium text-foreground">{hover.pages} pages</span>
            {hover.minutes > 0 && ` · ${hover.minutes} min`} on {formatDate(hover.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">{total.toLocaleString()} pages</span> across {active} reading days in the past year
          </>
        )}
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-[3px]" onMouseLeave={() => setHover(null)}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((d) => (
                <div
                  key={d.date}
                  onMouseEnter={() => setHover(d)}
                  title={`${d.date}: ${d.pages} pages`}
                  className={cn("size-[11px] rounded-[2px] transition-transform hover:scale-125", LEVEL_CLASSES[bucket(d.pages, max)])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        Less
        {LEVEL_CLASSES.map((c) => (
          <span key={c} className={cn("size-[11px] rounded-[2px]", c)} />
        ))}
        More
      </div>
    </div>
  );
}
