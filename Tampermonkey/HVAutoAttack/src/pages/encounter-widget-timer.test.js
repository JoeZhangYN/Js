import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({
    OPEN_URL: "openUrl",
    RELOAD_NOW: "reloadNow",
    SCHEDULE_RELOAD: "scheduleReload",
  }),
  NavigationRedirectReason: Object.freeze({ ENCOUNTER_ENTRY: "encounterEntry" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

beforeEach(() => {
  mocks.runNavigationAutomation.mockReset();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("encounter widget timer expiry", () => {
  it("counts down to the next UTC day when the daily encounter limit is reached", () => {
    const state = { date: Date.UTC(2026, 5, 27, 23, 45), key: "", count: 24, clear: true };

    expect(
      runEncounterAutomation({
        type: EncounterEvent.WIDGET_TICK,
        state,
      })
    ).toMatchObject({
      status: "countdown",
      remainingMs: 10000,
      reason: "dailyReset",
    });
  });

  it("auto-enters from the widget timer through the encounter entry", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "abc123=", count: 1, clear: false };

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TIMER_ELAPSED,
      state,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "navigated",
      href: "?s=Battle&ss=ba&encounter=abc123=",
      handled: true,
      attemptKey: expect.any(String),
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openUrl",
      reason: "encounterEntry",
      url: "?s=Battle&ss=ba&encounter=abc123=",
    });
  });

  it("backs off ready-window generation after a news load returns no key", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true };

    const first = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TIMER_ELAPSED,
      state,
      pageType: "hv",
    });
    const loaded = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      state: first.state,
      eventpane: "<p>No random encounter is currently available.</p>",
      engage: true,
      pageType: "hv",
    });
    const backedOff = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TIMER_ELAPSED,
      state: loaded.state,
      pageType: "hv",
    });

    expect(first).toMatchObject({
      action: "load",
      engage: true,
      href: "https://e-hentai.org/news.php?encounter",
      attemptKey: expect.any(String),
    });
    expect(loaded).toMatchObject({
      action: "unavailable",
      unavailableReason: "encounterKeyMissing",
      state: { generationFailureCount: 1 },
    });
    expect(backedOff).toMatchObject({
      status: "countdown",
      reason: "generationBackoff",
      attemptKey: first.attemptKey,
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("lets gallery timer expiry request an HV availability check before opening", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "abc123=", count: 1, clear: false };

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TIMER_ELAPSED,
      state,
      pageType: "eh",
    });

    expect(outcome).toMatchObject({
      action: "checkHv",
      engage: true,
      attemptKey: expect.any(String),
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });
});
