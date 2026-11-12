import { describe, expect, it } from "vitest";
import { parseLibrarySearch } from "./library-search";

describe("parseLibrarySearch", () => {
  it("keeps valid filters", () => {
    expect(parseLibrarySearch({ q: " dune ", status: "reading", genre: "3", sort: "title", fav: "1" })).toEqual({
      q: "dune",
      status: "reading",
      genre: 3,
      sort: "title",
      fav: "1",
    });
  });

  it("drops invalid or default values", () => {
    expect(parseLibrarySearch({ q: "  ", status: "bogus", genre: "abc", sort: "recent", fav: "0" })).toEqual({
      q: undefined,
      status: undefined,
      genre: undefined,
      sort: undefined,
      fav: undefined,
    });
  });

  it("rejects non-positive and fractional genre ids", () => {
    expect(parseLibrarySearch({ genre: 0 }).genre).toBeUndefined();
    expect(parseLibrarySearch({ genre: -2 }).genre).toBeUndefined();
    expect(parseLibrarySearch({ genre: 1.5 }).genre).toBeUndefined();
  });
});
