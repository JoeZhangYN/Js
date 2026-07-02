import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runEncounterAutomation } from "./encounter.js";

const HVUT_RE_KEY = ["hvut", "re"].join("_");

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runEncounterAutomation routing", () => {
  it("rejects unknown encounter events without scheduling lobby checks", async () => {
    const rerun = vi.fn();
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.now(),
        key: "",
        count: 24,
        clear: true,
      })
    );

    const outcome = await runEncounterAutomation({
      type: "unknown",
      rerun,
    });

    expect(outcome).toEqual({
      claimed: false,
      rejected: true,
      reason: "unknownEncounterEvent",
      eventType: "unknown",
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(rerun).not.toHaveBeenCalled();
  });
});
