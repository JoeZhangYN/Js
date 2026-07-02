import { gE } from "../dom/query.js";
import { post } from "../dom/http.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";
import { recordContinuationSafely } from "./battle-next-round-continuation-recording.js";
import {
  recordCallbackRejection,
  recordPostFailure,
} from "./battle-next-round-continuation-result.js";

const EVENT_CONTINUE = "continue";
const PHASE_NEXT_ROUND_CONTINUATION = "nextRoundContinuation";
const REASON_UNKNOWN_EVENT = "unknownNextRoundContinuationEvent";
const REASON_MISSING_COMPLETION_CONTROL = "missingCompletionControl";
const REASON_COMPLETION_CONTROL_READ_FAILED = "nextRoundCompletionControlReadFailed";
const REASON_CONTINUATION_STEP_THROW = "nextRoundContinuationStepThrew";
const REASON_RESTART_REJECTED = "nextRoundRestartRejected";
const REASON_POST_FAILED = "nextRoundPostFailed";

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

function readCompletionControls(deps) {
  try {
    return {
      pane: deps.gE("#pane_completion"),
      button: deps.gE("#btcp"),
    };
  } catch (error) {
    return { pane: null, button: null, error: error?.message || String(error) };
  }
}

function recordStep(steps, step, run) {
  try {
    const result = run();
    steps.push({ step, result: result === undefined ? true : result });
    return result === undefined ? true : result;
  } catch (error) {
    steps.push({
      step,
      result: false,
      reason: REASON_CONTINUATION_STEP_THROW,
      error: error?.message || String(error),
    });
    return false;
  }
}

function restartBattleRuntime(deps, steps) {
  const runtimeReady = recordStep(steps, "createBattleRuntime", () => {
    deps.unsafeWindow.battle = new deps.unsafeWindow.Battle();
    deps.unsafeWindow.battle.clear_infopane();
  });
  const roundStarted = runtimeReady && Boolean(recordStep(steps, "startRound", deps.startRound));
  const turnStarted = roundStarted && Boolean(recordStep(steps, "runTurn", deps.runTurn));
  steps.push({ step: "restartBattleRuntime", result: turnStarted });
  return turnStarted;
}

function continueNextRound(deps) {
  const steps = [];
  const { pane, button, error } = readCompletionControls(deps);
  if (error) {
    return rejectContinuation(deps, REASON_COMPLETION_CONTROL_READ_FAILED, { error }, steps);
  }
  if (!pane || !button) {
    return rejectContinuation(
      deps,
      REASON_MISSING_COMPLETION_CONTROL,
      { hasPane: Boolean(pane), hasButton: Boolean(button) },
      steps
    );
  }
  if (!recordStep(steps, "removeCompletionButton", () => pane.removeChild(button))) {
    return rejectContinuation(
      deps,
      REASON_CONTINUATION_STEP_THROW,
      { step: "removeCompletionButton" },
      steps
    );
  }
  const postAccepted = recordStep(steps, "post", () =>
    deps.post(
      deps.href(),
      (data) => {
        if (!recordStep(steps, "postCallback", () => true)) return;
        if (recordStep(steps, "handleRiddle", () => deps.handleRiddle(data))) {
          recordContinuationSafely(deps, { outcome: "riddle", continued: false }, steps);
          return;
        }
        if (!recordStep(steps, "replaceBattlePanels", () => replaceBattlePanels(data, deps))) {
          recordCallbackRejection(deps, REASON_CONTINUATION_STEP_THROW, steps);
          return;
        }
        const turnStarted = restartBattleRuntime(deps, steps);
        if (!turnStarted) {
          recordCallbackRejection(deps, REASON_RESTART_REJECTED, steps);
          return;
        }
        recordContinuationSafely(deps, { outcome: "continued", continued: "turn" }, steps);
      },
      undefined,
      undefined,
      (failure) => recordPostFailure(deps, REASON_POST_FAILED, steps, failure)
    )
  );
  if (!postAccepted) {
    return rejectContinuation(deps, REASON_CONTINUATION_STEP_THROW, { step: "post" }, steps);
  }
  return true;
}

function rejectContinuation(deps, reason, detail, steps = []) {
  recordContinuationSafely(deps, { outcome: "rejected", continued: false, reason, detail }, steps);
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
  return (
    battleNextRoundContinuationEventHandlers[event?.type]?.(event, deps) ??
    rejectContinuation(deps, REASON_UNKNOWN_EVENT, { eventType: event?.type ?? null })
  );
}
