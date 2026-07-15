import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

describe("runEncounterPolicy legacy state recovery", () => {
  it("migrates a missing-timestamp limit state into confirmation instead of stopping", () => {
    const state = { date: 0, key: "", count: 24, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: Date.UTC(2026, 5, 27, 12, 0),
      })
    ).toMatchObject({
      state: { date: 0, key: "", count: 24, clear: true, dayPhase: "confirmingLimit" },
      dailyLimitReached: true,
      status: "ready",
      reason: "limitProbe",
    });
  });

  it("caps an impossible over-limit count while retaining its cooldown anchor", () => {
    const state = { date: Date.UTC(2026, 5, 27, 23, 0), key: "", count: 40, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: Date.UTC(2026, 5, 27, 23, 9, 28),
      })
    ).toMatchObject({
      state: {
        date: Date.UTC(2026, 5, 27, 23, 0),
        key: "",
        count: 24,
        clear: true,
        dayPhase: "confirmingLimit",
      },
      dailyLimitReached: true,
      status: "countdown",
      reason: "cooldown",
    });
  });
});
