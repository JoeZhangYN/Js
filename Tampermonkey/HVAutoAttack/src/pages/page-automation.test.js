import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageKind } from "./page-kind.js";
import { PAGE_AUTOMATION_FAILURE_KEY, PageAutomationEvent, runPageAutomation } from "./page-automation.js";

const mocks = vi.hoisted(() => ({
  runAppStartup: vi.fn(() => true),
  runBattleAutomation: vi.fn(),
  runCrossSiteEncounterNavigation: vi.fn(() => false),
  runEquipmentViewAutomation: vi.fn(),
  runLobbyAutomation: vi.fn(),
  runPageRefreshAutomation: vi.fn(() => false),
  runRiddleAutomation: vi.fn(),
}));

vi.mock("../alarm/page-refresh.js", () => ({
  PageRefreshEvent: Object.freeze({
    GAME_PAGE_READY: "gamePageReady",
    UNKNOWN_PAGE_READY: "unknownPageReady",
  }),
  runPageRefreshAutomation: mocks.runPageRefreshAutomation,
}));
vi.mock("./app-startup.js", () => ({
  AppStartupEvent: Object.freeze({ GAME_PAGE_READY: "gamePageReady" }),
  runAppStartup: mocks.runAppStartup,
}));
vi.mock("./cross-site-encounter-navigation.js", () => ({
  CrossSiteEncounterEvent: Object.freeze({ PAGE_READY: "pageReady" }),
  runCrossSiteEncounterNavigation: mocks.runCrossSiteEncounterNavigation,
}));
vi.mock("./equipment-view-automation.js", () => ({
  EquipmentViewEvent: Object.freeze({ PAGE_READY: "pageReady" }),
  runEquipmentViewAutomation: mocks.runEquipmentViewAutomation,
}));
vi.mock("./riddle-automation.js", () => ({ runRiddleAutomation: mocks.runRiddleAutomation }));
vi.mock("./lobby-automation.js", () => ({
  LobbyEvent: Object.freeze({ PAGE_READY: "pageReady" }),
  runLobbyAutomation: mocks.runLobbyAutomation,
}));
vi.mock("../battle/battle-automation.js", () => ({
  BattleEvent: Object.freeze({ PAGE_READY: "pageReady" }),
  runBattleAutomation: mocks.runBattleAutomation,
}));

beforeEach(() => {
  sessionStorage.clear();
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runAppStartup.mockReturnValue(true);
  mocks.runCrossSiteEncounterNavigation.mockReturnValue(false);
  mocks.runPageRefreshAutomation.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function lastPageAutomationFailure() {
  return JSON.parse(sessionStorage.getItem(PAGE_AUTOMATION_FAILURE_KEY));
}

describe("runPageAutomation", () => {
  it("rejects unknown page automation events without routing pages", () => {
    expect(runPageAutomation({ type: "unknown", kind: PageKind.RIDDLE })).toBe(false);
    expect(runPageAutomation(null)).toBe(false);

    expect(mocks.runEquipmentViewAutomation).not.toHaveBeenCalled();
    expect(mocks.runAppStartup).not.toHaveBeenCalled();
    expect(mocks.runRiddleAutomation).not.toHaveBeenCalled();
  });

  it("reports page-ready events to equipment and game-page capabilities", () => {
    runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.RIDDLE });

    expect(mocks.runEquipmentViewAutomation).toHaveBeenCalledWith({
      type: "pageReady",
      kind: PageKind.RIDDLE,
    });
    expect(mocks.runAppStartup).toHaveBeenCalledWith({ type: "gamePageReady" });
    expect(mocks.runPageRefreshAutomation).toHaveBeenCalledWith({
      type: "gamePageReady",
    });
    expect(mocks.runRiddleAutomation).toHaveBeenCalledTimes(1);
  });

  it("routes battle and lobby game pages through their page entries", () => {
    runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.BATTLE });
    runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.LOBBY });

    expect(mocks.runBattleAutomation).toHaveBeenCalledWith({ type: "pageReady" });
    expect(mocks.runLobbyAutomation).toHaveBeenCalledWith({ type: "pageReady" });
  });

  it("stops routing when cross-site encounter navigation handles the page", () => {
    mocks.runCrossSiteEncounterNavigation.mockReturnValue(true);

    runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.EHENTAI });

    expect(mocks.runCrossSiteEncounterNavigation).toHaveBeenCalledWith({
      type: "pageReady",
      kind: PageKind.EHENTAI,
    });
    expect(mocks.runAppStartup).not.toHaveBeenCalled();
    expect(mocks.runPageRefreshAutomation).not.toHaveBeenCalled();
  });

  it("schedules unknown page reload before game-page startup", () => {
    mocks.runPageRefreshAutomation.mockReturnValueOnce(true);

    runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.UNKNOWN });

    expect(mocks.runPageRefreshAutomation).toHaveBeenCalledWith({ type: "unknownPageReady" });
    expect(mocks.runAppStartup).not.toHaveBeenCalled();
  });

  it("stops game-page routing when startup declines the page", () => {
    mocks.runAppStartup.mockReturnValue(false);

    runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.BATTLE });

    expect(mocks.runPageRefreshAutomation).not.toHaveBeenCalledWith({ type: "gamePageReady" });
    expect(mocks.runBattleAutomation).not.toHaveBeenCalled();
  });

  it("records page routing step failures and stops later routing", () => {
    mocks.runEquipmentViewAutomation.mockImplementation(() => {
      throw new Error("equipment blocked");
    });

    expect(runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.BATTLE })).toBe(false);

    expect(lastPageAutomationFailure()).toMatchObject({
      capability: "pageAutomation",
      stage: "reportEquipmentViewPageReady",
      reason: "stepException",
      kind: PageKind.BATTLE,
      error: "equipment blocked",
    });
    expect(mocks.runBattleAutomation).not.toHaveBeenCalled();
  });

  it("records game-page child automation failures at the page routing boundary", () => {
    mocks.runRiddleAutomation.mockImplementation(() => {
      throw new Error("riddle blocked");
    });

    expect(runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.RIDDLE })).toBe(false);

    expect(lastPageAutomationFailure()).toMatchObject({
      capability: "pageAutomation",
      stage: "runGamePageReadyAutomation",
      reason: "stepException",
      kind: PageKind.RIDDLE,
      error: "riddle blocked",
    });
  });

  it("keeps page routing failure evidence when diagnostic console is blocked", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.runCrossSiteEncounterNavigation.mockImplementation(() => {
      throw new Error("navigation blocked");
    });

    expect(runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.EHENTAI })).toBe(false);
    expect(lastPageAutomationFailure()).toMatchObject({
      stage: "handleCrossSiteEncounterPageReady",
      reason: "stepException",
      error: "navigation blocked",
    });
  });
});
