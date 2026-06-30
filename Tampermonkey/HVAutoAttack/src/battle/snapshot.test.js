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
  runBattleObservationLearning: vi.fn(() => ({ learnedBurstByMid: { learned: true } })),
  runBattleSkillUsageAutomation: vi.fn(() => ({ OFC: 1 })),
  runBattleTurnAutomation: vi.fn(() => 7),
  runCdRuntimeAutomation: vi.fn(),
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
vi.mock("./battle-observation-learning.js", () => ({
  BattleObservationLearningEvent: Object.freeze({
    FINALIZE_TURN_OBSERVATIONS: "finalizeTurnObservations",
  }),
  runBattleObservationLearning: mocks.runBattleObservationLearning,
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
    expect(snap.spellAoe).toEqual({ Imperil: 2 });
    expect(snap.skillOTOS).toEqual({ OFC: 1 });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runBattleMonsterView).toHaveBeenCalledWith({
      type: "readView",
      monsters: [],
    });
    expect(mocks.runBattleSkillUsageAutomation).toHaveBeenCalledWith({ type: "readUsage" });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "readSpellAoe" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readGlobalTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "readMap" });
    expect(mocks.runBattleObservationLearning).toHaveBeenCalledWith({
      type: "finalizeTurnObservations",
      battleLog: [],
      globalTurn: 9,
      learnIncomingBurst: true,
      monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
      skillReady: { 111: true },
      view: [{ monsterId: 101, isDead: false }],
      vitals: expect.objectContaining({ hpAbs: 500, mpAbs: 250, spAbs: 200 }),
    });
    expect(snap.learnedBurstByMid).toEqual({ learned: true });
  });

  it("skips incoming burst learning when the turn context does not request it", () => {
    mocks.runBattleObservationLearning.mockReturnValueOnce({ learnedBurstByMid: {} });

    const snap = collectSnapshot();

    expect(mocks.runBattleObservationLearning).toHaveBeenCalledWith({
      type: "finalizeTurnObservations",
      battleLog: [],
      globalTurn: 9,
      learnIncomingBurst: false,
      monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
      skillReady: {},
      view: [{ monsterId: 101, isDead: false }],
      vitals: expect.any(Object),
    });
    expect(snap.learnedBurstByMid).toEqual({});
  });
});
