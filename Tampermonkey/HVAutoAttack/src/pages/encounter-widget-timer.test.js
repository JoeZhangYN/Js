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

  it("requests one ready-window generation load when the timer elapses without a key", () => {
    const state = { date: Date.now() - 31 * 60 * 1000, key: "", count: 1, clear: true };

    const first = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TIMER_ELAPSED,
      state,
      pageType: "hv",
    });
    const second = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TIMER_ELAPSED,
      state,
      pageType: "hv",
      lastAttemptKey: first.attemptKey,
    });

    expect(first).toMatchObject({
      action: "load",
      engage: true,
      href: "https://e-hentai.org/news.php?encounter",
      attemptKey: expect.any(String),
    });
    expect(second).toMatchObject({ action: "none", attemptKey: first.attemptKey });
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
