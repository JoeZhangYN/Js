import { describe, expect, it } from "vitest";
import { ENCOUNTER_BASE_COOLDOWN_MS } from "./encounter-day-state.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const failGeneration = (state, attemptKey, nowMs) =>
  runEncounterPolicy({
    type: EncounterPolicyEvent.MARK_GENERATION_FAILED,
    state,
    attemptKey,
    nowMs,
    reason: "generationRequestTimeout",
  });

describe("encounter generation recovery", () => {
  it("keeps technical recovery separate from the primary encounter deadline", () => {
    const nowMs = Date.UTC(2026, 5, 27, 12);
    const cycleReadyAt = nowMs + 20 * 60 * 1000;
    const state = failGeneration(
      { date: nowMs - 10 * 60 * 1000, cycleReadyAt, key: "", count: 0, clear: true },
      "2026-06-27:primary",
      nowMs
    );

    expect(state).toMatchObject({
      cycleReadyAt,
      generationFailureCount: 1,
      generationRecoveryCircuit: 1,
      generationRecoveryStep: 1,
      generationNextAttemptAt: nowMs + 60 * 1000,
    });
    expect(
      runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state, nowMs })
    ).toMatchObject({
      primaryReason: "cooldown",
      primaryCountdownMs: 20 * 60 * 1000,
      recoveryReason: "generationBackoff",
      recoveryCountdownMs: 60 * 1000,
      reason: "cooldown",
    });
  });

  it("keeps one recovery episode when the independent primary clock becomes ready", () => {
    const start = Date.UTC(2026, 5, 27, 12);
    const original = {
      date: start - ENCOUNTER_BASE_COOLDOWN_MS + 30 * 1000,
      cycleReadyAt: start + 30 * 1000,
      key: "",
      count: 0,
      clear: true,
    };
    const firstClock = runEncounterPolicy({
      type: EncounterPolicyEvent.READ_CLOCK,
      state: original,
      nowMs: start,
    });
    const first = failGeneration(original, firstClock.attemptKey, start);
    const secondClock = runEncounterPolicy({
      type: EncounterPolicyEvent.READ_CLOCK,
      state: first,
      nowMs: start + 60 * 1000,
    });
    const second = failGeneration(first, secondClock.attemptKey, start + 60 * 1000);

    expect(secondClock.primaryStatus).toBe("ready");
    expect(secondClock.attemptKey).toBe(firstClock.attemptKey);
    expect(second).toMatchObject({
      generationFailureCount: 2,
      generationRecoveryStep: 2,
      generationNextAttemptAt: start + 4 * 60 * 1000,
    });
  });

  it("runs two 1/3/5 minute recovery rounds before a typed circuit response", () => {
    const start = Date.UTC(2026, 5, 27, 12);
    let nowMs = start;
    let state = { date: 0, cycleReadyAt: 0, key: "", count: 0, clear: true };
    const attemptKey = runEncounterPolicy({
      type: EncounterPolicyEvent.READ_CLOCK,
      state,
      nowMs,
    }).attemptKey;
    const expected = [
      { count: 1, circuit: 1, step: 1, wait: 60 * 1000 },
      { count: 2, circuit: 1, step: 2, wait: 3 * 60 * 1000 },
      { count: 3, circuit: 1, step: 3, wait: 5 * 60 * 1000 },
      { count: 4, circuit: 2, step: 1, wait: 60 * 1000 },
      { count: 5, circuit: 2, step: 2, wait: 3 * 60 * 1000 },
      { count: 6, circuit: 2, step: 3, wait: 5 * 60 * 1000 },
    ];

    for (const phase of expected) {
      state = failGeneration(state, attemptKey, nowMs);
      expect(state).toMatchObject({
        generationFailureCount: phase.count,
        generationRecoveryCircuit: phase.circuit,
        generationRecoveryStep: phase.step,
      });
      const deadline = state.generationNextAttemptAt || state.generationCircuitOpenUntil;
      expect(deadline).toBe(nowMs + phase.wait);
      nowMs = deadline;
    }

    expect(state.generationCircuitTerminal).toBe(true);
    expect(
      runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state, nowMs })
    ).toMatchObject({ status: "responseDue", reason: "generationCircuitResponse" });

    const resolved = runEncounterPolicy({
      type: EncounterPolicyEvent.RESOLVE_GENERATION_CIRCUIT,
      state,
      nowMs,
      random: () => 0.5,
    });
    expect(resolved).toMatchObject({
      date: nowMs,
      cycleReadyAt: nowMs + ENCOUNTER_BASE_COOLDOWN_MS + 15 * 1000,
      anchorReason: "circuitResponse",
    });
    expect(resolved).not.toHaveProperty("generationFailureCount");
    expect(resolved).not.toHaveProperty("generationCircuitOpenUntil");
  });
});
