import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runNextBattleArbitration: vi.fn(),
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
  createNextBattleArbitrationCapability: () => ({ run: mocks.runNextBattleArbitration }),
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

describe("lobby next-battle recovery", () => {
  it("coalesces concurrent page-ready calls across the complete lobby workflow", async () => {
    let finishNextBattle;
    mocks.runNextBattleArbitration.mockImplementation(
      () => new Promise((resolve) => (finishNextBattle = resolve))
    );

    const active = runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
    const concurrent = runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
    await vi.waitFor(() => expect(mocks.runNextBattleArbitration).toHaveBeenCalledOnce());
    finishNextBattle({ status: "inactive" });
    await Promise.all([active, concurrent]);

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runNextBattleArbitration).toHaveBeenCalledTimes(1);
  });

  it("releases the lobby singleflight after a rejected workflow", async () => {
    mocks.runNextBattleArbitration.mockRejectedValueOnce(new Error("arbitration failed"));

    await expect(runLobbyAutomation({ type: LobbyEvent.PAGE_READY })).rejects.toThrow(
      "arbitration failed"
    );
    mocks.runNextBattleArbitration.mockResolvedValueOnce({ status: "inactive" });
    await expect(runLobbyAutomation({ type: LobbyEvent.PAGE_READY })).resolves.toBeUndefined();

    expect(mocks.runNextBattleArbitration).toHaveBeenCalledTimes(2);
  });
});
