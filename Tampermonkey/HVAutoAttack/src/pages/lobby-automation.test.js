import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  runBattleRuntimeAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(async () => ({ claimed: false })),
  runIdleArenaAutomation: vi.fn(),
  runQuickSiteAutomation: vi.fn(),
  runRepairAutomation: vi.fn(),
  runStaminaAutomation: vi.fn(() => false),
  time: vi.fn(() => "2026-06-27"),
}));

vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../core/time.js", () => ({ time: mocks.time }));
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
  mocks.g.mockImplementation((key, value) => {
    if (value !== undefined) return value;
    if (key === "option") return option;
    return undefined;
  });
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runEncounterAutomation.mockResolvedValue({ claimed: false });
  mocks.runStaminaAutomation.mockReturnValue(false);
  mocks.time.mockReturnValue("2026-06-27");
  setLobbyOption({ encounter: false, idleArena: false, repair: false });
});

describe("runLobbyAutomation", () => {
  it("runs lobby page-ready capabilities through one event entry", async () => {
    setLobbyOption({ encounter: false, idleArena: false, repair: true });

    await runLobbyAutomation({ type: LobbyEvent.PAGE_READY });

    expect(mocks.runBattleRuntimeAutomation).toHaveBeenCalledWith({ type: "clearSession" });
    expect(mocks.g).toHaveBeenCalledWith("dateNow", "2026-06-27");
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "captureAbilityPage" });
    expect(mocks.runQuickSiteAutomation).toHaveBeenCalledWith({
      type: "lobbyReady",
      option: { encounter: false, idleArena: false, repair: true },
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
});
