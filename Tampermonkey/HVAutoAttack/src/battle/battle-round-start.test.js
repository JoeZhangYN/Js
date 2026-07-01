import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";

const mocks = vi.hoisted(() => ({
  runBattleRoundAutomation: vi.fn(),
  runBattleRoundLifecycle: vi.fn(),
  runBattleRoundStartLog: vi.fn(),
  runBattleStaminaAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ RELOAD_NOW: "reloadNow" }),
  NavigationReloadReason: Object.freeze({ BATTLE_HASH_CLEANUP: "battleHashCleanup" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("../pages/encounter.js", () => ({
  EncounterEvent: Object.freeze({ RANDOM_ENCOUNTER_STARTED: "randomEncounterStarted" }),
  runEncounterAutomation: mocks.runEncounterAutomation,
}));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({
    ENSURE_READY: "ensureReady",
    PREPARE_ROUND_START: "prepareRoundStart",
    REFRESH_COMBATANT_COUNTS: "refreshCombatantCounts",
  }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));
vi.mock("./battle-round.js", () => ({
  BattleRoundEvent: Object.freeze({
    CLASSIFY_TYPE: "classifyType",
    READ_TYPE: "readType",
    RECORD_START_CONTEXT: "recordStartContext",
    RECORD_COUNT_FROM_INITIALIZATION: "recordCountFromInitialization",
    RECORD_SINGLE_ROUND: "recordSingleRound",
    RECORD_START_COUNT: "recordStartCount",
    RECORD_TYPE: "recordType",
    SYNC_RUNTIME: "syncRuntime",
  }),
  runBattleRoundAutomation: mocks.runBattleRoundAutomation,
}));
vi.mock("./battle-stamina.js", () => ({
  BattleStaminaEvent: Object.freeze({ ROUND_LOG_READY: "roundLogReady" }),
  runBattleStaminaAutomation: mocks.runBattleStaminaAutomation,
}));
vi.mock("./round-lifecycle.js", () => ({
  BattleRoundLifecycleEvent: Object.freeze({
    ROUND_READY: "roundReady",
    ROUND_STARTED: "roundStarted",
  }),
  runBattleRoundLifecycle: mocks.runBattleRoundLifecycle,
}));
vi.mock("./round-start-log.js", () => ({
  BattleRoundStartLogEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleRoundStartLog: mocks.runBattleRoundStartLog,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runBattleRoundStartLog.mockReturnValue({
    rows: ["Round begins", "Initializing random encounter"],
    firstText: "Round begins",
    initializingText: "Initializing random encounter",
  });
  mocks.runBattleRoundAutomation.mockImplementation((event) => {
    if (event.type === "recordStartContext") {
      return { initialized: true, roundType: "ba", randomEncounterStarted: true };
    }
    return undefined;
  });
  mocks.runBattleStaminaAutomation.mockReturnValue({ lostStamina: 1, paused: false });
  mocks.runMonsterStatusAutomation.mockImplementation((event) =>
    event.type === "prepareRoundStart" ? { initialized: true, repaired: false } : false
  );
  window.location.hash = "";
});

describe("runBattleRoundStartAutomation", () => {
  it("ignores unknown events", () => {
    expect(runBattleRoundStartAutomation({ type: "unknown" })).toBe(false);
  });

  it("exposes the round started event", () => {
    expect(BattleRoundStartEvent.ROUND_STARTED).toBe("roundStarted");
  });

  it("routes round-start bookkeeping through the lifecycle entry", () => {
    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(true);

    expect(mocks.runBattleRoundLifecycle).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runBattleRoundStartLog).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runEncounterAutomation).toHaveBeenCalledWith({
      type: "randomEncounterStarted",
    });
    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({
      type: "recordStartContext",
      initializingText: "Initializing random encounter",
    });
    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({
      type: "recordStartCount",
      initializingText: "Initializing random encounter",
      roundType: "ba",
      initialized: true,
      repaired: false,
    });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({
      type: "prepareRoundStart",
      battleLogRows: ["Round begins", "Initializing random encounter"],
      initialized: true,
    });
    expect(mocks.runBattleRoundLifecycle).toHaveBeenCalledWith({ type: "roundReady" });
  });

  it("routes battle hash cleanup reload with the original hash evidence", () => {
    window.location.hash = "#battleAction";

    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(true);

    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "reloadNow",
      reason: "battleHashCleanup",
      detail: { source: "battleRoundStart", hash: "#battleAction" },
    });
  });

  it("stops round preparation when stamina gate pauses the round", () => {
    mocks.runBattleStaminaAutomation.mockReturnValue({ lostStamina: 99, paused: true });

    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(true);

    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({
      type: "recordStartContext",
      initializingText: "Initializing random encounter",
    });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({
      type: "refreshCombatantCounts",
    });
    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "prepareRoundStart" })
    );
    expect(mocks.runBattleRoundAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "recordStartCount" })
    );
    expect(mocks.runBattleRoundAutomation).not.toHaveBeenCalledWith({ type: "syncRuntime" });
    expect(mocks.runBattleRoundLifecycle).not.toHaveBeenCalledWith({ type: "roundReady" });
  });
});
