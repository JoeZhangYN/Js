// BattleSnapshot 收集（Phase 5b-1）。
// file-size-gate: exempt phase-5b-snapshot
// 每 turn 入口一次性 batch DOM 读取 → plain object → decide 函数全程纯函数（不再读 DOM）。
//
// **3 铁律**：
// A. snapshot 只存值（number/string/array of plain object），**禁** Element / Node 引用
// B. snapshot 生命周期 = 当前 turn 内（不入 store / setValue）
// C. dispatch 副作用用 selector 字符串重查询 DOM，不用缓存引用
//
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import {
  BattleObservationLearningEvent,
  runBattleObservationLearning,
} from "./battle-observation-learning.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "../pages/ability-page.js";
import { BattleSkillUsageEvent, runBattleSkillUsageAutomation } from "./battle-skill-usage.js";
import { BattleMonsterSurfaceEvent, runBattleMonsterSurface } from "./battle-monster-surface.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";
import { BattleSkillReadinessEvent, runBattleSkillReadiness } from "./battle-skill-readiness.js";
import { BattlePlayerVitalsEvent, runBattlePlayerVitals } from "./battle-player-vitals.js";
import { BattlePlayerEffectsEvent, runBattlePlayerEffects } from "./battle-player-effects.js";
import { BattleItemSurfaceEvent, runBattleItemSurface } from "./battle-item-surface.js";
import { BattleLogTelemetryEvent, runBattleLogTelemetry } from "./battle-log-telemetry.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

/**
 * 一次性 batch DOM read 组装当前 turn snapshot。
 * @returns {import("../core/types.js").BattleSnapshot}
 */
export function collectSnapshot(event = {}) {
  const monsters = runBattleMonsterSurface({ type: BattleMonsterSurfaceEvent.READ_CURRENT });
  const monsterView = runBattleMonsterView({
    type: BattleMonsterViewEvent.READ_VIEW,
    monsters,
  });
  const { view, monsterIdentities } = monsterView;
  const playerEffects = runBattlePlayerEffects({ type: BattlePlayerEffectsEvent.READ_CURRENT });
  const vitals = runBattlePlayerVitals({ type: BattlePlayerVitalsEvent.READ_CURRENT });
  const turn = runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT });
  const logTelemetry = runBattleLogTelemetry({
    type: BattleLogTelemetryEvent.READ_CURRENT,
    turn,
  });
  // 学习器 finalize 全部跑在 rules 之前（结算上回合行动的观测）。globalTurn/skillReady 先备好供两用。
  const globalTurn = runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_GLOBAL_TURN });
  const skillReady = runBattleSkillReadiness({ type: BattleSkillReadinessEvent.READ_READY_MAP });
  const learnIncomingBurst = !!event.learnIncomingBurst;
  const observationLearning = runBattleObservationLearning({
    type: BattleObservationLearningEvent.FINALIZE_TURN_OBSERVATIONS,
    battleLog: logTelemetry.battleLog,
    globalTurn,
    learnIncomingBurst,
    monsterIdentities,
    skillReady,
    view,
    vitals,
  });
  return {
    turn,
    globalTurn,
    ...vitals,
    channeling: playerEffects.channeling,
    spiritOn: runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.READ_ACTIVE }),
    monsters,
    view,
    aliveCount: monsterView.aliveCount,
    soloMonsterHpPercent: monsterView.soloMonsterHpPercent,
    lowestMonsterHpPercent: monsterView.lowestMonsterHpPercent,
    firstMonsterHpPercent: monsterView.firstMonsterHpPercent,
    playerBuffs: playerEffects.playerBuffs,
    playerEffectTurns: playerEffects.playerEffectTurns,
    etherTapActiveX2: playerEffects.etherTapActiveX2,
    etherTapExpiring: playerEffects.etherTapExpiring,
    // 深度B：玩家效果明细 [{img,name,turns}]（供 channel/critical 等 decide 用，含显示名+剩余回合）
    playerEffects: playerEffects.playerEffects,
    gemName: runBattleItemSurface({ type: BattleItemSurfaceEvent.READ_GEM_NAME }),
    cdMap: runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_MAP }),
    skillReady,
    skillOTOS: runBattleSkillUsageAutomation({ type: BattleSkillUsageEvent.READ_USAGE }),
    spellAoe: runAbilityAoeAutomation({ type: AbilityAoeEvent.READ_SPELL_AOE }),
    playerIncomingDps: logTelemetry.playerIncomingDps,
    monsterDpsByName: logTelemetry.monsterDpsByName,
    // F5：每 MID 致死/爆发伤害学习表（开关关→空，decide 自然 noop）
    learnedBurstByMid: observationLearning.learnedBurstByMid,
  };
}
