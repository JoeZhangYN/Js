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

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const OUTCOME_NEXT_ROUND = "nextRound";
const OUTCOME_ONGOING = "ongoing";

export const BattleActionLifecycleEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

function runActionStarted(deps) {
  deps.startDelay();
  deps.monitorActionStarted();
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
  deps.recordSpeed();
  deps.endDelay();
  deps.refreshCombatants();
  deps.monitorActionEnded();
  if (deps.isCompletionReached()) return handleCompletion(deps);
  deps.runTurn();
  return { outcome: OUTCOME_ONGOING, continued: "turn" };
}

const battleActionLifecycleEventHandlers = Object.freeze({
  [EVENT_ACTION_STARTED]: (deps) => runActionStarted(deps),
  [EVENT_ACTION_ENDED]: (deps) => runActionEnded(deps),
});

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
  }
) {
  return battleActionLifecycleEventHandlers[event.type]?.(deps) ?? false;
}
