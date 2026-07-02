import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleSnapshotEvent, runBattleSnapshot } from "./snapshot.js";

const mocks = vi.hoisted(() => ({
  runBattleMonsterSurface: vi.fn(() => []),
  runBattleMonsterView: vi.fn(() => ({
    aliveCount: 1,
    firstMonsterHpPercent: 40,
    lowestMonsterHpPercent: 40,
    soloMonsterHpPercent: 40,
    view: [{ monsterId: 101, isDead: false }],
    monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
  })),
  runAbilityAoeAutomation: vi.fn(() => ({ Imperil: 2 })),
  runBattleItemSurface: vi.fn(() => "Mystic Gem"),
  runBattleLogTelemetry: vi.fn(() => ({ battleLog: [], monsterDpsByName: {}, playerIncomingDps: { sampleCount: 0 } })),
  runBattleObservationLearning: vi.fn(() => ({ learnedBurstByMid: { learned: true } })),
  runBattlePlayerEffects: vi.fn(() => ({
    channeling: false, etherTapActiveX2: false, etherTapExpiring: false,
    playerBuffs: [], playerEffectTurns: {}, playerEffects: [],
  })),
  runBattlePlayerVitals: vi.fn(() => ({ hp: 50, mp: 50, sp: 50, oc: 0, hpAbs: 500, mpAbs: 250, spAbs: 200 })),
  runBattleSkillReadiness: vi.fn(() => ({ 111: true })),
  runBattleSkillUsageAutomation: vi.fn(() => ({ OFC: 1 })),
  runBattleSpiritToggleAutomation: vi.fn(() => false),
  runBattleTurnAutomation: vi.fn(() => 7),
  runCdRuntimeAutomation: vi.fn(),
}));

vi.mock("../state/battle-turn.js", () => ({
  BattleTurnEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleTurnAutomation: mocks.runBattleTurnAutomation,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ READ_GLOBAL_TURN: "readGlobalTurn", READ_MAP: "readMap" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("./battle-observation-learning.js", () => ({
  BattleObservationLearningEvent: Object.freeze({
    FINALIZE_TURN_OBSERVATIONS: "finalizeTurnObservations",
  }),
  runBattleObservationLearning: mocks.runBattleObservationLearning,
}));
vi.mock("./battle-monster-surface.js", () => ({
  BattleMonsterSurfaceEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleMonsterSurface: mocks.runBattleMonsterSurface,
}));
vi.mock("./battle-monster-view.js", () => ({
  BattleMonsterViewEvent: Object.freeze({ READ_VIEW: "readView" }),
  runBattleMonsterView: mocks.runBattleMonsterView,
}));
vi.mock("./battle-skill-readiness.js", () => ({
  BattleSkillReadinessEvent: Object.freeze({ READ_READY_MAP: "readReadyMap" }),
  runBattleSkillReadiness: mocks.runBattleSkillReadiness,
}));
vi.mock("./battle-player-vitals.js", () => ({
  BattlePlayerVitalsEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattlePlayerVitals: mocks.runBattlePlayerVitals,
}));
vi.mock("./battle-player-effects.js", () => ({
  BattlePlayerEffectsEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattlePlayerEffects: mocks.runBattlePlayerEffects,
}));
vi.mock("../pages/ability-page.js", () => ({
  AbilityAoeEvent: Object.freeze({ READ_SPELL_AOE: "readSpellAoe" }),
  runAbilityAoeAutomation: mocks.runAbilityAoeAutomation,
}));
vi.mock("./battle-item-surface.js", () => ({
  BattleItemSurfaceEvent: Object.freeze({ READ_GEM_NAME: "readGemName" }),
  runBattleItemSurface: mocks.runBattleItemSurface,
}));
vi.mock("./battle-log-telemetry.js", () => ({
  BattleLogTelemetryEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleLogTelemetry: mocks.runBattleLogTelemetry,
}));
vi.mock("./battle-skill-usage.js", () => ({
  BattleSkillUsageEvent: Object.freeze({ READ_USAGE: "readUsage" }),
  runBattleSkillUsageAutomation: mocks.runBattleSkillUsageAutomation,
}));
vi.mock("./battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ READ_ACTIVE: "readActive" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear?.();
  mocks.runCdRuntimeAutomation.mockImplementation((event) => {
    if (event.type === "readGlobalTurn") return 9;
    if (event.type === "readMap") return {};
    return undefined;
  });
});

describe("runBattleSnapshot", () => {
  it("collects one battle snapshot and learns incoming burst when requested", () => {
    const snap = runBattleSnapshot({
      type: BattleSnapshotEvent.READ_CURRENT,
      learnIncomingBurst: true,
    });

    expect(snap.turn).toBe(7);
    expect(snap.globalTurn).toBe(9);
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runBattleLogTelemetry).toHaveBeenCalledWith({ type: "readCurrent", turn: 7 });
    expect(mocks.runBattleMonsterSurface).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runBattleMonsterView).toHaveBeenCalledWith({ type: "readView", monsters: [] });
    expect(mocks.runBattleSkillReadiness).toHaveBeenCalledWith({ type: "readReadyMap" });
    expect(mocks.runBattlePlayerVitals).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runBattlePlayerEffects).toHaveBeenCalledWith({ type: "readCurrent" });
    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({ type: "readActive" });
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
    mocks.runBattleSkillReadiness.mockReturnValueOnce({});

    const snap = runBattleSnapshot({ type: BattleSnapshotEvent.READ_CURRENT });

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

  it("rejects unknown snapshot events without side effects", () => {
    expect(runBattleSnapshot({ type: "unknown" })).toBeUndefined();
    expect(runBattleSnapshot(null)).toBeUndefined();

    expect(mocks.runBattleMonsterSurface).not.toHaveBeenCalled();
    expect(mocks.runBattleObservationLearning).not.toHaveBeenCalled();
  });
});
