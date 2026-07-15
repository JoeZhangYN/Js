import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLobbyAutomationCapability, LobbyEvent } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runNextBattleArbitration: vi.fn(async () => ({ status: "inactive" })),
  createNextBattleArbitrationCapability: vi.fn(),
  runQuickSiteAutomation: vi.fn(),
}));

vi.mock("../state/day-record.js", () => ({
  DayRecordEvent: Object.freeze({ SYNC_UTC_DATE: "syncDay" }),
  runDayRecordAutomation: mocks.runDayRecordAutomation,
}));
vi.mock("../arena/quick-site.js", () => ({
  QuickSiteEvent: Object.freeze({ LOBBY_READY: "lobbyReady" }),
  runQuickSiteAutomation: mocks.runQuickSiteAutomation,
}));
vi.mock("./next-battle-arbitration.js", () => ({
  NextBattleArbitrationEvent: Object.freeze({ PLAN: "plan" }),
  createNextBattleArbitrationCapability: (...args) => {
    mocks.createNextBattleArbitrationCapability(...args);
    return { run: mocks.runNextBattleArbitration };
  },
}));
vi.mock("./ability-page.js", () => ({
  AbilityAoeEvent: Object.freeze({ CAPTURE_ABILITY_PAGE: "captureAbilityPage" }),
  runAbilityAoeAutomation: mocks.runAbilityAoeAutomation,
}));
vi.mock("../battle/battle-runtime.js", () => ({
  BattleRuntimeEvent: Object.freeze({ CLEAR_SESSION: "clearSession" }),
  runBattleRuntimeAutomation: mocks.runBattleRuntimeAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runNextBattleArbitration.mockResolvedValue({ status: "inactive" });
});

describe("Isekai-bound lobby capability", () => {
  it("binds encounter unavailability once and keeps the shared lobby call", async () => {
    const lobby = createLobbyAutomationCapability({ randomEncounter: false });
    await lobby.run({ type: LobbyEvent.PAGE_READY });

    expect(mocks.createNextBattleArbitrationCapability).toHaveBeenCalledWith({
      randomEncounter: false,
    });
    expect(mocks.runNextBattleArbitration).toHaveBeenCalledWith({ type: "plan" });
    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledWith({ type: "clearSession" });
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledWith({ type: "lobbyReady" });
  });

  it("reuses the same bound feature policy across sequential page-ready calls", async () => {
    const lobby = createLobbyAutomationCapability({ randomEncounter: false });
    await lobby.run({ type: LobbyEvent.PAGE_READY });
    await lobby.run({ type: LobbyEvent.PAGE_READY });

    expect(mocks.createNextBattleArbitrationCapability).toHaveBeenCalledOnce();
    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runNextBattleArbitration).toHaveBeenCalledTimes(2);
  });
});
