import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { delValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

export const IDLE_ARENA_FAILURE_KEY = "HVAA:lastIdleArenaFailure";

export function recordIdleArenaFailure(evidence) {
  try {
    globalThis.sessionStorage?.setItem(IDLE_ARENA_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Idle arena recovery must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] idle arena request failed", evidence],
  });
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

export function recordIdleArenaRequestFailure(stage, arena, failure) {
  const evidence = { capability: "idleArena", source: "idleArena", stage, failure };
  recordIdleArenaFailure(evidence);
  persistIdleArenaProgress("request-failure", { ...arena, requestFailure: evidence });
}

export function clearPersistedIdleArenaProgress() {
  try {
    delValue(STORAGE_KEYS.ARENA);
    return true;
  } catch (error) {
    recordIdleArenaFailure({
      capability: "idleArena",
      source: "idleArena",
      stage: "reset-progress",
      failure: { kind: "storageDelete", error: error?.message || String(error) },
    });
    return false;
  }
}
