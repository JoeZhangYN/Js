import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(async () => ({ claimed: false })),
  isAutomaticEncounterEnabled: vi.fn(() => true),
  runIdleArenaAutomation: vi.fn(),
  runQuickSiteAutomation: vi.fn(),
  runRepairAutomation: vi.fn(),
  runStaminaAutomation: vi.fn(() => false),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../state/day-record.js", () => ({
  DayRecordEvent: Object.freeze({ REFRESH_AND_SCHEDULE_NEXT_UTC_DAY: "refreshAndScheduleNextUtcDay" }),
  runDayRecordAutomation: mocks.runDayRecordAutomation,
}));
vi.mock("../state/stamina.js", () => ({
  StaminaEvent: Object.freeze({ SHOULD_STOP_LOBBY: "shouldStopLobby" }),
  runStaminaAutomation: mocks.runStaminaAutomation,
}));
vi.mock("../arena/idle-arena.js", () => ({
  IdleArenaEvent: Object.freeze({ SCHEDULE_NEXT_BATTLE: "scheduleNextBattle" }),
  runIdleArenaAutomation: mocks.runIdleArenaAutomation,
}));
vi.mock("../arena/quick-site.js", () => ({
  QuickSiteEvent: Object.freeze({ LOBBY_READY: "lobbyReady" }),
  runQuickSiteAutomation: mocks.runQuickSiteAutomation,
}));
vi.mock("../repair/repair-orchestrator.js", () => ({
  RepairEvent: Object.freeze({ START: "start" }),
  runRepairAutomation: mocks.runRepairAutomation,
}));
vi.mock("./encounter.js", () => ({
  EncounterEvent: Object.freeze({ LOBBY_TICK: "lobbyTick" }),
  runEncounterAutomation: mocks.runEncounterAutomation,
}));
vi.mock("./encounter-option-gate.js", () => ({
  isAutomaticEncounterEnabled: mocks.isAutomaticEncounterEnabled,
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
  mocks.runOptionAutomation.mockImplementation((event) => event.key === "idleArena");
});

describe("runLobbyAutomation isekai identity flow", () => {
  it("routes isekai lobby flow without encounter orchestration", async () => {
    await runLobbyAutomation({ type: LobbyEvent.ISEKAI_PAGE_READY });

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledWith({ type: "clearSession" });
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledWith({
      type: "refreshAndScheduleNextUtcDay",
      rerun: expect.any(Function),
    });
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledWith({ type: "lobbyReady" });
    expect(mocks.runEncounterAutomation).not.toHaveBeenCalled();
    expect(mocks.runStaminaAutomation).toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledWith({ type: "scheduleNextBattle" });
  });

  it("reruns the isekai lobby workflow without falling back to main encounter flow", async () => {
    await runLobbyAutomation({ type: LobbyEvent.ISEKAI_PAGE_READY });
    const rolloverEvent = mocks.runDayRecordAutomation.mock.calls[0][0];
    await rolloverEvent.rerun();

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runEncounterAutomation).not.toHaveBeenCalled();
  });
});
