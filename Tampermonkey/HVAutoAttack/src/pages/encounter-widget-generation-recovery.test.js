import { beforeEach, describe, expect, it, vi } from "vitest";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

describe("encounter widget generation recovery", () => {
  it("backs off ready-window generation after a main-world news load returns no encounter key", () => {
    const date = Date.now() - 31 * 60 * 1000;
    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: { date, key: "", count: 7, clear: true },
      eventpane: "<p>No random encounter is currently available.</p>",
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      status: "countdown",
      reason: "generationBackoff",
      remainingMs: 5 * 60 * 1000,
      state: {
        generationAttemptKey: `2026-06-27:${date}::true:ready`,
        generationFailureCount: 1,
        generationNextAttemptAt: Date.now() + 5 * 60 * 1000,
        generationFailureReason: "encounterKeyMissing",
      },
    });
  });

  it("backs off repeated main-world news generation inside the same ready window", () => {
    const date = Date.now() - 31 * 60 * 1000;
    const attemptKey = `2026-06-27:${date}::true:ready`;

    expect(
      planEncounterWidgetEvent({
        type: "widgetTimerElapsed",
        state: {
          date,
          key: "",
          count: 7,
          clear: true,
          generationAttemptKey: attemptKey,
          generationFailureCount: 1,
          generationNextAttemptAt: Date.now() + 5 * 60 * 1000,
          generationFailureReason: "encounterKeyMissing",
        },
        pageType: "hv",
      })
    ).toMatchObject({
      status: "countdown",
      reason: "generationBackoff",
      state: { generationAttemptKey: attemptKey },
    });
  });

  it("opens the circuit after repeated same-window generation failures", () => {
    const date = Date.now() - 31 * 60 * 1000;
    const attemptKey = `2026-06-27:${date}::true:ready`;

    const outcome = planEncounterWidgetEvent({
      type: "widgetNewsLoaded",
      state: {
        date,
        key: "",
        count: 7,
        clear: true,
        generationAttemptKey: attemptKey,
        generationFailureCount: 2,
      },
      eventpane: "<p>No random encounter is currently available.</p>",
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      status: "countdown",
      reason: "generationCircuitOpen",
      remainingMs: 60 * 60 * 1000,
      state: {
        generationAttemptKey: attemptKey,
        generationFailureCount: 3,
        generationCircuitOpenUntil: Date.now() + 60 * 60 * 1000,
        generationFailureReason: "encounterKeyMissing",
      },
    });
  });

  it("treats the CST 8 daily dawn event as a distinct generation failure with backoff", () => {
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
      reason: "generationBackoff",
      remainingMs: 5 * 60 * 1000,
      state: {
        date: 0,
        key: "",
        count: 0,
        clear: true,
        generationFailureCount: 1,
        generationFailureReason: "dailyResetEvent",
      },
    });
  });
});
