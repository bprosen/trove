"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "from-amber-700 to-orange-900",
  "from-emerald-700 to-teal-900",
  "from-sky-700 to-indigo-900",
  "from-rose-700 to-red-900",
  "from-violet-700 to-purple-900",
  "from-stone-600 to-stone-900",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Book cover with a generated cloth-bound fallback when there's no image (or it fails to load). */
export function BookCover({
  src,
  title,
  author,
  className,
}: {
  src?: string | null;
  title: string;
  author?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Only local images (same-origin paths, data: or blob: URLs) are rendered, so a cover never triggers a network request.
  const showImage = src && !failed && !/^(https?:)?\/\//i.test(src);
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/data URLs only
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            "flex size-full flex-col justify-between bg-gradient-to-br p-[8%] text-white",
            PALETTE[hash(title) % PALETTE.length],
          )}
        >
          <div className="h-px w-full bg-white/30" />
          <div>
            <p className="line-clamp-4 font-heading text-[clamp(0.6rem,1.6cqw+0.5rem,1.1rem)] leading-tight font-semibold">
              {title}
            </p>
            {author && <p className="mt-1 line-clamp-1 text-[0.65em] opacity-75">{author}</p>}
          </div>
          <div className="h-px w-full bg-white/30" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent" />
    </div>
  );
}
