import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectSnapshot } from "./snapshot.js";

const mocks = vi.hoisted(() => ({
  estimatePerMonsterDps: vi.fn(() => ({})),
  estimatePlayerIncomingDps: vi.fn(() => 0),
  g: vi.fn(),
  gE: vi.fn(),
  isSpiritActive: vi.fn(() => false),
  joinMonsterView: vi.fn(() => []),
  monsterHpVars: vi.fn(() => ({})),
  parseBattleLog: vi.fn(() => []),
  runBigSkillKillLearningAutomation: vi.fn(),
  runBattleTurnAutomation: vi.fn(() => 7),
  runCdLearningAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runIncomingBurstLearningAutomation: vi.fn(() => ({ learned: true })),
  runMonsterCacheAutomation: vi.fn(() => ({})),
  runOptionAutomation: vi.fn(),
  runRecoveryLearningAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isSpiritActive: mocks.isSpiritActive }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/battle-turn.js", () => ({
  BattleTurnEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleTurnAutomation: mocks.runBattleTurnAutomation,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ READ_GLOBAL_TURN: "readGlobalTurn", READ_MAP: "readMap" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("./log-parser.js", () => ({
  estimatePerMonsterDps: mocks.estimatePerMonsterDps,
  estimatePlayerIncomingDps: mocks.estimatePlayerIncomingDps,
  parseBattleLog: mocks.parseBattleLog,
}));
vi.mock("../state/recovery-learner.js", () => ({
  RecoveryLearningEvent: Object.freeze({ FINALIZE_PENDING: "finalizePending" }),
  runRecoveryLearningAutomation: mocks.runRecoveryLearningAutomation,
}));
vi.mock("../state/cd-learner.js", () => ({
  CdLearningEvent: Object.freeze({ FINALIZE_PENDING: "finalizePending" }),
  runCdLearningAutomation: mocks.runCdLearningAutomation,
}));
vi.mock("../state/big-skill-kill-learner.js", () => ({
  BigSkillKillLearningEvent: Object.freeze({ FINALIZE_PENDING: "finalizePending" }),
  runBigSkillKillLearningAutomation: mocks.runBigSkillKillLearningAutomation,
}));
vi.mock("../state/incoming-burst-learner.js", () => ({
  IncomingBurstLearningEvent: Object.freeze({
    READ_MAP: "readMap",
    RECORD_EVENTS: "recordEvents",
  }),
  runIncomingBurstLearningAutomation: mocks.runIncomingBurstLearningAutomation,
}));
vi.mock("./effect-parse.js", () => ({ parseEffectName: () => "", parseEffectTurns: () => 0 }));
vi.mock("./monster-view.js", () => ({
  joinMonsterView: mocks.joinMonsterView,
  monsterHpVars: mocks.monsterHpVars,
}));
vi.mock("../state/monster-cache.js", () => ({
  MonsterCacheEvent: Object.freeze({ READ_DB: "readDb" }),
  runMonsterCacheAutomation: mocks.runMonsterCacheAutomation,
}));

function effectsContainer() {
  return { querySelectorAll: () => [] };
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear?.();
  mocks.g.mockImplementation((key) => ({ globalTurn: 9 })[key]);
  mocks.runCdRuntimeAutomation.mockImplementation((event) => {
    if (event.type === "readGlobalTurn") return 9;
    if (event.type === "readMap") return {};
    return undefined;
  });
  mocks.gE.mockImplementation((selector, mode) => {
    if (mode === "all") return [];
    if (selector === "#pane_effects") return effectsContainer();
    if (selector === "#vbh") return {};
    if (selector === "#vbh>div>img") return { offsetWidth: 250 };
    if (selector === "#vbm>div>img") return { offsetWidth: 105 };
    if (selector === "#vbs>div>img") return { offsetWidth: 105 };
    if (selector === "#vcp>div>div") return null;
    if (selector === "#dvrhd") return { textContent: "1000" };
    if (selector === "#dvrm") return { textContent: "500" };
    if (selector === "#dvrs") return { textContent: "400" };
    return null;
  });
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.key === "burstControlSwitch") return true;
    if (event.key === "fightingStyle") return "1";
    return event.fallback;
  });
});

describe("collectSnapshot", () => {
  it("reads snapshot option facts through the option entry", () => {
    const snap = collectSnapshot();

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "burstControlSwitch",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "fightingStyle",
      fallback: "2",
    });
    expect(snap.fightingStyle).toBe("1");
    expect(snap.turn).toBe(7);
    expect(snap.globalTurn).toBe(9);
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readGlobalTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readMap" });
    expect(snap.learnedBurstByMid).toEqual({ learned: true });
  });
});
