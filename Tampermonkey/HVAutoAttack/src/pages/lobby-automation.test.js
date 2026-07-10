import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runDayRecordAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(async () => ({ claimed: false })),
  isAutomaticEncounterEnabled: vi.fn(() => false),
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

function setLobbyOption(option) {
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type !== "readField") return undefined;
    return option[event.key] !== undefined ? option[event.key] : event.fallback;
  });
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runEncounterAutomation.mockResolvedValue({ claimed: false });
  mocks.isAutomaticEncounterEnabled.mockReturnValue(false);
  mocks.runStaminaAutomation.mockReturnValue(false);
  setLobbyOption({ idleArena: false, repair: false });
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
    setLobbyOption({ idleArena: false, repair: true });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledWith({ type: "clearSession" });
    expect(mocks.runDayRecordAutomation).toHaveBeenCalledWith({
      type: "refreshAndScheduleNextUtcDay",
      rerun: expect.any(Function),
    });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "captureAbilityPage" });
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledWith({ type: "lobbyReady" });
    expect(mocks.runRepairAutomation).toHaveBeenCalledWith({ type: "start" });
  });

  it("runs lobby ready flow in business order", async () => {
    setLobbyOption({ idleArena: true, repair: false });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    const actualOrder = [
      mocks.runBattleRuntimeAutomation.mock.invocationCallOrder[0],
      mocks.runDayRecordAutomation.mock.invocationCallOrder[0],
      mocks.runAbilityAoeAutomation.mock.invocationCallOrder[0],
      mocks.runQuickSiteAutomation.mock.invocationCallOrder[0],
      mocks.runStaminaAutomation.mock.invocationCallOrder[0],
      mocks.runIdleArenaAutomation.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("stops later lobby automation when encounter is claimed", async () => {
    setLobbyOption({ idleArena: true, repair: false });
    mocks.isAutomaticEncounterEnabled.mockReturnValue(true);
    mocks.runEncounterAutomation.mockResolvedValue({ claimed: true });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runEncounterAutomation).toHaveBeenCalledWith({
      type: "lobbyTick",
      rerun: expect.any(Function),
    });
    expect(mocks.runStaminaAutomation).not.toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).not.toHaveBeenCalled();
  });

  it("continues lobby automation when encounter returns malformed claim evidence", async () => {
    setLobbyOption({ idleArena: true, repair: false });
    mocks.isAutomaticEncounterEnabled.mockReturnValue(true);
    mocks.runEncounterAutomation.mockResolvedValue({ claimed: { kind: "failed" } });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runEncounterAutomation).toHaveBeenCalledWith({
      type: "lobbyTick",
      rerun: expect.any(Function),
    });
    expect(mocks.runStaminaAutomation).toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledWith({ type: "scheduleNextBattle" });
  });

  it("stops next battle automation when stamina requires a stop", async () => {
    setLobbyOption({ idleArena: true, repair: true });
    mocks.runStaminaAutomation.mockReturnValue(true);

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runRepairAutomation).not.toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).not.toHaveBeenCalled();
  });

  it("preserves imported numeric/string lobby option switches and disables false-like values", async () => {
    setLobbyOption({ idleArena: "true", repair: 1 });
    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
    expect(mocks.runRepairAutomation).toHaveBeenCalledWith({ type: "start" });

    mocks.runRepairAutomation.mockClear();
    setLobbyOption({ idleArena: "0", repair: 0 });
    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
    expect(mocks.runRepairAutomation).not.toHaveBeenCalled();
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
