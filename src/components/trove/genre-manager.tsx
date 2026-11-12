import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { createGenre, deleteGenre, renameGenre } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useMutation } from "./use-mutation";

type G = { id: number; name: string; bookCount: number; finishedCount: number; avgRating: number | null };

/** Per-genre mastery ranks, based on books finished in that genre. */
const RANKS = [
  { min: 0, name: "Unexplored" },
  { min: 1, name: "Novice" },
  { min: 3, name: "Adept" },
  { min: 10, name: "Expert" },
  { min: 25, name: "Master" },
  { min: 50, name: "Grandmaster" },
];

function rank(finished: number) {
  let i = 0;
  while (i + 1 < RANKS.length && finished >= RANKS[i + 1].min) i++;
  const next = RANKS[i + 1];
  return { name: RANKS[i].name, index: i, next, progress: next ? (finished - RANKS[i].min) / (next.min - RANKS[i].min) : 1 };
}

function GenreRow({ g }: { g: G }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(g.name);
  const { run, pending } = useMutation();
  const r = rank(g.finishedCount);

  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center justify-between gap-2">
          {editing ? (
            <form
              className="flex flex-1 gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => renameGenre(g.id, name), { success: "Genre renamed", onSuccess: () => setEditing(false) });
              }}
            >
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="h-7" />
              <Button size="icon-sm" type="submit" disabled={pending} aria-label="Save">
                <Check />
              </Button>
              <Button size="icon-sm" variant="ghost" type="button" onClick={() => setEditing(false)} aria-label="Cancel">
                <X />
              </Button>
            </form>
          ) : (
            <>
              <Link to="/library" search={{ genre: g.id }} className="font-heading text-lg font-semibold hover:underline">
                {g.name}
              </Link>
              <div className="flex">
                <Button size="icon-sm" variant="ghost" aria-label={`Rename ${g.name}`} onClick={() => setEditing(true)}>
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete ${g.name}`}
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Delete the "${g.name}" genre? Books keep their other genres.`)) run(() => deleteGenre(g.id), { success: "Genre deleted" });
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{g.bookCount} books</span>
          <span>{g.finishedCount} finished</span>
          {g.avgRating != null && (
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" /> {g.avgRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={cn("font-medium", r.index === 0 ? "text-muted-foreground" : "text-primary")}>{r.name}</span>
            {r.next && (
              <span className="text-muted-foreground">
                {r.next.min - g.finishedCount} more to {r.next.name}
              </span>
            )}
          </div>
          <Progress value={r.progress * 100} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GenreManager({ genres }: { genres: G[] }) {
  const [name, setName] = useState("");
  const { run, pending } = useMutation();
  return (
    <div className="space-y-6">
      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createGenre(name), { success: `Added “${name}”`, onSuccess: () => setName("") });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New genre, e.g. Cozy Mystery" />
        <Button type="submit" disabled={pending || !name.trim()}>
          <Plus /> Add
        </Button>
      </form>
      {genres.length === 0 ? (
        <p className="text-muted-foreground">No genres yet. Add some here or while adding a book.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {genres.map((g) => (
            <GenreRow key={`${g.id}-${g.name}`} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}
