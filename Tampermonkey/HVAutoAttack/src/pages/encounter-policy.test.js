import { describe, expect, it } from "vitest";
import {
  buildEncounterUrl,
  canEnterEncounterState,
  ENCOUNTER_MIDNIGHT_GRACE_MS,
  ENCOUNTER_INTERVAL_MS,
  markEncounterKeyAvailable,
  markEncounterStarted,
  msUntilNextEncounterCheck,
  msUntilEncounterReady,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  parseEncounterKeyFromSearch,
  planEncounterActivation,
  readEncounterReadiness,
} from "./encounter-policy.js";

describe("encounter policy", () => {
  it("resets stored random encounter state across UTC days", () => {
    const state = { date: Date.UTC(2026, 5, 26, 23, 59), key: "abc", count: 7, clear: false };
    expect(normalizeEncounterState(state, Date.UTC(2026, 5, 27, 0, 0, 5))).toEqual({
      date: 0,
      key: "",
      count: 0,
      clear: true,
    });
  });

  it("makes the next UTC day immediately ready for the same encounter check flow", () => {
    const state = { date: Date.UTC(2026, 5, 26, 23, 59), key: "", count: 24, clear: true };
    const nowMs = Date.UTC(2026, 5, 27, 0, 0, 5);
    expect(readEncounterReadiness(state, nowMs)).toMatchObject({
      remainingMs: 0,
      canEnter: false,
      dailyLimitReached: false,
    });
    expect(msUntilNextEncounterCheck(state, { nowMs, jitter: 1 })).toBe(
      ENCOUNTER_MIDNIGHT_GRACE_MS
    );
  });

  it("uses one thirty-minute readiness window", () => {
    const state = { date: 1000, key: "", count: 1, clear: true };
    expect(msUntilEncounterReady(state, 1000 + ENCOUNTER_INTERVAL_MS / 3)).toBe(
      (ENCOUNTER_INTERVAL_MS * 2) / 3
    );
    expect(msUntilEncounterReady(state, 1000 + ENCOUNTER_INTERVAL_MS)).toBe(0);
  });

  it("uses the same readiness query for countdown, daily limit, and scheduled checks", () => {
    const state = {
      date: Date.UTC(2026, 5, 26, 23, 45),
      key: "",
      count: 24,
      clear: true,
    };
    expect(readEncounterReadiness(state, Date.UTC(2026, 5, 26, 23, 59, 59))).toMatchObject({
      remainingMs: 901000,
      canEnter: false,
      dailyLimitReached: true,
    });
    expect(
      msUntilNextEncounterCheck(state, {
        nowMs: Date.UTC(2026, 5, 26, 23, 59, 59),
        jitter: 1,
      })
    ).toBe(1000 + ENCOUNTER_MIDNIGHT_GRACE_MS);
  });

  it("parses and builds the encounter route in one place", () => {
    expect(parseEncounterKeyFromSearch("?s=Battle&ss=ba&encounter=abc123=")).toBe("abc123=");
    expect(
      parseEncounterKeyFromEventpaneHtml('<a href="?s=Battle&amp;ss=ba&amp;encounter=xyz=">RE</a>')
    ).toBe("xyz=");
    expect(buildEncounterUrl("abc123=")).toBe("?s=Battle&ss=ba&encounter=abc123=");
  });

  it("marks available and started encounter states without double-counting the same key", () => {
    const available = markEncounterKeyAvailable(
      { date: 0, key: "", count: 0, clear: true },
      "abc",
      1000
    );
    expect(canEnterEncounterState(available, 1000)).toBe(true);
    expect(available.count).toBe(1);

    const started = markEncounterStarted(available, {
      search: "?s=Battle&ss=ba&encounter=abc",
      nowMs: 2000,
    });
    expect(started).toEqual({ date: 1000, key: "abc", count: 1, clear: true });
  });

  it("plans manual and automatic encounter entry from the same activation rule", () => {
    const available = { date: 1000, key: "abc", count: 1, clear: false };
    expect(planEncounterActivation(available, { nowMs: 2000 })).toMatchObject({
      action: "enter",
      href: "?s=Battle&ss=ba&encounter=abc",
    });

    const cleared = { date: 1000, key: "abc", count: 1, clear: true };
    expect(planEncounterActivation(cleared, { nowMs: 2000 })).toMatchObject({
      action: "load",
    });
    expect(planEncounterActivation(cleared, { force: true, nowMs: 2000 })).toMatchObject({
      action: "enter",
      href: "?s=Battle&ss=ba&encounter=abc",
    });
  });
});
