import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleSnapshotEvent, runBattleSnapshot } from "./snapshot.js";

const mocks = vi.hoisted(() => ({
  runAbilityAoeAutomation: vi.fn(() => ({})),
  runBattleItemSurface: vi.fn(() => ""),
  runBattleLogTelemetry: vi.fn(),
  runBattleMonsterSurface: vi.fn(() => []),
  runBattleMonsterView: vi.fn(() => ({
    aliveCount: 1,
    firstMonsterHpPercent: 40,
    lowestMonsterHpPercent: 40,
    monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
    soloMonsterHpPercent: 40,
    view: [{ monsterId: 101, isDead: false }],
  })),
  runBattleObservationLearning: vi.fn(() => ({ learnedBurstByMid: {} })),
  runBattlePlayerEffects: vi.fn(() => ({
    channeling: false,
    etherTapActiveX2: false,
    etherTapExpiring: false,
    playerBuffs: [],
    playerEffectTurns: {},
    playerEffects: [],
  })),
  runBattlePlayerVitals: vi.fn(() => ({ hp: 50, mp: 50, sp: 50, oc: 0 })),
  runBattleSkillReadiness: vi.fn(() => ({})),
  runBattleSkillUsageAutomation: vi.fn(() => ({})),
  runBattleSpiritToggleAutomation: vi.fn(() => false),
  runBattleTurnAutomation: vi.fn(() => 7),
  runCdRuntimeAutomation: vi.fn(() => ({})),
}));

vi.mock("../state/battle-turn.js", () => ({
  BattleTurnEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleTurnAutomation: mocks.runBattleTurnAutomation,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ READ_GLOBAL_TURN: "readGlobalTurn", READ_MAP: "readMap" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("./battle-log-telemetry.js", () => ({
  BattleLogTelemetryEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleLogTelemetry: mocks.runBattleLogTelemetry,
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
});

describe("runBattleSnapshot battle log telemetry", () => {
  it("reuses prelude battle log telemetry when supplied", () => {
    const logTelemetry = {
      battleLog: [{ kind: "player-incoming", source: "Alpha", dmg: 12 }],
      monsterDpsByName: { Alpha: { total: 12, perTurn: 12, count: 1 } },
      playerIncomingDps: { sampleCount: 1 },
    };

    const snap = runBattleSnapshot({ type: BattleSnapshotEvent.READ_CURRENT, logTelemetry });

    expect(mocks.runBattleLogTelemetry).not.toHaveBeenCalled();
    expect(snap.playerIncomingDps).toBe(logTelemetry.playerIncomingDps);
    expect(snap.monsterDpsByName).toBe(logTelemetry.monsterDpsByName);
    expect(mocks.runBattleObservationLearning).toHaveBeenCalledWith(
      expect.objectContaining({ battleLog: logTelemetry.battleLog })
    );
  });
});
