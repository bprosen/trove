import { useState } from "react";
import { Star } from "lucide-react";
import { setRating } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useMutation } from "./use-mutation";

export function StarDisplay({ rating, className }: { rating: number | null; className?: string }) {
  if (!rating) return null;
  return (
    <span role="img" className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3.5", n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
      ))}
    </span>
  );
}

/** Interactive rating; click the current star again to clear. */
export function StarRating({ bookId, rating }: { bookId: number; rating: number | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const [optimistic, setOptimistic] = useState(rating);
  const { run, pending } = useMutation();
  const shown = hover ?? optimistic ?? 0;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        // biome-ignore lint/a11y/useSemanticElements: a button with radio semantics allows clicking the current star to clear the rating
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={optimistic === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={pending}
          onMouseEnter={() => setHover(n)}
          onClick={() => {
            const next = optimistic === n ? null : n;
            setOptimistic(next);
            run(() => setRating(bookId, next));
          }}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Star className={cn("size-6", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}
