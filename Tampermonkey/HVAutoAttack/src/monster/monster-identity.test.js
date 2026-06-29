import { describe, expect, it } from "vitest";
import { normalizeMonsterName } from "./monster-identity.js";

describe("monster identity normalization", () => {
  it("normalizes runtime matching names without changing case", () => {
    expect(normalizeMonsterName("  the  Deep Learning  ")).toBe("Deep Learning");
    expect(normalizeMonsterName("An Example")).toBe("Example");
    expect(normalizeMonsterName("example")).toBe("example");
  });
});
