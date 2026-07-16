import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ OPEN_URL: "openUrl" }),
  NavigationRedirectReason: Object.freeze({ ENCOUNTER_ENTRY: "encounterEntry" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

beforeEach(() => {
  mocks.runNavigationAutomation.mockReset();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

const state = (fields = {}) => ({
  date: Date.now(),
  cycleReadyAt: Date.now() + 1_805_000,
  anchorReason: "encounterCompleted",
  key: "",
  count: 4,
  clear: true,
  schemaVersion: 4,
  utcDay: "2026-06-27",
  dayPhase: "active",
  invalidCycleCount: 0,
  ...fields,
});

describe("encounter widget timer identity", () => {
  it("keeps the one-second widget tick projection-only", () => {
    const current = state();
    const outcome = runEncounterAutomation({ type: EncounterEvent.WIDGET_TICK, state: current });

    expect(outcome).toMatchObject({
      status: "countdown",
      remainingMs: 1_805_000,
      state: current,
    });
    expect(outcome).not.toHaveProperty("action");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(EncounterEvent).not.toHaveProperty("WIDGET_TIMER_ELAPSED");
  });

  it("rejects the retired timer-elapsed bypass", () => {
    expect(
      runEncounterAutomation({ type: "widgetTimerElapsed", state: state(), pageType: "hv" })
    ).toMatchObject({ rejected: true, reason: "unknownEncounterEvent" });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("lets a manual click check immediately without moving any counters or clocks when empty", () => {
    const current = state({ count: 24, dayPhase: "confirmingLimit", invalidCycleCount: 2 });
    const clicked = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state: current,
      pageType: "hv",
    });
    const loaded = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      state: clicked.state,
      eventpane: "<p>No random encounter is currently available.</p>",
      eventpanePresent: true,
      checkMode: clicked.checkMode,
      pageType: "hv",
    });

    expect(clicked).toMatchObject({ action: "load", checkMode: "manual" });
    expect(loaded).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      state: current,
    });
    expect(loaded.state).not.toHaveProperty("generationFailureCount");
  });

  it("enters a battle found by a manual check and leaves counting to battle terminal", () => {
    const current = state();
    const clicked = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state: current,
      pageType: "hv",
    });
    const loaded = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      state: clicked.state,
      eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=ready123=">Random Encounter</a>',
      eventpanePresent: true,
      checkMode: clicked.checkMode,
      pageType: "hv",
    });

    expect(loaded).toMatchObject({
      action: "navigated",
      handled: true,
      href: "?s=Battle&ss=ba&encounter=ready123=",
      state: { count: 4, date: current.date, cycleReadyAt: current.cycleReadyAt },
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledOnce();
  });
});
