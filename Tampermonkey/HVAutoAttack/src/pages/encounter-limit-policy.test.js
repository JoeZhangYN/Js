import { describe, expect, it } from "vitest";
import {
  EncounterGenerationFailureReason,
  EncounterGenerationResultStatus,
} from "./encounter-generation-result.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const COOLDOWN_MS = 30 * 60 * 1000 + 5000;
const DAY = Date.UTC(2026, 5, 27, 12);
const missing = {
  status: EncounterGenerationResultStatus.UNAVAILABLE,
  reason: EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING,
};
const policy = (type, state, fields = {}) => runEncounterPolicy({ type, state, ...fields });
const confirming = (fields = {}) => ({
  date: DAY - COOLDOWN_MS,
  key: "",
  count: 24,
  clear: true,
  dayPhase: "confirmingLimit",
  utcDay: "2026-06-27",
  invalidCycleCount: 0,
  ...fields,
});

describe("encounter limit policy", () => {
  it("stops only after three complete authoritative empty cycles beyond the 24th completion", () => {
    let state = policy(
      EncounterPolicyEvent.MARK_COMPLETED,
      { ...confirming(), count: 23 },
      { nowMs: DAY }
    );
    expect(state).toMatchObject({ count: 24, dayPhase: "confirmingLimit" });

    for (let cycle = 1; cycle <= 3; cycle += 1) {
      const applied = policy(EncounterPolicyEvent.APPLY_GENERATION_RESULT, state, {
        result: missing,
        nowMs: DAY + cycle * COOLDOWN_MS,
      });
      state = applied.state;
      expect(applied.application).toBe("limitProbeEmpty");
      expect(state).toMatchObject({
        count: 24,
        invalidCycleCount: cycle,
        anchorReason: "limitProbe",
      });
    }

    expect(state.dayPhase).toBe("stoppedForDay");
  });

  it("does not count transport Unknown as an empty daily-limit cycle", () => {
    const state = confirming({ invalidCycleCount: 1 });
    const applied = policy(EncounterPolicyEvent.APPLY_GENERATION_RESULT, state, {
      nowMs: DAY,
      result: {
        status: EncounterGenerationResultStatus.TRANSPORT_FAILURE,
        reason: EncounterGenerationFailureReason.REQUEST_TIMEOUT,
      },
    });

    expect(applied.application).toBe("failure");
    expect(applied.state.invalidCycleCount).toBe(1);
    expect(applied.state.date).toBe(state.date);
  });

  it("accepts an unexpected key while confirming and keeps the completion count capped", () => {
    const available = policy(
      EncounterPolicyEvent.APPLY_GENERATION_RESULT,
      confirming({ invalidCycleCount: 2 }),
      {
        nowMs: DAY,
        result: { status: EncounterGenerationResultStatus.AVAILABLE, key: "abc=" },
      }
    );
    const completed = policy(EncounterPolicyEvent.MARK_COMPLETED, available.state, {
      nowMs: DAY + 1000,
    });

    expect(available).toMatchObject({
      application: "available",
      state: { key: "abc=", clear: false, invalidCycleCount: 2 },
    });
    expect(completed).toMatchObject({
      count: 24,
      invalidCycleCount: 0,
      dayPhase: "confirmingLimit",
      anchorReason: "encounterCompleted",
    });
  });
});
