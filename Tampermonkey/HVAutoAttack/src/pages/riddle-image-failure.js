export const RIDDLE_IMAGE_FAILURE_KEY = "HVAA:lastRiddleImageFailure";

export function recordRiddleImageFailure(stage, detail = {}) {
  const evidence = { capability: "riddleImage", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_IMAGE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Riddle image fallback must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA][RMA] riddle image failed", { stage, detail });
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
