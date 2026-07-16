import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENCOUNTER_COOLDOWN_MS } from "./encounter-day-state.js";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

describe("encounter widget generation recovery", () => {
  it("uses encounter failure, not a probe timer, for authoritative no-key results", () => {
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: { date: Date.now() - 31 * 60 * 1000, key: "", count: 7, clear: true },
      eventpane: "<p>No random encounter is currently available.</p>",
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      status: "countdown",
      reason: "cooldown",
      remainingMs: ENCOUNTER_COOLDOWN_MS,
      state: {
        date: Date.now(),
        cycleReadyAt: Date.now() + ENCOUNTER_COOLDOWN_MS,
        count: 7,
        anchorReason: "encounterFailed",
      },
    });
    expect(outcome.state).not.toHaveProperty("nextProbeAt");
  });

  it("shows primary and technical recovery clocks as independent identities", () => {
    const outcome = planEncounterWidgetEvent({
      type: "widgetTick",
      nowMs: Date.now(),
      state: {
        date: Date.now() - ENCOUNTER_COOLDOWN_MS,
        cycleReadyAt: Date.now(),
        key: "",
        count: 7,
        clear: true,
        schemaVersion: 3,
        utcDay: "2026-06-27",
        generationAttemptKey: "2026-06-27:technical",
        generationFailureCount: 1,
        generationRecoveryCircuit: 1,
        generationRecoveryStep: 1,
        generationNextAttemptAt: Date.now() + 60 * 1000,
        generationFailureReason: "generationRequestFailed",
      },
    });

    expect(outcome).toMatchObject({
      status: "ready",
      reason: "readyWindow",
      remainingMs: 0,
      operationalStatus: "countdown",
      operationalReason: "generationBackoff",
      recoveryStatus: "countdown",
      recoveryRemainingMs: 60 * 1000,
    });
  });

  it("clears technical recovery when an authoritative no-key failure resets the primary cycle", () => {
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: {
        date: Date.now() - 31 * 60 * 1000,
        key: "",
        count: 7,
        clear: true,
        generationAttemptKey: "2026-06-27:technical",
        generationFailureCount: 5,
        generationNextAttemptAt: Date.now() + 3 * 60 * 1000,
        generationFailureReason: "generationRequestFailed",
      },
      eventpane: "<p>No random encounter is currently available.</p>",
      engage: true,
      pageType: "hv",
    });

    expect(outcome.state).toMatchObject({ anchorReason: "encounterFailed" });
    expect(outcome.state).not.toHaveProperty("generationFailureCount");
    expect(outcome.state).not.toHaveProperty("generationNextAttemptAt");
  });

  it("treats the UTC dawn response as the non-counting new-day cooldown anchor", () => {
    vi.setSystemTime(new Date("2026-06-28T00:00:05.000Z"));
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: { date: 0, key: "", count: 0, clear: true },
      eventpane: "<p>It is the dawn of a new day!</p>",
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "dailyResetEvent",
      unavailableReason: "dailyResetEvent",
      status: "countdown",
      reason: "cooldown",
      remainingMs: ENCOUNTER_COOLDOWN_MS,
      state: {
        date: Date.now(),
        key: "",
        count: 0,
        clear: true,
        dayPhase: "active",
        anchorReason: "newDay",
      },
    });
  });
});
