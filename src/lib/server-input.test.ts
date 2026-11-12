import { describe, expect, it } from "vitest";
import { objectInput } from "./server-input";

describe("objectInput", () => {
  it("passes objects through", () => {
    const d = { id: 1 };
    expect(objectInput(d)).toBe(d);
  });

  it.each([undefined, null, 5, "x", [1]])("rejects %s", (v) => {
    expect(() => objectInput(v)).toThrow("Invalid input");
  });
});
