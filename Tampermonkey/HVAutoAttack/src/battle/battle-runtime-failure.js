import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";

export const BATTLE_RUNTIME_FAILURE_KEY = "HVAA:lastBattleRuntimeFailure";

export function recordBattleRuntimeFailure(stage, error) {
  const evidence = {
    capability: "battleRuntime",
    stage,
    failure: { kind: "storageDelete", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(BATTLE_RUNTIME_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
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
    const result = runBattleSessionCheckpointAutomation({
      type: BattleSessionCheckpointEvent.CLEAR,
    });
    if (result?.outcome === StorageWriteOutcome.FAILED) throw result.error;
    return true;
  } catch (error) {
    recordBattleRuntimeFailure("clear-session", error);
    return false;
  }
}
