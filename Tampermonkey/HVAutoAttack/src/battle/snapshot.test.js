import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectSnapshot } from "./snapshot.js";

const mocks = vi.hoisted(() => ({
  estimatePerMonsterDps: vi.fn(() => ({})),
  estimatePlayerIncomingDps: vi.fn(() => 0),
  gE: vi.fn(),
  isSpiritActive: vi.fn(() => false),
  joinMonsterView: vi.fn(() => []),
  monsterHpVars: vi.fn(() => ({})),
  parseBattleLog: vi.fn(() => []),
  runAbilityAoeAutomation: vi.fn(() => ({ Imperil: 2 })),
  runBigSkillKillLearningAutomation: vi.fn(),
  runBattleSkillUsageAutomation: vi.fn(() => ({ OFC: 1 })),
  runBattleStartRuntimeAutomation: vi.fn(() => 2),
  runBattleTurnAutomation: vi.fn(() => 7),
  runCdLearningAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runIncomingBurstLearningAutomation: vi.fn(() => ({ learned: true })),
  runMonsterCacheAutomation: vi.fn(() => ({})),
  runMonsterStatusAutomation: vi.fn(() => [{ order: 0, monsterId: 101 }]),
  runRecoveryLearningAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isSpiritActive: mocks.isSpiritActive }));
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
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_STATUS: "readStatus" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));
vi.mock("../pages/ability-page.js", () => ({
  AbilityAoeEvent: Object.freeze({ READ_SPELL_AOE: "readSpellAoe" }),
  runAbilityAoeAutomation: mocks.runAbilityAoeAutomation,
}));
vi.mock("./battle-start-runtime.js", () => ({
  BattleStartRuntimeEvent: Object.freeze({ READ_ATTACK_STATUS: "readAttackStatus" }),
  runBattleStartRuntimeAutomation: mocks.runBattleStartRuntimeAutomation,
}));
vi.mock("./battle-skill-usage.js", () => ({
  BattleSkillUsageEvent: Object.freeze({ READ_USAGE: "readUsage" }),
  runBattleSkillUsageAutomation: mocks.runBattleSkillUsageAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear?.();
  mocks.runCdRuntimeAutomation.mockImplementation((event) => {
    if (event.type === "readGlobalTurn") return 9;
    if (event.type === "readMap") return {};
    return undefined;
  });
  mocks.gE.mockImplementation((selector, mode) => {
    if (mode === "all") return [];
    if (selector === "#pane_effects") return { querySelectorAll: () => [] };
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
});

describe("collectSnapshot", () => {
  it("collects one battle snapshot and learns incoming burst when requested", () => {
    const snap = collectSnapshot({ learnIncomingBurst: true });

    expect(snap.turn).toBe(7);
    expect(snap.globalTurn).toBe(9);
    expect(snap.attackStatus).toBe(2);
    expect(snap.spellAoe).toEqual({ Imperil: 2 });
    expect(snap.skillOTOS).toEqual({ OFC: 1 });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({ type: "readStatus" });
    expect(mocks.joinMonsterView).toHaveBeenCalledWith([], [{ order: 0, monsterId: 101 }], {});
    expect(mocks.runBattleSkillUsageAutomation).toHaveBeenCalledWith({ type: "readUsage" });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "readSpellAoe" });
    expect(mocks.runBattleStartRuntimeAutomation).toHaveBeenCalledWith({
      type: "readAttackStatus",
    });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readGlobalTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readMap" });
    expect(mocks.runIncomingBurstLearningAutomation).toHaveBeenCalledWith({
      type: "recordEvents",
      events: [],
      monsterStatus: [{ order: 0, monsterId: 101 }],
    });
    expect(snap.learnedBurstByMid).toEqual({ learned: true });
  });

  it("skips incoming burst learning when the turn context does not request it", () => {
    const snap = collectSnapshot();

    expect(mocks.runIncomingBurstLearningAutomation).not.toHaveBeenCalledWith({
      type: "recordEvents",
      events: [],
      monsterStatus: [{ order: 0, monsterId: 101 }],
    });
    expect(snap.learnedBurstByMid).toEqual({});
  });
});
