import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDate, parseISODate, toISODate } from "./dates";

describe("dates", () => {
  it("round-trips ISO dates", () => {
    expect(toISODate(parseISODate("2026-03-09"))).toBe("2026-03-09");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2026-01-31", "2026-01-01")).toBe(-30);
  });

  it("formats dates and handles empty input", () => {
    expect(formatDate("2026-11-11")).toBe("Nov 11, 2026");
    expect(formatDate(null)).toBe("");
  });
});
