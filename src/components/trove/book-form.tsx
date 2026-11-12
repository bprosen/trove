import { useMemo, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBook, updateBook, type BookInput } from "@/lib/actions";
import { searchCatalog, type CatalogBook } from "@/lib/catalog";
import { BOOK_FORMATS, BOOK_STATUSES, FORMAT_LABELS, STATUS_LABELS, type Book, type BookFormat, type BookStatus } from "@/lib/types";
import { BookCover } from "./book-cover";
import { GenrePicker } from "./genre-picker";
import { useMutation } from "./use-mutation";

function CatalogSearch({ onPick }: { onPick: (b: CatalogBook) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchCatalog(q), [q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick add</CardTitle>
        <CardDescription>Search the built-in catalog to fill in the details automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or author" className="pl-8" />
        </div>
        {q.trim() && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No matches. Fill in the details below instead.</p>
        )}
        {results.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.map((b) => (
              <li key={`${b.title}|${b.author}`}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(b);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-accent"
                >
                  <BookCover className="w-10 shrink-0" title={b.title} />
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-medium">{b.title}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {b.author}
                      {b.year ? ` · ${b.year}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function BookForm({ book, genreSuggestions }: { book?: Book; genreSuggestions: string[] }) {
  const router = useRouter();
  const navigate = useNavigate();
  const { run, pending } = useMutation();
  const [form, setForm] = useState({
    title: book?.title ?? "",
    author: book?.author ?? "",
    isbn: book?.isbn ?? "",
    description: book?.description ?? "",
    page_count: book?.page_count?.toString() ?? "",
    published_year: book?.published_year?.toString() ?? "",
    format: (book?.format ?? "physical") as BookFormat,
    status: "want" as BookStatus,
  });
  const [genres, setGenres] = useState<string[]>(book?.genres.map((g) => g.name) ?? []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function fromCatalog(b: CatalogBook) {
    setForm((f) => ({
      ...f,
      title: b.title,
      author: b.author,
      isbn: b.isbn ?? "",
      description: b.description ?? f.description,
      page_count: b.pages?.toString() ?? "",
      published_year: b.year?.toString() ?? "",
    }));
    if (b.genres?.length) setGenres((g) => [...new Set([...g, ...b.genres!])]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: BookInput = { ...form, genres };
    if (book) {
      run(() => updateBook(book.id, input), {
        success: "Book updated",
        onSuccess: () => navigate({ to: "/books/$id", params: { id: String(book.id) } }),
      });
    } else {
      run(() => createBook(input), {
        success: `Added “${form.title}” to your library`,
        onSuccess: (data) => data && navigate({ to: "/books/$id", params: { id: String(data.id) } }),
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      <div className="space-y-6">
        {!book && <CatalogSearch onPick={fromCatalog} />}
        <Card>
          <CardHeader>
            <CardTitle>{book ? "Edit details" : "Book details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="book-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" required value={form.title} onChange={set("title")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" value={form.author} onChange={set("author")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pages">Pages</Label>
                <Input id="pages" type="number" min={1} value={form.page_count} onChange={set("page_count")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Published</Label>
                <Input id="year" type="number" value={form.published_year} onChange={set("published_year")} />
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v as BookFormat }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOK_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {FORMAT_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!book && (
                <div className="space-y-2">
                  <Label>Shelf</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as BookStatus }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input id="isbn" value={form.isbn} onChange={set("isbn")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Genres</Label>
                <GenrePicker value={genres} onChange={setGenres} suggestions={genreSuggestions} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={form.description} onChange={set("description")} />
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.history.back()}>
            Cancel
          </Button>
          <Button type="submit" form="book-form" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {book ? "Save changes" : "Add to library"}
          </Button>
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-2">
          <p className="text-sm text-muted-foreground">Preview</p>
          <BookCover title={form.title || "Untitled"} author={form.author} />
        </div>
      </div>
    </div>
  );
}
