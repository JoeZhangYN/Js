import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENCOUNTER_COOLDOWN_MS } from "./encounter-day-state.js";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

describe("encounter widget generation recovery", () => {
  it("keeps a manual authoritative empty result outside both clocks", () => {
    const date = Date.now() - 31 * 60 * 1000;
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: { date, key: "", count: 7, clear: true },
      eventpane: "<p>No random encounter is currently available.</p>",
      eventpanePresent: true,
      checkMode: "manual",
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      status: "ready",
      reason: "readyWindow",
      remainingMs: 0,
      state: {
        date,
        cycleReadyAt: date + ENCOUNTER_COOLDOWN_MS,
        count: 7,
        anchorReason: "encounterCompleted",
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

  it("preserves an active automatic recovery when a manual check is empty", () => {
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: {
        date: Date.now() - 31 * 60 * 1000,
        key: "",
        count: 7,
        clear: true,
        schemaVersion: 4,
        utcDay: "2026-06-27",
        dayPhase: "active",
        invalidCycleCount: 0,
        generationAttemptKey: "2026-06-27:technical",
        generationFailureCount: 5,
        generationNextAttemptAt: Date.now() + 3 * 60 * 1000,
        generationFailureReason: "generationRequestFailed",
      },
      eventpane: "<p>No random encounter is currently available.</p>",
      eventpanePresent: true,
      checkMode: "manual",
      pageType: "hv",
    });

    expect(outcome.state).toMatchObject({
      generationFailureCount: 5,
      generationNextAttemptAt: Date.now() + 3 * 60 * 1000,
    });
  });

  it("treats the UTC dawn response as the non-counting new-day cooldown anchor", () => {
    vi.setSystemTime(new Date("2026-06-28T00:00:05.000Z"));
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: { date: 0, key: "", count: 0, clear: true },
      eventpane: "<p>It is the dawn of a new day!</p>",
      eventpanePresent: true,
      checkMode: "manual",
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
