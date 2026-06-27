import { gE } from "../dom/query.js";
import { post } from "../dom/http.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import {
  BattleCompletionEvent,
  BattleCompletionOutcome,
  runBattleCompletionAutomation,
} from "./battle-completion.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";

const EVENT_ACTION_ENDED = "actionEnded";

export const BattleActionEndEvent = Object.freeze({
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

function replaceBattlePanels(data, deps) {
  deps.gE("#battle_main").replaceChild(deps.gE("#battle_right", data), deps.gE("#battle_right"));
  deps.gE("#battle_main").replaceChild(deps.gE("#battle_left", data), deps.gE("#battle_left"));
}

function restartBattleRuntime(deps) {
  deps.unsafeWindow.battle = new deps.unsafeWindow.Battle();
  deps.unsafeWindow.battle.clear_infopane();
  deps.startRound();
  deps.runTurn();
}

function continueNextRound(deps) {
  deps.gE("#pane_completion").removeChild(deps.gE("#btcp"));
  deps.post(deps.href(), (data) => {
    if (deps.handleRiddle(data)) return;
    replaceBattlePanels(data, deps);
    restartBattleRuntime(deps);
  });
}

function handleCompletion(deps) {
  deps.monitorCompletion();
  const completion = deps.completeBattle();
  if (completion.outcome === BattleCompletionOutcome.NEXT_ROUND) {
    continueNextRound(deps);
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

export function runBattleActionEndAutomation(
  event = { type: EVENT_ACTION_ENDED },
  deps = {
    gE,
    post,
    href: () => window.location.href,
    unsafeWindow,
    recordSpeed: () =>
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED }),
    endDelay: () => runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }),
    refreshCombatants: () =>
      runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS }),
    monitorActionEnded: () => runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_ENDED }),
    monitorCompletion: () =>
      runBattleMonitorAutomation({ type: BattleMonitorEvent.COMPLETION_REACHED }),
    completeBattle: () =>
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }),
    handleRiddle: (data) =>
      runRiddleAutomation({
        type: RiddleEvent.BATTLE_POST_RESULT,
        data,
      }),
    startRound: () => runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED }),
    runTurn: runBattleTurnAutomation,
  }
) {
  if (event.type === EVENT_ACTION_ENDED) return runActionEnded(deps);
  return undefined;
}
