import { delValue } from "../state/storage.js";

export const BATTLE_RUNTIME_FAILURE_KEY = "HVAA:lastBattleRuntimeFailure";

export function recordBattleRuntimeFailure(stage, error) {
  const evidence = {
    capability: "battleRuntime",
    stage,
    failure: { kind: "storageDelete", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(BATTLE_RUNTIME_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Runtime clear failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] battle runtime persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function clearPersistedBattleSession() {
  try {
    delValue(2);
    return true;
  } catch (error) {
    recordBattleRuntimeFailure("clear-session", error);
    return false;
  }
}
