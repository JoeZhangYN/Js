import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENCOUNTER_COOLDOWN_MS } from "./encounter-day-state.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

describe("encounter generation attempt evidence", () => {
  it("anchors an authoritative no-key failure to a new primary encounter cycle", () => {
    const application = runEncounterPolicy({
      type: EncounterPolicyEvent.APPLY_GENERATION_RESULT,
      state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 7, clear: true },
      nowMs: Date.now(),
      result: { status: "unavailable", reason: "encounterKeyMissing" },
    });

    expect(application).toMatchObject({
      application: "encounterFailed",
      state: {
        date: Date.now(),
        cycleReadyAt: Date.now() + ENCOUNTER_COOLDOWN_MS,
        anchorReason: "encounterFailed",
        count: 7,
      },
    });
    expect(application.state).not.toHaveProperty("nextProbeAt");
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state: application.state,
        nowMs: Date.now() + 1000,
      })
    ).toMatchObject({
      status: "countdown",
      reason: "cooldown",
      countdownMs: ENCOUNTER_COOLDOWN_MS - 1000,
    });
  });
});
