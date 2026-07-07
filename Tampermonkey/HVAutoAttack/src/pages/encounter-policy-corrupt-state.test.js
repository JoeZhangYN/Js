import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

describe("runEncounterPolicy corrupted state recovery", () => {
  it("recovers missing-timestamp daily limit state instead of waiting forever", () => {
    const state = { date: 0, key: "", count: 24, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: Date.UTC(2026, 5, 27, 12, 0),
      })
    ).toMatchObject({
      state: { date: 0, key: "", count: 0, clear: true },
      dailyLimitReached: false,
      status: "ready",
      reason: "readyWindow",
    });
  });
});
