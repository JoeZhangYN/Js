export const IDLE_ARENA_FAILURE_KEY = "HVAA:lastIdleArenaFailure";

export function recordIdleArenaFailure(evidence) {
  try {
    globalThis.sessionStorage?.setItem(IDLE_ARENA_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Idle arena recovery must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA] idle arena request failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
