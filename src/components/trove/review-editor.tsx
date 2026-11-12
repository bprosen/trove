import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteReview, saveReview } from "@/lib/actions";
import { formatDate } from "@/lib/dates";
import type { Review } from "@/lib/types";
import { useMutation } from "./use-mutation";

export function SpoilerText({ text, spoiler }: { text: string; spoiler: boolean }) {
  const [revealed, setRevealed] = useState(!spoiler);
  if (revealed) return <p className="leading-relaxed whitespace-pre-wrap">{text}</p>;
  return (
    <button type="button" onClick={() => setRevealed(true)} className="relative block w-full text-left">
      <p className="leading-relaxed whitespace-pre-wrap blur-sm select-none">{text}</p>
      <span className="absolute inset-0 grid place-items-center text-sm font-medium">Contains spoilers — click to reveal</span>
    </button>
  );
}

export function ReviewEditor({ bookId, review }: { bookId: number; review: Review | null }) {
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(review?.headline ?? "");
  const [body, setBody] = useState(review?.body ?? "");
  const [spoilers, setSpoilers] = useState(review?.contains_spoilers ?? false);
  const { run, pending } = useMutation();

  if (!editing && review) {
    return (
      <div className="space-y-3">
        {review.headline && <p className="font-heading text-lg font-semibold">{review.headline}</p>}
        <SpoilerText text={review.body} spoiler={review.contains_spoilers} />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Updated {formatDate(review.updated_at)}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={pending}
              onClick={() => run(() => deleteReview(bookId), { success: "Review deleted" })}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">What did you think? Reviews earn +25 XP.</p>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <PenLine /> Write a review
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveReview(bookId, { headline, body, containsSpoilers: spoilers }), {
          success: review ? "Review updated" : "Review published",
          onSuccess: () => setEditing(false),
        });
      }}
    >
      <Input placeholder="Headline (optional)" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      <Textarea placeholder="Your thoughts…" rows={6} required value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="review-spoilers" className="flex items-center gap-2 text-sm">
          <Checkbox id="review-spoilers" checked={spoilers} onCheckedChange={(c) => setSpoilers(c === true)} />
          Contains spoilers
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !body.trim()}>
            {pending && <Loader2 className="animate-spin" />}
            Save review
          </Button>
        </div>
      </div>
    </form>
  );
}
