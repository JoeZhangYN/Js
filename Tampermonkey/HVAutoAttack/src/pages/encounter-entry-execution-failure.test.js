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
  mocks.runNavigationAutomation.mockReturnValue(false);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("encounter entry navigation failures", () => {
  it("does not claim a widget encounter when navigation is blocked", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state: { date: Date.now(), key: "abc123=", count: 1, clear: false },
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "navigationFailed",
      handled: false,
      state: { key: "abc123=", clear: false },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY) || "null")).toBeNull();
  });

  it("does not claim a gallery encounter when opening the battle tab is blocked", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      state: { date: Date.now(), key: "abc123=", count: 1, clear: false },
      pageType: "eh",
      hvAvailable: true,
      galleryAlt: true,
    });

    expect(outcome).toMatchObject({
      action: "navigationFailed",
      handled: false,
      state: { key: "abc123=", clear: false },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY) || "null")).toBeNull();
  });
});
