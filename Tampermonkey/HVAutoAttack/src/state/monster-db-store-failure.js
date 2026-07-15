import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const MONSTER_DB_STORE_FAILURE_KEY = "HVAA:lastMonsterDbStoreFailure";

function classifyDbError(stage, detail, error) {
  return {
    capability: "monsterDbStore",
    source: "monsterDbStore",
    stage,
    ...detail,
    error: error?.message || error?.name || String(error || "unknown"),
  };
}

export function rejectMonsterDbStoreFailure(stage, detail, error) {
  const failure = classifyDbError(stage, detail, error);
  try {
    sessionStorage.setItem(MONSTER_DB_STORE_FAILURE_KEY, JSON.stringify(failure));
  } catch {
    // IndexedDB failure rejection must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] monster db store failed", failure],
  });
  const rejected = new Error(`monster db store ${stage} failed`);
  rejected.failure = failure;
  return rejected;
}
