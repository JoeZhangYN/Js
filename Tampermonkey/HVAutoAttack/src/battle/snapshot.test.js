import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectSnapshot } from "./snapshot.js";

const mocks = vi.hoisted(() => ({
  estimatePerMonsterDps: vi.fn(() => ({})),
  estimatePlayerIncomingDps: vi.fn(() => 0),
  gE: vi.fn(),
  isSpiritActive: vi.fn(() => false),
  runBattleMonsterView: vi.fn(() => ({
    view: [{ monsterId: 101, isDead: false }],
    monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
  })),
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
  monsterHpVars: mocks.monsterHpVars,
}));
vi.mock("./battle-monster-view.js", () => ({
  BattleMonsterViewEvent: Object.freeze({ READ_VIEW: "readView" }),
  runBattleMonsterView: mocks.runBattleMonsterView,
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
  document.body.innerHTML = "";
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
    document.body.innerHTML = '<button id="111"></button>';

    const snap = collectSnapshot({ learnIncomingBurst: true });

    expect(snap.turn).toBe(7);
    expect(snap.globalTurn).toBe(9);
    expect(snap.attackStatus).toBe(2);
    expect(snap.spellAoe).toEqual({ Imperil: 2 });
    expect(snap.skillOTOS).toEqual({ OFC: 1 });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runBattleMonsterView).toHaveBeenCalledWith({
      type: "readView",
      monsters: [],
    });
    expect(mocks.runBattleSkillUsageAutomation).toHaveBeenCalledWith({ type: "readUsage" });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "readSpellAoe" });
    expect(mocks.runBattleStartRuntimeAutomation).toHaveBeenCalledWith({
      type: "readAttackStatus",
    });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readGlobalTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readMap" });
    expect(mocks.runRecoveryLearningAutomation).toHaveBeenCalledWith({
      type: "finalizePending",
      snap: { recoveryAbs: { hp: 500, mp: 250, sp: 200 } },
    });
    expect(mocks.runCdLearningAutomation).toHaveBeenCalledWith({
      type: "finalizePending",
      globalTurn: 9,
      readySkillIds: ["111"],
    });
    expect(mocks.runBigSkillKillLearningAutomation).toHaveBeenCalledWith({
      type: "finalizePending",
      snap: { globalTurn: 9, liveMonsterIds: [101] },
    });
    expect(mocks.runIncomingBurstLearningAutomation).toHaveBeenCalledWith({
      type: "recordEvents",
      events: [],
      monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
    });
    expect(snap.learnedBurstByMid).toEqual({ learned: true });
  });

  it("skips incoming burst learning when the turn context does not request it", () => {
    const snap = collectSnapshot();

    expect(mocks.runIncomingBurstLearningAutomation).not.toHaveBeenCalledWith({
      type: "recordEvents",
      events: [],
      monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
    });
    expect(snap.learnedBurstByMid).toEqual({});
  });
});
