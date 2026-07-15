import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runNextBattleArbitration: vi.fn(async () => ({ status: "inactive" })),
  createNextBattleArbitrationCapability: vi.fn(),
  runQuickSiteAutomation: vi.fn(),
}));

vi.mock("../state/day-record.js", () => ({
  DayRecordEvent: Object.freeze({
    SYNC_UTC_DATE: "syncUtcDate",
  }),
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

describe("runLobbyAutomation", () => {
  it("rejects invalid lobby events without running lobby flow", async () => {
    await expect(runLobbyAutomation({ type: "unknown" })).resolves.toBeUndefined();
    await expect(runLobbyAutomation(null)).resolves.toBeUndefined();

    expect(mocks.runBattleRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.runDayRecordAutomation).not.toHaveBeenCalled();
    expect(mocks.runQuickSiteAutomation).not.toHaveBeenCalled();
  });

  it("runs lobby page-ready capabilities through one event entry", async () => {
    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledWith({ type: "clearSession" });
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledWith({ type: "syncUtcDate" });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "captureAbilityPage" });
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledWith({ type: "lobbyReady" });
    expect(mocks.runNextBattleArbitration).toHaveBeenCalledWith({ type: "plan" });
  });

  it("runs lobby ready flow in business order", async () => {
    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    const actualOrder = [
      mocks.runBattleRuntimeAutomation.mock.invocationCallOrder[0],
      mocks.runDayRecordAutomation.mock.invocationCallOrder[0],
      mocks.runAbilityAoeAutomation.mock.invocationCallOrder[0],
      mocks.runQuickSiteAutomation.mock.invocationCallOrder[0],
      mocks.runNextBattleArbitration.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("leaves encounter, repair, and idle decisions inside the next-battle entry", async () => {
    mocks.runNextBattleArbitration.mockResolvedValue({
      status: "scheduled",
      next: { owner: "encounter", deadlineMs: Date.now() + 1000 },
    });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runNextBattleArbitration).toHaveBeenCalledOnce();
  });
});
