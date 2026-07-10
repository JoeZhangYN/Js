import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import { BattleCompletionEvent, runBattleCompletionAutomation } from "./battle-completion.js";
import {
  BattleNextRoundContinuationEvent,
  runBattleNextRoundContinuation,
} from "./battle-next-round-continuation.js";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import {
  PhysicalSkillUtilityObservationEvent,
  runPhysicalSkillUtilityObservation,
} from "./physical-skill-utility-observation.js";

export function createBattleActionLifecycleDeps() {
  return {
    startDelay: () =>
      runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }),
    recordSpeed: () =>
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }),
    endDelay: () => runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }),
    refreshCombatants: () =>
      runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS }),
    finalizeUtilityObservation: () =>
      runPhysicalSkillUtilityObservation({
        type: PhysicalSkillUtilityObservationEvent.FINALIZE_AFTER_ACTION,
      }),
    monitorActionStarted: () =>
      runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_STARTED }),
    monitorActionEnded: () => runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_ENDED }),
    completeBattle: () =>
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }),
    isCompletionReached: () =>
      runBattleCompletionAutomation({ type: BattleCompletionEvent.READ_REACHED }),
    continueNextRound: () =>
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }),
    runTurn: () => runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN }),
    recordLifecycle: (phase, result, steps) =>
      runBattleActionLifecycleEvidence({
        type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
        phase,
        result,
        steps,
      }),
  };
}
