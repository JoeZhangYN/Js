export const RIDDLE_SUBMIT_FAILURE_KEY = "HVAA:lastRiddleSubmitFailure";

export function recordRiddleSubmitFailure(stage, detail = {}) {
  const evidence = { capability: "riddleSubmit", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_SUBMIT_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Riddle submit fallback must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA][riddle] submit failed", { stage, detail });
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
