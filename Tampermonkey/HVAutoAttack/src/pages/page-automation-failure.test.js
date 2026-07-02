import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageKind } from "./page-kind.js";
import {
  PAGE_AUTOMATION_FAILURE_KEY,
  PageAutomationEvent,
  runPageAutomation,
} from "./page-automation.js";

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

describe("runPageAutomation failure fallback", () => {
  it("does not continue page routing when failure evidence and warning both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === PAGE_AUTOMATION_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.runEquipmentViewAutomation.mockImplementation(() => {
      throw new Error("equipment blocked");
    });

    expect(runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: PageKind.BATTLE })).toBe(false);
    expect(mocks.runBattleAutomation).not.toHaveBeenCalled();
  });
});
