import { gE } from "../dom/query.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import {
  BattleCompletionEvent,
  BattleCompletionOutcome,
  runBattleCompletionAutomation,
} from "./battle-completion.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import {
  BattleNextRoundContinuationEvent,
  runBattleNextRoundContinuation,
} from "./battle-next-round-continuation.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";

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
  if (completion.outcome === BattleCompletionOutcome.NEXT_ROUND) {
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
  if (deps.gE("#btcp")) return handleCompletion(deps);
  deps.runTurn();
  return { outcome: BattleCompletionOutcome.ONGOING, continued: "turn" };
}

const lifecycleHandlers = Object.freeze({
  [EVENT_ACTION_STARTED]: (deps) => runActionStarted(deps),
  [EVENT_ACTION_ENDED]: (deps) => runActionEnded(deps),
});

export function runBattleActionLifecycleAutomation(
  event = { type: EVENT_ACTION_STARTED },
  deps = {
    gE,
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
    continueNextRound: () =>
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }),
    runTurn: runBattleTurnAutomation,
  }
) {
  return lifecycleHandlers[event.type]?.(deps) ?? false;
}
