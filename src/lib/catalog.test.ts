import { describe, expect, it } from "vitest";
import { searchCatalog } from "./catalog";

describe("searchCatalog", () => {
  it("returns nothing for an empty query", () => {
    expect(searchCatalog("   ")).toEqual([]);
  });

  it("finds books by title words, ignoring case and punctuation", () => {
    const results = searchCatalog("ALIBI candlelight");
    expect(results[0]?.title).toBe("Alibi by Candlelight");
  });

  it("requires every word to match", () => {
    expect(searchCatalog("alibi zzzzqqq")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(searchCatalog("the", 3)).toHaveLength(3);
  });
});
