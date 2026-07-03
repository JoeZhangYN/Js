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
    PREPARE_ROUND_START: "prepareRoundStart",
    REFRESH_COMBATANT_COUNTS: "refreshCombatantCounts",
  }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));
vi.mock("./battle-round.js", () => ({
  BattleRoundEvent: Object.freeze({
    RECORD_START_CONTEXT: "recordStartContext",
    RECORD_START_COUNT: "recordStartCount",
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
  sessionStorage.clear();
  mocks.runBattleRoundStartLog.mockReturnValue({
    rows: ["Round begins"],
    firstText: "Round begins",
    initializingText: "",
  });
  mocks.runBattleRoundAutomation.mockImplementation((event) =>
    event.type === "recordStartContext"
      ? { initialized: false, roundType: "ba", randomEncounterStarted: false }
      : undefined
  );
  mocks.runBattleStaminaAutomation.mockReturnValue({ lostStamina: 0, paused: false });
  window.location.hash = "";
});

describe("runBattleRoundStartAutomation rejection evidence", () => {
  it("rejects unknown events with round-start evidence", () => {
    expect(runBattleRoundStartAutomation({ type: "unknown" })).toBe(false);

    expect(mocks.runBattleRoundLifecycle).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "unknownRoundStartEvent",
      result: false,
      steps: [{ step: "routeEvent", result: false, eventType: "unknown" }],
    });
  });

  it("rejects null events with round-start evidence instead of throwing", () => {
    expect(runBattleRoundStartAutomation(null)).toBe(false);

    expect(mocks.runBattleRoundLifecycle).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "unknownRoundStartEvent",
      result: false,
      steps: [{ step: "routeEvent", result: false, eventType: null }],
    });
  });

  it("returns false when monster status repair schedules recovery before round ready", () => {
    mocks.runMonsterStatusAutomation.mockImplementation((event) =>
      event.type === "prepareRoundStart"
        ? { initialized: false, repaired: true }
        : { monsterAll: 3, monsterAlive: 3 }
    );

    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(false);

    expect(mocks.runBattleRoundAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "recordStartCount" })
    );
    expect(mocks.runBattleRoundLifecycle).not.toHaveBeenCalledWith({ type: "roundReady" });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "roundStarted",
      result: false,
      steps: expect.arrayContaining([
        {
          step: "prepareMonsterStatus",
          result: false,
          detail: { initialized: false, repaired: true },
        },
      ]),
    });
  });

  it("returns false when round start context records persistence failure", () => {
    const failedContext = {
      initialized: true,
      roundType: "",
      randomEncounterStarted: false,
      reason: "roundPersistenceFailed",
    };
    mocks.runBattleRoundAutomation.mockImplementation((event) =>
      event.type === "recordStartContext" ? failedContext : undefined
    );

    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(false);

    expect(mocks.runBattleStaminaAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "prepareRoundStart" })
    );
    expect(mocks.runBattleRoundAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "recordStartCount" })
    );
    expect(mocks.runBattleRoundLifecycle).not.toHaveBeenCalledWith({ type: "roundReady" });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "roundStarted",
      result: false,
      steps: expect.arrayContaining([
        { step: "recordStartContext", result: false, detail: failedContext },
      ]),
    });
  });
});
