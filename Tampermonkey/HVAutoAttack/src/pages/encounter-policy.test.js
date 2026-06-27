import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000;
const ENCOUNTER_MIDNIGHT_GRACE_MS = 5000;

describe("runEncounterPolicy time contract", () => {
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
        type: EncounterPolicyEvent.READINESS,
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
        type: EncounterPolicyEvent.NEXT_CHECK_DELAY,
        state,
        nowMs,
        jitter: 1,
      })
    ).toBe(ENCOUNTER_MIDNIGHT_GRACE_MS);
  });

  it("uses one thirty-minute readiness window", () => {
    const state = { date: 1000, key: "", count: 1, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READINESS,
        state,
        nowMs: 1000 + ENCOUNTER_INTERVAL_MS / 3,
      }).remainingMs
    ).toBe((ENCOUNTER_INTERVAL_MS * 2) / 3);
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READINESS,
        state,
        nowMs: 1000 + ENCOUNTER_INTERVAL_MS,
      }).remainingMs
    ).toBe(0);
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
        type: EncounterPolicyEvent.READINESS,
        state,
        nowMs: Date.UTC(2026, 5, 26, 23, 59, 59),
      })
    ).toMatchObject({
      remainingMs: 901000,
      canEnter: false,
      dailyLimitReached: true,
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.NEXT_CHECK_DELAY,
        state,
        nowMs: Date.UTC(2026, 5, 26, 23, 59, 59),
        jitter: 1,
      })
    ).toBe(1000 + ENCOUNTER_MIDNIGHT_GRACE_MS);
  });
});
