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
  window.history.replaceState(null, "", "/isekai/");
  localStorage.clear();
  mocks.runNavigationAutomation.mockReset();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isekai encounter entry routing", () => {
  it("routes isekai lobby auto-entry to the isekai battle authority", async () => {
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
      href: "https://hentaiverse.org/isekai/?s=Battle&ss=ba&encounter=abc123=",
      handled: true,
      claimed: true,
      state: { key: "abc123=", clear: true },
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openUrl",
      reason: "encounterEntry",
      url: "https://hentaiverse.org/isekai/?s=Battle&ss=ba&encounter=abc123=",
    });
  });
});
