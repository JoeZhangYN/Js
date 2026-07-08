import { delValue } from "../state/storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

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
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] battle runtime persistence failed", evidence],
  });
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
