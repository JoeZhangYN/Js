import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RIDDLE_ML_ANSWER_FAILURE_KEY = "HVAA:lastRiddleMlAnswerFailure";

function errorText(error) {
  return error?.message || error?.name || String(error || "unknown");
}

export function recordRiddleMlAnswerFailure(error) {
  const evidence = {
    capability: "riddleMlAnswer",
    stage: "answerFlow",
    reason: "promiseRejected",
    fallback: "random",
    error: errorText(error),
  };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_ML_ANSWER_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Random fallback must not depend on diagnostic storage.
  }
  try {
    runRiddleLogAutomation({
      type: RiddleLogEvent.PUSH,
      message: `ml answer failed error=${evidence.error} fallback=random`,
    });
  } catch {
    // Riddle log persistence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA][RMA] ML answer promise rejected", evidence],
  });
  return evidence;
}
