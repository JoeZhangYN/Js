import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";

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
  } catch (_error) {
    // Random fallback must not depend on diagnostic storage.
  }
  try {
    runRiddleLogAutomation({
      type: RiddleLogEvent.PUSH,
      message: `ml answer failed error=${evidence.error} fallback=random`,
    });
  } catch (_error) {
    // Riddle log persistence is diagnostic only.
  }
  try {
    console.warn("[HVAA][RMA] ML answer promise rejected", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
