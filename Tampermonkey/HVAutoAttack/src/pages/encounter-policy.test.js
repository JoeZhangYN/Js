import { describe, expect, it } from "vitest";
import {
  buildEncounterUrl,
  canEnterEncounterState,
  ENCOUNTER_INTERVAL_MS,
  markEncounterKeyAvailable,
  markEncounterStarted,
  msUntilEncounterReady,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  parseEncounterKeyFromSearch,
} from "./encounter-policy.js";

describe("encounter policy", () => {
  it("resets stored random encounter state across UTC days", () => {
    const state = { date: Date.UTC(2026, 5, 26, 23, 59), key: "abc", count: 7, clear: false };
    expect(normalizeEncounterState(state, Date.UTC(2026, 5, 27, 0, 0, 5))).toEqual({
      date: Date.UTC(2026, 5, 27, 0, 0, 5),
      key: "",
      count: 0,
      clear: true,
    });
  });

  it("uses one thirty-minute readiness window", () => {
    const state = { date: 1000, key: "", count: 1, clear: true };
    expect(msUntilEncounterReady(state, 1000 + ENCOUNTER_INTERVAL_MS / 3)).toBe(
      (ENCOUNTER_INTERVAL_MS * 2) / 3
    );
    expect(msUntilEncounterReady(state, 1000 + ENCOUNTER_INTERVAL_MS)).toBe(0);
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
});
