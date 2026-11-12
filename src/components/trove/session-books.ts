import type { Book } from "@/lib/types";
import type { SessionBook } from "./log-session-dialog";

/** Books offered in the session dialog: in-progress first, then everything else not yet finished, then finished. */
export function toSessionBooks(books: Book[]): SessionBook[] {
  const rank = { reading: 0, want: 1, dnf: 2, finished: 3 } as const;
  return [...books]
    .sort((a, b) => rank[a.status] - rank[b.status] || a.title.localeCompare(b.title))
    .map((b) => ({ id: b.id, title: b.title, current_page: b.current_page, page_count: b.page_count }));
}
