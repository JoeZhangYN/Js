import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";

const mocks = vi.hoisted(() => ({
  runBattleSessionAutomation: vi.fn(),
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
  EncounterEvent: Object.freeze({ BATTLE_SESSION_STARTED: "battleSessionStarted" }),
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
vi.mock("./battle-session.js", () => ({
  BattleSessionEvent: Object.freeze({
    START_OR_RESUME: "startOrResume",
    RECORD_START_PROGRESS: "recordStartProgress",
    SYNC_RUNTIME: "syncRuntime",
  }),
  runBattleSessionAutomation: mocks.runBattleSessionAutomation,
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
    rows: ["Round begins", "Initializing random encounter"],
    firstText: "Round begins",
    initializingText: "Initializing random encounter",
  });
  mocks.runBattleSessionAutomation.mockImplementation((event) => {
    if (event.type === "startOrResume") {
      return {
        ok: true,
        initialized: true,
        snapshot: {
          version: 1,
          sessionId: "session-1",
          phase: "active",
          identity: { roundType: "ba", source: "initializationLog" },
          progress: { roundNow: 1, roundAll: 1, roundLeft: 0 },
        },
      };
    }
    return { roundNow: 1, roundAll: 1, roundLeft: 0 };
  });
  mocks.runBattleStaminaAutomation.mockReturnValue({ lostStamina: 1, paused: false });
  mocks.runMonsterStatusAutomation.mockImplementation((event) => {
    if (event.type === "prepareRoundStart") return { initialized: true, repaired: false };
    if (event.type === "refreshCombatantCounts") return { monsterAll: 3, monsterAlive: 3 };
    return false;
  });
  window.location.hash = "";
});

describe("runBattleRoundStartAutomation", () => {
  it("routes round-start bookkeeping through the lifecycle entry", () => {
    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(true);

    expect(mocks.runEncounterAutomation).toHaveBeenCalledWith({
      type: "battleSessionStarted",
      session: expect.objectContaining({ sessionId: "session-1" }),
      source: "battleRoundStart",
    });
    expect(mocks.runBattleSessionAutomation).toHaveBeenCalledWith({
      type: "startOrResume",
      initializingText: "Initializing random encounter",
    });
    expect(mocks.runBattleSessionAutomation).toHaveBeenCalledWith({
      type: "recordStartProgress",
      initializingText: "Initializing random encounter",
    });
    const evidence = JSON.parse(sessionStorage.getItem("HVAA:lastBattleRoundStart"));
    expect(evidence).toMatchObject({
      phase: "roundStarted",
      result: true,
    });
    expect(evidence.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ step: "staminaGate", result: true }),
        expect.objectContaining({ step: "roundReady" }),
      ])
    );
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

    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(
      false
    );

    expect(mocks.runBattleSessionAutomation).toHaveBeenCalledWith({
      type: "startOrResume",
      initializingText: "Initializing random encounter",
    });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({
      type: "refreshCombatantCounts",
    });
    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "prepareRoundStart" })
    );
    expect(mocks.runBattleSessionAutomation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "recordStartProgress" })
    );
    expect(mocks.runBattleSessionAutomation).not.toHaveBeenCalledWith({ type: "syncRuntime" });
    expect(mocks.runBattleRoundLifecycle).not.toHaveBeenCalledWith({ type: "roundReady" });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleRoundStart"))).toMatchObject({
      phase: "roundStarted",
      result: false,
      steps: expect.arrayContaining([
        { step: "staminaGate", result: false, detail: { lostStamina: 99, paused: true } },
      ]),
    });
  });
});
