import { gE } from "../dom/query.js";
import { post } from "../dom/http.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";

const EVENT_CONTINUE = "continue";
const PHASE_NEXT_ROUND_CONTINUATION = "nextRoundContinuation";
const REASON_UNKNOWN_EVENT = "unknownNextRoundContinuationEvent";
const REASON_MISSING_COMPLETION_CONTROL = "missingCompletionControl";

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
  const steps = [];
  const pane = deps.gE("#pane_completion");
  const button = deps.gE("#btcp");
  if (!pane || !button) {
    return rejectContinuation(deps, REASON_MISSING_COMPLETION_CONTROL, { hasPane: Boolean(pane), hasButton: Boolean(button) }, steps);
  }
  pane.removeChild(button);
  steps.push({ step: "removeCompletionButton", result: true });
  deps.post(deps.href(), (data) => {
    steps.push({ step: "postCallback", result: true });
    if (deps.handleRiddle(data)) {
      steps.push({ step: "handleRiddle", result: true });
      deps.recordContinuation({ outcome: "riddle", continued: false }, steps);
      return;
    }
    steps.push({ step: "handleRiddle", result: false });
    replaceBattlePanels(data, deps);
    steps.push({ step: "replaceBattlePanels", result: true });
    restartBattleRuntime(deps);
    steps.push({ step: "restartBattleRuntime", result: true });
    deps.recordContinuation({ outcome: "continued", continued: "turn" }, steps);
  });
  steps.push({ step: "post", result: true });
  return true;
}

function rejectContinuation(deps, reason, detail, steps = []) {
  deps.recordContinuation({ outcome: "rejected", continued: false, reason, detail }, steps);
  return false;
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
    runTurn: () => runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN }),
    recordContinuation: (result, steps) =>
      runBattleActionLifecycleEvidence({
        type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
        phase: PHASE_NEXT_ROUND_CONTINUATION,
        result,
        steps,
      }),
  }
) {
  return battleNextRoundContinuationEventHandlers[event?.type]?.(event, deps) ?? rejectContinuation(deps, REASON_UNKNOWN_EVENT, { eventType: event?.type ?? null });
}
