import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runNavigationAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));
vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
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
  mocks.runUserFeedbackAutomation.mockReset();
  vi.unstubAllGlobals();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("encounter entry navigation failures", () => {
  it("does not claim a widget encounter when navigation is blocked", () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({ date: Date.now(), key: "abc123=", count: 1, clear: false })
    );
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "blocked",
      handled: true,
      blocked: true,
      state: { entry: { phase: "keyAvailable", key: "abc123=", sessionId: null } },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      entry: { phase: "keyAvailable", key: "abc123=", sessionId: null },
    });
  });

  it("does not claim a gallery encounter when opening the battle tab is blocked", () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({ date: Date.now(), key: "abc123=", count: 1, clear: false })
    );
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      pageType: "eh",
      hvAvailable: true,
      galleryAlt: true,
    });

    expect(outcome).toMatchObject({
      action: "blocked",
      handled: true,
      blocked: true,
      state: { entry: { phase: "keyAvailable", key: "abc123=", sessionId: null } },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      entry: { phase: "keyAvailable", key: "abc123=", sessionId: null },
    });
  });

  it("blocks before navigation when attempted-state persistence is rejected", () => {
    const date = Date.now();
    const stored = {
      date,
      cycleReadyAt: date + 1_805_000,
      anchorReason: "encounterCompleted",
      entry: { phase: "keyAvailable", key: "abc123=", sessionId: null },
      lastSettledSessionId: null,
      schemaVersion: 5,
      count: 1,
      utcDay: "2026-06-27",
      dayPhase: "active",
      invalidCycleCount: 0,
      generationRouteRevision: 1,
    };
    vi.stubGlobal("GM_getValue", () => stored);
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("GM write blocked");
    });

    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_CLICKED,
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "blocked",
      blocked: true,
      state: { entry: { phase: "keyAvailable", key: "abc123=", sessionId: null } },
      evidence: { reason: "encounterEntryStatePersistenceFailed" },
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
  });
});
