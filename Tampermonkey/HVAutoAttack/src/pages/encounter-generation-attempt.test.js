import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("encounter generation attempt evidence", () => {
  it("does not start encounter cooldown or count when generation returns no encounter key", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "", count: 7, clear: true };

    const next = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED,
      state,
      nowMs: Date.now(),
    });

    expect(next).toMatchObject({
      date: state.date,
      key: "",
      count: 7,
      clear: true,
      generationFailureCount: 1,
      generationFailureReason: "encounterKeyMissing",
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state: next,
        nowMs: Date.now() + 1000,
      })
    ).toMatchObject({ status: "countdown", reason: "generationBackoff", countdownMs: 299000 });
  });
});
