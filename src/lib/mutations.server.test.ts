// Runs against an in-memory SQLite database (TROVE_DB_PATH=":memory:" in vitest.config.ts).
import { beforeEach, describe, expect, it } from "vitest";
import { addDays, today } from "./dates";
import * as M from "./mutations.server";
import { getBook, listBooks, listGenres, listSessions } from "./queries.server";
import { getStats } from "./stats.server";

async function addBook(input: Partial<M.BookInput> = {}) {
  const res = await M.createBook({ title: "Test Book", author: "A. Writer", page_count: 200, ...input });
  if (!res.ok || !res.data) throw new Error("createBook failed");
  return res.data.id;
}

beforeEach(async () => {
  await M.resetAllData();
});

describe("books", () => {
  it("creates a book with genres and defaults to want-to-read", async () => {
    const id = await addBook({ genres: ["Fantasy", "fantasy ", "Mystery"] });
    const book = await getBook(id);
    expect(book).toMatchObject({ title: "Test Book", status: "want", current_page: 0 });
    expect(book?.genres.map((g) => g.name).sort()).toEqual(["Fantasy", "Mystery"]);
  });

  it("validates input and reports user-facing errors", async () => {
    expect(await M.createBook({ title: "  ", author: "" })).toEqual({ ok: false, error: "Title is required" });
    expect(await M.createBook({ title: "X", author: "", page_count: "abc" })).toMatchObject({ ok: false });
  });

  it("never stores a cover URL", async () => {
    // Simulates an old client still sending a cover URL; the server must ignore it.
    const id = await addBook({ cover_url: "https://example.com/c.jpg" } as unknown as Partial<M.BookInput>);
    expect((await getBook(id))?.cover_url).toBeNull();
  });

  it("finishing a book fills in progress and dates", async () => {
    const id = await addBook();
    await M.setBookStatus(id, "finished");
    expect(await getBook(id)).toMatchObject({ status: "finished", current_page: 200, finished_at: today() });
  });

  it("deletes a book", async () => {
    const id = await addBook();
    await M.deleteBook(id);
    expect(await getBook(id)).toBeNull();
  });
});

describe("sessions", () => {
  it("logging pages moves a want-to-read book to reading and advances progress", async () => {
    const id = await addBook();
    expect(await M.logSession({ bookId: id, date: today(), startPage: 0, endPage: 40, minutes: 30 })).toMatchObject({ ok: true });
    expect(await getBook(id)).toMatchObject({ status: "reading", current_page: 40, started_at: today() });
    expect(await listSessions({ bookId: id })).toHaveLength(1);
  });

  it("rejects future dates and empty sessions", async () => {
    const id = await addBook();
    expect(await M.logSession({ bookId: id, date: addDays(today(), 1), pages: 5 })).toEqual({
      ok: false,
      error: "Sessions can't be in the future",
    });
    expect(await M.logSession({ bookId: id, date: today() })).toEqual({ ok: false, error: "Log at least some pages or minutes" });
  });

  it("feeds streaks and XP into stats", async () => {
    const id = await addBook();
    await M.logSession({ bookId: id, date: addDays(today(), -1), pages: 10, minutes: 10 });
    await M.logSession({ bookId: id, date: today(), pages: 10, minutes: 10 });
    const stats = await getStats();
    expect(stats.currentStreak).toBe(2);
    expect(stats.metrics.pagesRead).toBe(20);
    expect(stats.level.xp).toBeGreaterThan(0);
  });
});

describe("sample data and reset", () => {
  it("loads the fictional sample library once, then resets", async () => {
    expect(await M.loadSampleData()).toMatchObject({ ok: true });
    expect((await listBooks()).length).toBe(16);
    expect((await listGenres()).length).toBeGreaterThan(0);
    expect(await M.loadSampleData()).toMatchObject({ ok: false });
    await M.resetAllData();
    expect(await listBooks()).toEqual([]);
  });
});
