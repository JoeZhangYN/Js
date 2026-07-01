import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import {
  BattleCompletionEvent,
  runBattleCompletionAutomation,
} from "./battle-completion.js";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import {
  BattleNextRoundContinuationEvent,
  runBattleNextRoundContinuation,
} from "./battle-next-round-continuation.js";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_UNKNOWN_ACTION_LIFECYCLE = "unknownActionLifecycleEvent";
const OUTCOME_NEXT_ROUND = "nextRound";
const OUTCOME_ONGOING = "ongoing";
const OUTCOME_REJECTED = "rejected";

export const BattleActionLifecycleEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

function runActionStarted(deps) {
  const steps = [];
  deps.startDelay();
  steps.push({ step: "startDelay", result: true });
  deps.monitorActionStarted();
  steps.push({ step: "monitorActionStarted", result: true });
  deps.recordLifecycle(EVENT_ACTION_STARTED, true, steps);
  return true;
}

function handleCompletion(deps) {
  const completion = deps.completeBattle();
  if (completion.outcome === OUTCOME_NEXT_ROUND) {
    deps.continueNextRound();
    return { outcome: completion.outcome, continued: "nextRound" };
  }
  return { outcome: completion.outcome, continued: false };
}

function runActionEnded(deps) {
  const steps = [];
  deps.recordSpeed();
  steps.push({ step: "recordSpeed", result: true });
  deps.endDelay();
  steps.push({ step: "endDelay", result: true });
  deps.refreshCombatants();
  steps.push({ step: "refreshCombatants", result: true });
  deps.monitorActionEnded();
  steps.push({ step: "monitorActionEnded", result: true });
  if (deps.isCompletionReached()) {
    steps.push({ step: "isCompletionReached", result: true });
    const result = handleCompletion(deps);
    steps.push({ step: "completeBattle", result: result.outcome });
    steps.push({ step: "continue", result: result.continued });
    deps.recordLifecycle(EVENT_ACTION_ENDED, result, steps);
    return result;
  }
  steps.push({ step: "isCompletionReached", result: false });
  deps.runTurn();
  steps.push({ step: "runTurn", result: true });
  const result = { outcome: OUTCOME_ONGOING, continued: "turn" };
  deps.recordLifecycle(EVENT_ACTION_ENDED, result, steps);
  return result;
}

const battleActionLifecycleEventHandlers = Object.freeze({
  [EVENT_ACTION_STARTED]: (deps) => runActionStarted(deps),
  [EVENT_ACTION_ENDED]: (deps) => runActionEnded(deps),
});

function rejectUnknownActionLifecycleEvent(event, deps) {
  const result = {
    outcome: OUTCOME_REJECTED,
    reason: EVENT_UNKNOWN_ACTION_LIFECYCLE,
    eventType: event?.type ?? null,
  };
  deps.recordLifecycle(EVENT_UNKNOWN_ACTION_LIFECYCLE, result, [
    { step: "routeEvent", result: false, reason: EVENT_UNKNOWN_ACTION_LIFECYCLE, eventType: result.eventType },
  ]);
  return false;
}

export function runBattleActionLifecycleAutomation(
  event = { type: EVENT_ACTION_STARTED },
  deps = {
    startDelay: () =>
      runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }),
    recordSpeed: () =>
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }),
    endDelay: () => runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }),
    refreshCombatants: () =>
      runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS }),
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
  }
) {
  return battleActionLifecycleEventHandlers[event?.type]?.(deps) ?? rejectUnknownActionLifecycleEvent(event, deps);
}
