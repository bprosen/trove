import { useState } from "react";
import { Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logSession } from "@/lib/actions";
import { today } from "@/lib/dates";
import { useMutation } from "./use-mutation";

export type SessionBook = { id: number; title: string; current_page: number; page_count: number | null };

export function LogSessionDialog({
  books,
  defaultBookId,
  children,
}: {
  books: SessionBook[];
  defaultBookId?: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { run, pending } = useMutation();
  const [bookId, setBookId] = useState<number | undefined>(defaultBookId ?? books[0]?.id);
  const book = books.find((b) => b.id === bookId);
  const [form, setForm] = useState({ date: "", start: "", end: "", minutes: "", note: "", finished: false });

  function reset(nextBookId = bookId) {
    const b = books.find((x) => x.id === nextBookId);
    setForm({ date: today(), start: String(b?.current_page ?? 0), end: "", minutes: "", note: "", finished: false });
  }

  const pages = form.end && form.start ? Math.max(0, Number(form.end) - Number(form.start)) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookId) return;
    run(
      () =>
        logSession({
          bookId,
          date: form.date,
          startPage: form.start,
          endPage: form.end,
          minutes: form.minutes,
          note: form.note,
          finished: form.finished,
        }),
      {
        success: pages ? `Logged ${pages} pages — nice work!` : "Session logged",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Timer /> Log session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a reading session</DialogTitle>
          <DialogDescription>Every page counts toward your streak, quests, and XP.</DialogDescription>
        </DialogHeader>
        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a book to your library first.</p>
        ) : (
          <form id="session-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Book</Label>
              <Select
                value={bookId?.toString()}
                onValueChange={(v) => {
                  setBookId(Number(v));
                  reset(Number(v));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-start">From page</Label>
              <Input id="s-start" type="number" min={0} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-end">To page</Label>
              <Input
                id="s-end"
                type="number"
                min={0}
                max={book?.page_count ?? undefined}
                value={form.end}
                autoFocus
                onChange={(e) => {
                  const end = e.target.value;
                  const done = !!book?.page_count && Number(end) >= book.page_count;
                  setForm({ ...form, end, finished: done || form.finished });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-min">Minutes</Label>
              <Input id="s-min" type="number" min={0} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-date">Date</Label>
              <Input id="s-date" type="date" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="s-note">Note</Label>
              <Textarea id="s-note" rows={2} placeholder="Thoughts, quotes, where you read…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={form.finished} onCheckedChange={(c) => setForm({ ...form, finished: c === true })} />
              I finished this book 🎉
            </label>
            {pages > 0 && (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                {pages} pages{book?.page_count ? ` · ${Math.min(100, Math.round((Number(form.end) / book.page_count) * 100))}% through` : ""}
              </p>
            )}
          </form>
        )}
        <DialogFooter>
          <Button type="submit" form="session-form" disabled={pending || !bookId}>
            {pending && <Loader2 className="animate-spin" />}
            Save session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
