export const RIDDLE_DATASET_FAILURE_KEY = "HVAA:lastRiddleDatasetFailure";

export function recordRiddleDatasetFailure(stage, detail = {}) {
  const evidence = { capability: "riddleDataset", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_DATASET_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Dataset fallback must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA][RMA] riddle dataset failed", { stage, detail });
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
