import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

const mocks = vi.hoisted(() => ({
  runNavigationAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));

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
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_NEWS_LOADED,
      state: { date: 0, key: "", count: 0, clear: true },
      eventpane: "It is the dawn of a new day!",
      engage: true,
      pageType: "hv",
      request: { method: "GET", url: "https://e-hentai.org/news.php?encounter" },
    });

    expect(outcome).toMatchObject({
      action: "dailyResetEvent",
      state: { date: Date.now(), count: 0, anchorReason: "newDay", dayPhase: "active" },
    });
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
    expect(
      runEncounterAutomation({
        type: EncounterEvent.WIDGET_TIMER_ELAPSED,
        state: outcome.state,
        pageType: "hv",
      })
    ).toMatchObject({ status: "countdown", reason: "cooldown" });
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("backs off a widget fetch failure before its timer can request again", () => {
    const outcome = runEncounterAutomation({
      type: EncounterEvent.WIDGET_GENERATION_FAILED,
      state: {
        date: Date.now() - 31 * 60 * 1000,
        key: "",
        count: 1,
        clear: true,
      },
      request: { method: "GET", url: "https://e-hentai.org/news.php?encounter" },
      reason: "generationRequestFailed",
      detail: { error: "network down" },
      pageType: "hv",
    });

    expect(outcome).toMatchObject({
      action: "recovery",
      handled: false,
      state: { generationFailureCount: 1, generationFailureReason: "generationRequestFailed" },
    });
    expect(
      runEncounterAutomation({
        type: EncounterEvent.WIDGET_TIMER_ELAPSED,
        state: outcome.state,
        pageType: "hv",
      })
    ).toMatchObject({
      status: "ready",
      reason: "readyWindow",
      operationalStatus: "countdown",
      operationalReason: "generationBackoff",
      recoveryStatus: "countdown",
      recoveryRemainingMs: 60 * 1000,
    });
    expect(mocks.runUserFeedbackAutomation).not.toHaveBeenCalled();
  });
});
