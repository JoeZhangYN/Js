import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runNavigationAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));
const HVUT_RE_KEY = ["hvut", "re"].join("_");

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ OPEN_URL: "openUrl" }),
  NavigationRedirectReason: Object.freeze({ ENCOUNTER_ENTRY: "encounterEntry" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  for (const mock of Object.values(mocks)) mock.mockReset();
  vi.setSystemTime(new Date("2026-06-27T01:00:00.000Z"));
});

describe("encounter widget generation recovery", () => {
  it("starts the widget cooldown from dawn without reporting a generation failure", () => {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify({ date: 0, key: "", count: 0, clear: true }));
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      eventpane: "It is the dawn of a new day!",
      engage: true,
      pageType: "hv",
      request: { method: "GET", url: "https://e-hentai.org/news.php" },
    });

    expect(outcome).toMatchObject({
      action: "dailyResetEvent",
      state: { date: Date.now(), count: 0, anchorReason: "newDay", dayPhase: "active" },
    });
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
    expect(runEncounterAutomation({ type: EncounterEvent.WIDGET_TICK })).toMatchObject({
      status: "countdown",
      reason: "cooldown",
    });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("reports a manual widget fetch failure without changing automatic recovery", () => {
    const state = {
      date: Date.now() - 31 * 60 * 1000,
      key: "",
      count: 1,
      clear: true,
    };
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify(state));
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_GENERATION_FAILED,
      request: { method: "GET", url: "https://e-hentai.org/news.php" },
      reason: "generationRequestFailed",
      detail: { error: "network down" },
      pageType: "hv",
      checkMode: "manual",
    });

    expect(outcome).toMatchObject({
      action: "unavailable",
      handled: true,
      generation: { application: "manualCheckFailed" },
      state: { date: state.date, count: 1 },
    });
    expect(outcome.state).not.toHaveProperty("generationFailureCount");
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
  });
});
