import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ OPEN_URL: "openUrl" }),
  NavigationRedirectReason: Object.freeze({ ENCOUNTER_ENTRY: "encounterEntry" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

const HVUT_RE_KEY = ["hvut", "re"].join("_");

beforeEach(() => {
  localStorage.clear();
  mocks.gmXhr.mockReset();
  mocks.gmXhr.mockImplementation(({ onerror }) => onerror?.({}));
  mocks.runNavigationAutomation.mockReset();
  mocks.runNavigationAutomation.mockReturnValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("encounter stale entry recovery", () => {
  it("does not repeat navigation for the same attempted stored encounter key", async () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.now() - 31 * 60 * 1000,
        key: "abc123=",
        count: 1,
        clear: false,
      })
    );

    await runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK, rerun: vi.fn() });
    mocks.runNavigationAutomation.mockClear();
    const second = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: vi.fn(),
    });

    expect(second.action).not.toBe("navigated");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      key: "abc123=",
      clear: true,
    });
  });

  it("navigates to encounter generation when the ready window opens without a stored key", async () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.now() - 1_860_000,
        key: "",
        count: 1,
        clear: true,
      })
    );

    const outcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: vi.fn(),
    });

    expect(outcome).toMatchObject({
      action: "navigated",
      href: "https://e-hentai.org/news.php?encounter",
      handled: true,
      claimed: true,
    });
  });

  it("does not let a forced widget click revive an already attempted key", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state: { date: Date.now(), key: "abc123=", count: 1, clear: true },
      pageType: "hv",
      force: true,
    });

    expect(outcome).toMatchObject({
      action: "load",
      state: { key: "abc123=", clear: true },
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("does not navigate when news returns the same already attempted key", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      state: { date: Date.now(), key: "xyz=", count: 1, clear: true },
      eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=xyz=">RE</a>',
      engage: true,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "none",
      state: { key: "xyz=", count: 1, clear: true },
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });
});
