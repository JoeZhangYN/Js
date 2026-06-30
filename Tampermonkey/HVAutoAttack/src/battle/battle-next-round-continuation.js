import { gE } from "../dom/query.js";
import { post } from "../dom/http.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";

const EVENT_CONTINUE = "continue";

export const BattleNextRoundContinuationEvent = Object.freeze({
  CONTINUE: EVENT_CONTINUE,
});

const battleNextRoundContinuationEventHandlers = Object.freeze({
  [EVENT_CONTINUE]: (event, deps) => continueNextRound(deps),
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
  return true;
}

export function runBattleNextRoundContinuation(
  event = { type: EVENT_CONTINUE },
  deps = {
    gE,
    post,
    href: () => window.location.href,
    unsafeWindow,
    handleRiddle: (data) => runRiddleAutomation({ type: RiddleEvent.BATTLE_POST_RESULT, data }),
    startRound: () => runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED }),
    runTurn: runBattleTurnAutomation,
  }
) {
  return battleNextRoundContinuationEventHandlers[event.type]?.(event, deps) ?? false;
}
