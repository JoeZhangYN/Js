import { afterEach, describe, expect, it, vi } from "vitest";
import { runNavigationAutomation } from "./navigate.js";

describe("runNavigationAutomation event rejection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("records rejected evidence for unknown navigation events", () => {
    expect(runNavigationAutomation({ type: "unknown" })).toBe(false);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "rejected",
      eventType: "unknown",
      detail: { cause: "unknownNavigationEvent" },
    });
  });

  it("rejects null navigation events with structured evidence instead of throwing", () => {
    expect(runNavigationAutomation(null)).toBe(false);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "rejected",
      detail: { cause: "unknownNavigationEvent" },
    });
  });
});
