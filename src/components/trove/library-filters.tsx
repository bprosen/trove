import { useEffect, useState } from "react";
import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { Heart, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/trove/toggle";
import { parseLibrarySearch, type LibrarySearch } from "@/lib/library-search";
import { BOOK_STATUSES, STATUS_LABELS, type Genre } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LibraryFilters({ genres, counts }: { genres: Genre[]; counts: Record<string, number> }) {
  const search = useSearch({ from: "/library" });
  const navigate = useNavigate({ from: "/library" });
  const pending = useRouterState({ select: (s) => s.isLoading });
  const [q, setQ] = useState(search.q ?? "");

  function update(patch: Partial<Record<keyof LibrarySearch, string | null>>) {
    const next: Record<string, unknown> = { ...search };
    for (const [k, v] of Object.entries(patch)) next[k] = v == null || v === "" || v === "all" ? undefined : v;
    void navigate({ search: parseLibrarySearch(next), replace: true, resetScroll: false });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: debounce re-runs only when the search text changes
  useEffect(() => {
    if (q === (search.q ?? "")) return;
    const t = setTimeout(() => update({ q }), 250);
    return () => clearTimeout(t);
  }, [q]);

  const status = search.status ?? "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...BOOK_STATUSES] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => update({ status: s })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              status === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            <span className="ml-1.5 opacity-70 tabular-nums">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author, ISBN…" className="pl-8" />
          {pending && <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        <Select value={search.genre ? String(search.genre) : "all"} onValueChange={(v) => update({ genre: v })}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genres</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.sort ?? "recent"} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently updated</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="finished">Recently finished</SelectItem>
          </SelectContent>
        </Select>
        <Toggle pressed={search.fav === "1"} onPressedChange={(p) => update({ fav: p ? "1" : null })} aria-label="Favorites only">
          <Heart className={cn("size-4", search.fav === "1" && "fill-rose-500 text-rose-500")} />
          Favorites
        </Toggle>
      </div>
    </div>
  );
}
