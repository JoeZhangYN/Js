import { BattleMonitorEvent, runBattleMonitorAutomation } from "../monitor/battle-monitor-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import { BattleCompletionEvent, runBattleCompletionAutomation } from "./battle-completion.js";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleNextRoundContinuationEvent, runBattleNextRoundContinuation } from "./battle-next-round-continuation.js";
import { BattleActionLifecycleEvidenceEvent, runBattleActionLifecycleEvidence } from "./battle-action-lifecycle-evidence.js";
import { recordLifecycleSafely } from "./battle-action-lifecycle-recording.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_UNKNOWN_ACTION_LIFECYCLE = "unknownActionLifecycleEvent";
const OUTCOME_NEXT_ROUND = "nextRound";
const OUTCOME_ONGOING = "ongoing";
const OUTCOME_REJECTED = "rejected";
const REASON_ACTION_LIFECYCLE_STEP_THROW = "actionLifecycleStepThrew";

export const BattleActionLifecycleEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

function runActionStarted(deps) {
  const steps = [];
  recordStep(steps, "startDelay", deps.startDelay);
  recordStep(steps, "monitorActionStarted", deps.monitorActionStarted);
  const started = steps.every((step) => step.result);
  recordLifecycleSafely(deps, EVENT_ACTION_STARTED, started, steps);
  return started;
}

function recordStep(steps, step, run) {
  try {
    const stepResult = normalizeStepResult(run());
    steps.push({ step, ...stepResult });
    return stepResult.result;
  } catch (error) {
    recordThrownStep(steps, step, error);
    return false;
  }
}

function normalizeStepResult(rawResult) {
  if (rawResult === undefined) return { result: true };
  if (rawResult?.kind === "failed") return { result: false, detail: rawResult };
  if (rawResult && typeof rawResult === "object" && "kind" in rawResult) {
    return { result: true, detail: rawResult };
  }
  return { result: rawResult };
}

function recordThrownStep(steps, step, error) {
  steps.push({
    step,
    result: false,
    reason: REASON_ACTION_LIFECYCLE_STEP_THROW,
    error: error?.message || String(error),
  });
}

function rejectedLifecycleResult(failedStep) {
  return {
    outcome: OUTCOME_REJECTED,
    reason: REASON_ACTION_LIFECYCLE_STEP_THROW,
    failedStep,
  };
}

function completeBattleStep(deps, steps) {
  try {
    const completion = deps.completeBattle();
    steps.push({ step: "completeBattle", result: completion.outcome });
    return { ok: true, completion };
  } catch (error) {
    recordThrownStep(steps, "completeBattle", error);
    return { ok: false, result: rejectedLifecycleResult("completeBattle") };
  }
}

function continueNextRoundStep(deps, steps) {
  const continued = "nextRound";
  const continuationStarted = Boolean(recordStep(steps, "continue", deps.continueNextRound));
  steps[steps.length - 1].continued = continued;
  return { continued, continuationStarted };
}

function handleCompletion(deps, steps) {
  const completed = completeBattleStep(deps, steps);
  if (!completed.ok) return completed.result;
  const completion = completed.completion;
  if (completion.outcome === OUTCOME_NEXT_ROUND) {
    const { continued, continuationStarted } = continueNextRoundStep(deps, steps);
    return { outcome: completion.outcome, continued, continuationStarted };
  }
  return { outcome: completion.outcome, continued: false, continuationStarted: false };
}

function runActionEnded(deps) {
  const steps = [];
  recordStep(steps, "recordSpeed", deps.recordSpeed);
  recordStep(steps, "endDelay", deps.endDelay);
  recordStep(steps, "refreshCombatants", deps.refreshCombatants);
  recordStep(steps, "monitorActionEnded", deps.monitorActionEnded);
  const completionReached = Boolean(recordStep(steps, "isCompletionReached", deps.isCompletionReached));
  const completionReachedStep = steps[steps.length - 1];
  if (completionReachedStep.reason === REASON_ACTION_LIFECYCLE_STEP_THROW) {
    const result = rejectedLifecycleResult("isCompletionReached");
    recordLifecycleSafely(deps, EVENT_ACTION_ENDED, result, steps);
    return result;
  }
  if (completionReached) {
    const result = handleCompletion(deps, steps);
    recordLifecycleSafely(deps, EVENT_ACTION_ENDED, result, steps);
    return result;
  }
  const turnStarted = Boolean(recordStep(steps, "runTurn", deps.runTurn));
  const result = { outcome: OUTCOME_ONGOING, continued: "turn", continuationStarted: turnStarted };
  recordLifecycleSafely(deps, EVENT_ACTION_ENDED, result, steps);
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
  recordLifecycleSafely(deps, EVENT_UNKNOWN_ACTION_LIFECYCLE, result, [
    { step: "routeEvent", result: false, reason: EVENT_UNKNOWN_ACTION_LIFECYCLE, eventType: result.eventType },
  ]);
  return false;
}

export function runBattleActionLifecycleAutomation(
  event = { type: EVENT_ACTION_STARTED },
  deps = {
    startDelay: () => runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }),
    recordSpeed: () => runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }),
    endDelay: () => runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }),
    refreshCombatants: () => runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS }),
    monitorActionStarted: () => runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_STARTED }),
    monitorActionEnded: () => runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_ENDED }),
    completeBattle: () => runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }),
    isCompletionReached: () => runBattleCompletionAutomation({ type: BattleCompletionEvent.READ_REACHED }),
    continueNextRound: () => runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }),
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
