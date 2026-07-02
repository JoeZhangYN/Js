import { setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

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

export function persistIdleArenaProgress(stage, arena) {
  try {
    setValue(STORAGE_KEYS.ARENA, arena);
    return true;
  } catch (error) {
    recordIdleArenaFailure({
      capability: "idleArena",
      source: "idleArena",
      stage,
      failure: { kind: "storageWrite", error: error?.message || String(error) },
    });
    return false;
  }
}
