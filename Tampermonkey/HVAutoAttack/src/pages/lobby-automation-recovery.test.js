import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn((event) => event.key === "idleArena"),
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(),
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
  DayRecordEvent: Object.freeze({ REFRESH_AND_SCHEDULE_NEXT_UTC_DAY: "refreshDay" }),
  runDayRecordAutomation: mocks.runDayRecordAutomation,
}));
vi.mock("../state/stamina.js", () => ({
  StaminaEvent: Object.freeze({ SHOULD_STOP_LOBBY: "stopLobby" }),
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
  mocks.runEncounterAutomation.mockResolvedValue({ claimed: false });
  mocks.isAutomaticEncounterEnabled.mockReturnValue(true);
  mocks.runStaminaAutomation.mockReturnValue(false);
});

describe("lobby encounter recovery", () => {
  it("stops later lobby automation when encounter recovery is blocked", async () => {
    mocks.runEncounterAutomation.mockResolvedValue({ claimed: false, blocked: true });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runStaminaAutomation).not.toHaveBeenCalled();
    expect(mocks.runRepairAutomation).not.toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).not.toHaveBeenCalled();
  });

  it("coalesces concurrent UTC wakeups across the complete lobby workflow", async () => {
    let finishEncounter;
    mocks.runEncounterAutomation.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishEncounter = resolve;
        })
    );

    const active = runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
    await vi.waitFor(() => expect(mocks.runEncounterAutomation).toHaveBeenCalledOnce());
    const dayWake = mocks.runDayRecordAutomation.mock.calls[0][0].rerun();
    const encounterWake = mocks.runEncounterAutomation.mock.calls[0][0].rerun();
    finishEncounter({ claimed: false });
    await Promise.all([active, dayWake, encounterWake]);

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runEncounterAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledTimes(1);
  });

  it("releases the lobby singleflight after a rejected workflow", async () => {
    mocks.runEncounterAutomation.mockRejectedValueOnce(new Error("encounter failed"));

    await expect(runLobbyAutomation({ type: LobbyEvent.PAGE_READY })).rejects.toThrow(
      "encounter failed"
    );
    mocks.runEncounterAutomation.mockResolvedValueOnce({ claimed: false });
    await expect(runLobbyAutomation({ type: LobbyEvent.PAGE_READY })).resolves.toBeUndefined();

    expect(mocks.runEncounterAutomation).toHaveBeenCalledTimes(2);
  });
});
