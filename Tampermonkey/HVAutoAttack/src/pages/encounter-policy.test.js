import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const COOLDOWN_MS = 30 * 60 * 1000 + 5000;
const DAY = Date.UTC(2026, 5, 27, 0, 0, 5);

function policy(type, state, fields = {}) {
  return runEncounterPolicy({ type, state, ...fields });
}

describe("runEncounterPolicy encounter day contract", () => {
  it("rejects unknown and null policy events without deriving a decision", () => {
    expect(runEncounterPolicy({ type: "unknown", state: {} })).toBeUndefined();
    expect(runEncounterPolicy(null)).toBeUndefined();
  });

  it("moves a previous UTC day into one awaiting-new-day phase", () => {
    const state = { date: DAY - 60_000, key: "old", count: 24, clear: false };
    const normalized = policy(EncounterPolicyEvent.NORMALIZE, state, { nowMs: DAY });

    expect(normalized).toMatchObject({
      date: 0,
      count: 0,
      entry: { phase: "idle", key: "", sessionId: null },
      utcDay: "2026-06-27",
      dayPhase: "awaitingNewDay",
      anchorReason: null,
      invalidCycleCount: 0,
    });
    expect(policy(EncounterPolicyEvent.READ_CLOCK, normalized, { nowMs: DAY })).toMatchObject({
      status: "ready",
      reason: "awaitingNewDay",
      generationDue: true,
    });
  });

  it("observes dawn once, does not count it, and anchors a 30 minute 5 second cooldown", () => {
    const awaiting = policy(EncounterPolicyEvent.BEGIN_NEW_DAY, {}, { nowMs: DAY });
    const observed = policy(EncounterPolicyEvent.OBSERVE_NEW_DAY, awaiting, { nowMs: DAY });
    const duplicate = policy(EncounterPolicyEvent.OBSERVE_NEW_DAY, observed, {
      nowMs: DAY + 1000,
    });

    expect(observed).toMatchObject({
      date: DAY,
      count: 0,
      dayPhase: "active",
      anchorReason: "newDay",
    });
    expect(duplicate.date).toBe(DAY);
    expect(policy(EncounterPolicyEvent.READ_CLOCK, observed, { nowMs: DAY })).toMatchObject({
      status: "countdown",
      countdownMs: COOLDOWN_MS,
      reason: "cooldown",
    });
  });

  it("starts cooldown only when an encounter reaches a terminal completion", () => {
    const state = policy(EncounterPolicyEvent.DEFAULT_STATE, undefined, { nowMs: DAY });
    const started = policy(EncounterPolicyEvent.MARK_ENTRY_STARTED, state, {
      session: { sessionId: "session-1", phase: "active", identity: { roundType: "ba" } },
      nowMs: DAY,
    });
    const completed = policy(EncounterPolicyEvent.MARK_COMPLETED, started, {
      session: {
        sessionId: "session-1",
        phase: "terminal",
        identity: { roundType: "ba" },
        outcome: "victory",
      },
      nowMs: DAY,
    });

    expect(started).toMatchObject({ date: 0, count: 0 });
    expect(completed).toMatchObject({
      status: "completed",
      counted: true,
      state: { date: DAY, count: 1, anchorReason: "encounterCompleted" },
    });
    expect(
      policy(EncounterPolicyEvent.READ_CLOCK, completed.state, {
        nowMs: DAY + 30 * 60 * 1000,
      }).remainingMs
    ).toBe(5000);
    expect(
      policy(EncounterPolicyEvent.READ_CLOCK, completed.state, { nowMs: DAY + COOLDOWN_MS })
        .remainingMs
    ).toBe(0);
  });

  it("treats an available encounter key as ready instead of counting another cooldown", () => {
    const clock = policy(
      EncounterPolicyEvent.READ_CLOCK,
      { date: DAY, key: "abc=", count: 7, clear: false },
      { nowMs: DAY + 1000 }
    );

    expect(clock).toMatchObject({
      status: "ready",
      reason: "keyAvailable",
      countdownMs: 0,
      state: { count: 7 },
    });
  });
});
