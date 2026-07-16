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
  sessionStorage.clear();
  vi.unstubAllGlobals();
  for (const mock of Object.values(mocks)) mock.mockReset();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
});

describe("stale cross-site encounter generation", () => {
  it("treats a stale cross-site generation page as an immediate blocking result", () => {
    const shared = new Map();
    vi.stubGlobal("GM_getValue", (key, fallback) => (shared.has(key) ? shared.get(key) : fallback));
    vi.stubGlobal("GM_setValue", (key, value) => shared.set(key, value));
    const outcome = runEncounterAutomation({
      type: EncounterEvent.GENERATION_PAGE_READY,
      eventpane: "It is the dawn of a new day!",
      request: { method: "GET", url: "https://e-hentai.org/news.php" },
      source: {
        identity: "persistentEncounterGeneration",
        pageKind: "ehentai",
        href: "https://e-hentai.org/news.php",
      },
    });

    expect(outcome).toMatchObject({
      action: "blocked",
      blocked: true,
      generation: { reason: "dailyResetEvent", persisted: true },
    });
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledOnce();
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });
});
