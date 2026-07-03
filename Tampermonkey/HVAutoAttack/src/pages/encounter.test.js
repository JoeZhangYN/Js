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

const HVUT_RE_KEY = ["hvut", "re"].join("_");

beforeEach(() => {
  localStorage.clear();
  mocks.runNavigationAutomation.mockReset();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runEncounterAutomation", () => {
  it("owns the next lobby check timer from the same readiness query", async () => {
    const rerun = vi.fn();
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.now(),
        key: "",
        count: 24,
        clear: true,
      })
    );

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun,
    });

    expect(outcome.claimed).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    await vi.runOnlyPendingTimersAsync();
    expect(rerun).toHaveBeenCalledTimes(1);
  });

  it("routes lobby auto-entry through the same encounter entry executor", async () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.now() - 31 * 60 * 1000,
        key: "abc123=",
        count: 1,
        clear: false,
      })
    );

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: vi.fn(),
    });

    expect(outcome).toMatchObject({
      action: "navigated",
      href: "?s=Battle&ss=ba&encounter=abc123=",
      handled: true,
      claimed: true,
      state: { key: "abc123=", clear: true },
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openUrl",
      reason: "encounterEntry",
      url: "?s=Battle&ss=ba&encounter=abc123=",
    });
  });

  it("serves the widget countdown from the same UTC day readiness", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_TICK,
      state: {
        date: Date.UTC(2026, 5, 26, 23, 59),
        key: "",
        count: 24,
        clear: true,
      },
    });

    expect(outcome).toMatchObject({
      remainingMs: 0,
      count: 0,
      status: "ready",
    });
  });

  it("handles HV widget click navigation through the encounter entry", () => {
    const state = { date: Date.now(), key: "abc123=", count: 1, clear: false };

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "navigated",
      href: "?s=Battle&ss=ba&encounter=abc123=",
      handled: true,
      state: { key: "abc123=", clear: true },
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openUrl",
      reason: "encounterEntry",
      url: "?s=Battle&ss=ba&encounter=abc123=",
    });
  });

  it("turns a loaded news encounter into the same handled engage action", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      state: { date: 0, key: "", count: 0, clear: true },
      eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=xyz=">RE</a>',
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "navigated",
      href: "?s=Battle&ss=ba&encounter=xyz=",
      handled: true,
      state: { key: "xyz=", count: 1, clear: true },
    });
  });

  it("handles e-hentai widget click opening through the encounter entry", () => {
    const state = { date: Date.now(), key: "abc123=", count: 1, clear: false };

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state,
      pageType: "eh",
      hvAvailable: true,
      galleryAlt: true,
    });

    expect(outcome).toMatchObject({
      action: "opened",
      href: "http://alt.hentaiverse.org/?s=Battle&ss=ba&encounter=abc123=",
      handled: true,
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openUrl",
      reason: "encounterEntry",
      url: "http://alt.hentaiverse.org/?s=Battle&ss=ba&encounter=abc123=",
      newTab: true,
    });
  });
});
