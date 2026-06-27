import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  runAutoTuneAutomation: vi.fn(),
  runBattleRoundAutomation: vi.fn(),
  runBattleStaminaAutomation: vi.fn(),
  runEncounterAutomation: vi.fn(),
  runMonsterKnowledgeAutomation: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
  runNavigationAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ RELOAD_NOW: "reloadNow" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("../pages/encounter.js", () => ({
  EncounterEvent: Object.freeze({ RANDOM_ENCOUNTER_STARTED: "randomEncounterStarted" }),
  runEncounterAutomation: mocks.runEncounterAutomation,
}));
vi.mock("../state/auto-tune.js", () => ({
  AutoTuneEvent: Object.freeze({ RECORD_BATTLE: "recordBattle" }),
  runAutoTuneAutomation: mocks.runAutoTuneAutomation,
}));
vi.mock("./monster-knowledge-automation.js", () => ({
  MonsterKnowledgeEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runMonsterKnowledgeAutomation: mocks.runMonsterKnowledgeAutomation,
}));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({
    ENSURE_READY: "ensureReady",
    RECORD_SPAWN_ROSTER: "recordSpawnRoster",
    REFRESH_COMBATANT_COUNTS: "refreshCombatantCounts",
  }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));
vi.mock("./battle-round.js", () => ({
  BattleRoundEvent: Object.freeze({
    CLASSIFY_TYPE: "classifyType",
    READ_TYPE: "readType",
    RECORD_COUNT_FROM_INITIALIZATION: "recordCountFromInitialization",
    RECORD_SINGLE_ROUND: "recordSingleRound",
    RECORD_TYPE: "recordType",
    SYNC_RUNTIME: "syncRuntime",
  }),
  runBattleRoundAutomation: mocks.runBattleRoundAutomation,
}));
vi.mock("./battle-stamina.js", () => ({
  BattleStaminaEvent: Object.freeze({ ROUND_LOG_READY: "roundLogReady" }),
  runBattleStaminaAutomation: mocks.runBattleStaminaAutomation,
}));

beforeEach(() => {
  const state = { turn: 2, autoTunePotionCount: 3 };
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.g.mockImplementation((key, value) => {
    if (value !== undefined) {
      state[key] = value;
      return value;
    }
    return state[key];
  });
  mocks.gE.mockReturnValue([
    { textContent: "Round begins" },
    { textContent: "Initializing random encounter" },
  ]);
  mocks.runBattleRoundAutomation.mockImplementation((event) => {
    if (event.type === "readType") return "";
    if (event.type === "classifyType") return "ba";
    if (event.type === "recordType") return event.roundType;
    return undefined;
  });
  mocks.runBattleStaminaAutomation.mockReturnValue({ lostStamina: 1, paused: false });
  mocks.runMonsterStatusAutomation.mockReturnValue(false);
  mocks.runOptionAutomation.mockImplementation(
    (event) => event.key === "autoTune" || event.key === "encounter"
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

  it("reads round-start options through the option entry", () => {
    expect(runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED })).toBe(true);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "autoTune",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "encounter",
      fallback: false,
    });
    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({
      type: "recordBattle",
      potionsUsed: 3,
    });
    expect(mocks.runEncounterAutomation).toHaveBeenCalledWith({
      type: "randomEncounterStarted",
    });
  });
});
