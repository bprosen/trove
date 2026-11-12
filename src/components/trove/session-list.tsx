import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/lib/actions";
import { formatDate } from "@/lib/dates";
import type { ReadingSession } from "@/lib/types";
import { BookCover } from "./book-cover";
import { useMutation } from "./use-mutation";

export function SessionList({ sessions, showBook = true }: { sessions: ReadingSession[]; showBook?: boolean }) {
  const { run, pending } = useMutation();
  if (sessions.length === 0) return <p className="text-sm text-muted-foreground">No sessions logged yet.</p>;
  return (
    <ul className="divide-y">
      {sessions.map((s) => (
        <li key={s.id} className="group flex items-center gap-3 py-3">
          {showBook && (
            <Link to="/books/$id" params={{ id: String(s.book_id) }} className="w-9 shrink-0">
              <BookCover src={s.book_cover} title={s.book_title} />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            {showBook && (
              <Link to="/books/$id" params={{ id: String(s.book_id) }} className="line-clamp-1 text-sm font-medium hover:underline">
                {s.book_title}
              </Link>
            )}
            <p className="text-sm text-muted-foreground">
              {formatDate(s.date, { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {s.pages > 0 && `${s.pages} pages`}
              {s.pages > 0 && s.minutes > 0 && " · "}
              {s.minutes > 0 && `${s.minutes} min`}
              {s.start_page != null && s.end_page != null && s.pages > 0 && (
                <span className="text-muted-foreground/70">
                  {" "}
                  (p. {s.start_page}–{s.end_page})
                </span>
              )}
            </p>
            {s.note && <p className="mt-1 line-clamp-2 text-sm italic">“{s.note}”</p>}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete session"
            disabled={pending}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => run(() => deleteSession(s.id), { success: "Session deleted" })}
          >
            <Trash2 />
          </Button>
        </li>
      ))}
    </ul>
  );
}
