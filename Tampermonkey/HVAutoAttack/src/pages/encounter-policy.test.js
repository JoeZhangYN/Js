import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000;
const ENCOUNTER_MIDNIGHT_GRACE_MS = 5000;

describe("runEncounterPolicy time contract", () => {
  it("rejects unknown and null policy events without deriving a decision", () => {
    expect(
      runEncounterPolicy({ type: "unknown", state: { key: "abc", clear: false } })
    ).toBeUndefined();
    expect(runEncounterPolicy(null)).toBeUndefined();
  });

  it("resets stored random encounter state across UTC days", () => {
    const state = { date: Date.UTC(2026, 5, 26, 23, 59), key: "abc", count: 7, clear: false };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.NORMALIZE,
        state,
        nowMs: Date.UTC(2026, 5, 27, 0, 0, 5),
      })
    ).toEqual({
      date: 0,
      key: "",
      count: 0,
      clear: true,
    });
  });

  it("makes the next UTC day immediately ready for the same encounter check flow", () => {
    const state = { date: Date.UTC(2026, 5, 26, 23, 59), key: "", count: 24, clear: true };
    const nowMs = Date.UTC(2026, 5, 27, 0, 0, 5);

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs,
      })
    ).toMatchObject({
      remainingMs: 0,
      canEnter: false,
      dailyLimitReached: false,
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_NEXT_CHECK,
        state,
        nowMs,
        jitter: 1,
      })
    ).toMatchObject({
      delayMs: ENCOUNTER_MIDNIGHT_GRACE_MS,
      reason: "readyWindow",
      status: "ready",
    });
  });

  it("uses one thirty-minute readiness window", () => {
    const state = { date: 1000, key: "", count: 1, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: 1000 + ENCOUNTER_INTERVAL_MS / 3,
      }).remainingMs
    ).toBe((ENCOUNTER_INTERVAL_MS * 2) / 3);
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: 1000 + ENCOUNTER_INTERVAL_MS,
      }).remainingMs
    ).toBe(0);
  });

  it("treats an available encounter key as ready instead of counting another cooldown", () => {
    const state = { date: 1000, key: "abc123=", count: 1, clear: false };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: 1000 + ENCOUNTER_INTERVAL_MS / 3,
      })
    ).toMatchObject({
      canEnter: true,
      status: "ready",
      countdownMs: 0,
      reason: "keyAvailable",
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_ACTIVATION,
        state,
        nowMs: 1000 + ENCOUNTER_INTERVAL_MS / 3,
      })
    ).toMatchObject({
      action: "enter",
      href: "?s=Battle&ss=ba&encounter=abc123=",
    });
  });

  it("uses one query for countdown, daily limit, and scheduled checks", () => {
    const state = {
      date: Date.UTC(2026, 5, 26, 23, 45),
      key: "",
      count: 24,
      clear: true,
    };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: Date.UTC(2026, 5, 26, 23, 59, 59),
      })
    ).toMatchObject({
      remainingMs: 901000,
      canEnter: false,
      dailyLimitReached: true,
      status: "countdown",
      countdownMs: 1000 + ENCOUNTER_MIDNIGHT_GRACE_MS,
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_NEXT_CHECK,
        state,
        nowMs: Date.UTC(2026, 5, 26, 23, 59, 59),
        jitter: 1,
      })
    ).toMatchObject({
      delayMs: 1000 + ENCOUNTER_MIDNIGHT_GRACE_MS,
      reason: "dailyReset",
      status: "countdown",
    });
  });

  it("reports the daily reset as the countdown deadline at the daily limit", () => {
    const state = {
      date: Date.UTC(2026, 5, 26, 23, 45),
      key: "",
      count: 24,
      clear: true,
    };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state,
        nowMs: Date.UTC(2026, 5, 26, 23, 59, 55),
      })
    ).toMatchObject({
      status: "countdown",
      countdownMs: 10000,
      reason: "dailyReset",
      dailyLimitReached: true,
    });
  });
});
