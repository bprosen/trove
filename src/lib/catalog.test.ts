import { describe, expect, it } from "vitest";
import { searchCatalog } from "./catalog";

describe("searchCatalog", () => {
  it("returns nothing for an empty query", () => {
    expect(searchCatalog("   ")).toEqual([]);
  });

  it("ranks an exact title match first, ignoring case", () => {
    expect(searchCatalog("BOOK 12")[0]?.title).toBe("Book 12");
  });

  it("finds books by author", () => {
    const results = searchCatalog("author 7");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((b) => b.author.startsWith("Author 7"))).toBe(true);
  });

  it("requires every word to match", () => {
    expect(searchCatalog("book zzzzqqq")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(searchCatalog("book", 3)).toHaveLength(3);
  });
});
