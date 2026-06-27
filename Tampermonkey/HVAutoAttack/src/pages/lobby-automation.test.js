import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(async () => ({ claimed: false })),
  runIdleArenaAutomation: vi.fn(),
  runQuickSiteAutomation: vi.fn(),
  runRepairAutomation: vi.fn(),
  runStaminaAutomation: vi.fn(() => false),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../state/day-record.js", () => ({
  DayRecordEvent: Object.freeze({
    REFRESH_AND_SCHEDULE_NEXT_UTC_DAY: "refreshAndScheduleNextUtcDay",
  }),
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
vi.mock("./ability-page.js", () => ({
  AbilityAoeEvent: Object.freeze({ CAPTURE_ABILITY_PAGE: "captureAbilityPage" }),
  runAbilityAoeAutomation: mocks.runAbilityAoeAutomation,
}));
vi.mock("../battle/battle-runtime.js", () => ({
  BattleRuntimeEvent: Object.freeze({ CLEAR_SESSION: "clearSession" }),
  runBattleRuntimeAutomation: mocks.runBattleRuntimeAutomation,
}));

function setLobbyOption(option) {
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type === "readField") {
      return option[event.key] !== undefined ? option[event.key] : event.fallback;
    }
    return undefined;
  });
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runEncounterAutomation.mockResolvedValue({ claimed: false });
  mocks.runStaminaAutomation.mockReturnValue(false);
  setLobbyOption({ encounter: false, idleArena: false, repair: false });
});

describe("runLobbyAutomation", () => {
  it("runs lobby page-ready capabilities through one event entry", async () => {
    setLobbyOption({ encounter: false, idleArena: false, repair: true });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledWith({ type: "clearSession" });
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledWith({
      type: "refreshAndScheduleNextUtcDay",
      rerun: expect.any(Function),
    });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "captureAbilityPage" });
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledWith({
      type: "lobbyReady",
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "encounter",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "repair",
      fallback: false,
    });
    expect(mocks.runRepairAutomation).toHaveBeenCalledWith({ type: "start" });
  });

  it("stops later lobby automation when encounter is claimed", async () => {
    setLobbyOption({ encounter: true, idleArena: true, repair: false });
    mocks.runEncounterAutomation.mockResolvedValue({ claimed: true });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runEncounterAutomation).toHaveBeenCalledWith({
      type: "lobbyTick",
      rerun: expect.any(Function),
    });
    expect(mocks.runStaminaAutomation).not.toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).not.toHaveBeenCalled();
  });

  it("reruns the lobby page-ready workflow when the daily rollover timer fires", async () => {
    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    const rolloverEvent = mocks.runDayRecordAutomation.mock.calls[0][0];
    await rolloverEvent.rerun();

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledTimes(2);
  });
});
