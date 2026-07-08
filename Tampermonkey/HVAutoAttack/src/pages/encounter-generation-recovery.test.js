import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

describe("encounter generation recovery", () => {
  it("backs off automatic encounter generation failures before another news load", () => {
    const nowMs = Date.UTC(2026, 5, 27, 0, 0, 5);
    const state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED,
      state: { date: 0, key: "", count: 0, clear: true },
      nowMs,
      reason: "dailyResetEvent",
    });

    expect(state).toMatchObject({
      generationAttemptKey: "2026-06-27:0::true:ready",
      generationFailureCount: 1,
      generationNextAttemptAt: nowMs + 5 * 60 * 1000,
      generationFailureReason: "dailyResetEvent",
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs,
      })
    ).toMatchObject({
      status: "countdown",
      reason: "generationBackoff",
      countdownMs: 5 * 60 * 1000,
    });
  });

  it("opens a generation circuit breaker after repeated same-cause failures", () => {
    const nowMs = Date.UTC(2026, 5, 27, 0, 0, 5);
    const attemptKey = "2026-06-27:0::true:ready";
    const state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED,
      state: {
        date: 0,
        key: "",
        count: 0,
        clear: true,
        generationAttemptKey: attemptKey,
        generationFailureCount: 2,
      },
      attemptKey,
      nowMs,
      reason: "dailyResetEvent",
    });

    expect(state).toMatchObject({
      generationAttemptKey: attemptKey,
      generationFailureCount: 3,
      generationCircuitOpenUntil: nowMs + 60 * 60 * 1000,
      generationFailureReason: "dailyResetEvent",
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs,
      })
    ).toMatchObject({
      status: "countdown",
      reason: "generationCircuitOpen",
      countdownMs: 60 * 60 * 1000,
    });
  });
});
