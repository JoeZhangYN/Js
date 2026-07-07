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
  it("records a missing-key generation attempt as cooldown evidence without counting an encounter", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "", count: 7, clear: true };

    const next = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED,
      state,
      nowMs: Date.now(),
    });

    expect(next).toEqual({ date: Date.now(), key: "", count: 7, clear: true });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state: next,
        nowMs: Date.now() + 1000,
      })
    ).toMatchObject({ status: "countdown", reason: "cooldown" });
  });
});
