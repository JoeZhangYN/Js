import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageKind } from "./page-kind.js";
import { PageAutomationEvent, runPageAutomation } from "./page-automation.js";

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
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runAppStartup.mockReturnValue(true);
  mocks.runCrossSiteEncounterNavigation.mockReturnValue(false);
  mocks.runPageRefreshAutomation.mockReturnValue(false);
});

describe("runPageAutomation", () => {
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
});
