import { describe, expect, it, vi } from "vitest";
import {
  EncounterGenerationStateEvent,
  runEncounterGenerationState,
} from "./encounter-generation-state.js";

const COOLDOWN_MS = 30 * 60 * 1000 + 5000;
const START = Date.UTC(2026, 5, 27, 12);
const missing = { status: "unavailable", reason: "encounterKeyMissing" };

function confirmingState(fields = {}) {
  return {
    date: START - COOLDOWN_MS,
    key: "",
    count: 24,
    clear: true,
    schemaVersion: 2,
    utcDay: "2026-06-27",
    dayPhase: "confirmingLimit",
    anchorReason: "encounterCompleted",
    invalidCycleCount: 0,
    ...fields,
  };
}

function record(state, result, nowMs, writeState = vi.fn((next) => ({ ok: true, state: next }))) {
  return runEncounterGenerationState(
    {
      type: EncounterGenerationStateEvent.RECORD_RESULT,
      state,
      result,
      nowMs,
      source: "limitConfirmationTest",
    },
    { writeState }
  );
}

describe("encounter daily limit confirmation", () => {
  it("stops after three persisted authoritative no-key cycles", () => {
    let state = confirmingState();
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      const outcome = record(state, missing, START + cycle * COOLDOWN_MS);
      state = outcome.state;
      expect(outcome).toMatchObject({
        application: "limitProbeEmpty",
        persisted: true,
        blocked: false,
        state: { count: 24, invalidCycleCount: cycle },
      });
    }
    expect(state.dayPhase).toBe("stoppedForDay");
  });

  it("keeps transport and persistence Unknown outside the empty-cycle count", () => {
    const state = confirmingState({ invalidCycleCount: 1 });
    const transport = record(
      state,
      { status: "transportFailure", reason: "generationRequestTimeout" },
      START
    );
    const rejected = record(
      state,
      missing,
      START,
      vi.fn(() => ({ ok: false }))
    );

    expect(transport).toMatchObject({
      application: "failure",
      state: { invalidCycleCount: 1, generationFailureCount: 1 },
    });
    expect(rejected).toMatchObject({
      application: "limitProbeEmpty",
      status: "persistenceFailed",
      persisted: false,
      blocked: true,
      state: { invalidCycleCount: 2 },
    });
    expect(state.invalidCycleCount).toBe(1);
  });
});
