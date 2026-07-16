import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterCheckMode } from "./encounter-check-mode.js";
import {
  EncounterGenerationStateEvent,
  runEncounterGenerationState,
} from "./encounter-generation-state.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

describe("encounter generation attempt evidence", () => {
  it("starts automatic recovery without rewriting the completion-owned primary clock", () => {
    const state = {
      date: Date.now() - 31 * 60 * 1000,
      cycleReadyAt: Date.now() - 55_000,
      anchorReason: "encounterCompleted",
      key: "",
      count: 7,
      clear: true,
      schemaVersion: 4,
      utcDay: "2026-06-27",
      dayPhase: "active",
      invalidCycleCount: 0,
    };
    const application = runEncounterGenerationState(
      {
        type: EncounterGenerationStateEvent.RECORD_RESULT,
        state,
        checkMode: EncounterCheckMode.AUTOMATIC,
        nowMs: Date.now(),
        result: { status: "unavailable", reason: "encounterKeyMissing" },
      },
      { writeState: (next) => ({ ok: true, state: next }) }
    );

    expect(application).toMatchObject({
      application: "automaticCheckFailed",
      state: {
        date: state.date,
        cycleReadyAt: state.cycleReadyAt,
        anchorReason: "encounterCompleted",
        count: 7,
        generationFailureCount: 1,
        generationRecoveryCircuit: 1,
        generationRecoveryStep: 1,
        generationNextAttemptAt: Date.now() + 60_000,
      },
      recovery: {
        status: "countdown",
        reason: "generationBackoff",
        countdownMs: 60_000,
      },
    });
  });

  it("keeps a manual empty check outside automatic recovery", () => {
    const state = {
      date: Date.now(),
      cycleReadyAt: Date.now() + 1_805_000,
      anchorReason: "encounterCompleted",
      key: "",
      count: 7,
      clear: true,
      schemaVersion: 4,
      utcDay: "2026-06-27",
      dayPhase: "active",
      invalidCycleCount: 0,
    };
    const application = runEncounterGenerationState(
      {
        type: EncounterGenerationStateEvent.RECORD_RESULT,
        state,
        checkMode: EncounterCheckMode.MANUAL,
        nowMs: Date.now(),
        result: { status: "unavailable", reason: "encounterKeyMissing" },
      },
      { writeState: (next) => ({ ok: true, state: next }) }
    );

    expect(application).toMatchObject({
      application: "manualEmpty",
      state,
    });
    expect(application.state).not.toHaveProperty("generationFailureCount");
  });
});
