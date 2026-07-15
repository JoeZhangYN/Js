import { beforeEach, describe, expect, it, vi } from "vitest";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

beforeEach(() => {
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

describe("encounter widget generation recovery", () => {
  it("schedules a full encounter probe cycle when main-world news has no encounter key", () => {
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
      reason: "probeCycle",
      remainingMs: 30 * 60 * 1000 + 5000,
      state: {
        date,
        count: 7,
        nextProbeAt: Date.now() + 30 * 60 * 1000 + 5000,
        probeReason: "encounterKeyMissing",
        probeAttemptKey: `2026-06-27:${date}::true:ready`,
      },
    });
  });

  it("keeps repeated main-world checks inside the same full probe cycle", () => {
    const date = Date.now() - 31 * 60 * 1000;
    const nextProbeAt = Date.now() + 30 * 60 * 1000 + 5000;

    expect(
      planEncounterWidgetEvent({
        type: "widgetTimerElapsed",
        state: {
          date,
          key: "",
          count: 7,
          clear: true,
          nextProbeAt,
          probeReason: "encounterKeyMissing",
        },
        pageType: "hv",
      })
    ).toMatchObject({
      status: "countdown",
      reason: "probeCycle",
      remainingMs: 30 * 60 * 1000 + 5000,
      state: { nextProbeAt, probeReason: "encounterKeyMissing" },
    });
  });

  it("never opens the fault circuit for repeated authoritative no-key results", () => {
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
      reason: "probeCycle",
      remainingMs: 30 * 60 * 1000 + 5000,
      state: {
        nextProbeAt: Date.now() + 30 * 60 * 1000 + 5000,
        probeReason: "encounterKeyMissing",
        probeAttemptKey: attemptKey,
      },
    });
    expect(outcome.state).not.toHaveProperty("generationCircuitOpenUntil");
    expect(outcome.state).not.toHaveProperty("generationFailureCount");
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
      remainingMs: 30 * 60 * 1000 + 5000,
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
