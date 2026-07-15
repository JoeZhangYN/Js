import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const LEARNED_MONSTER_STORE_FAILURE_KEY = "HVAA:lastLearnedMonsterStoreFailure";

export function recordLearnedMonsterStoreFailure(stage, family, error) {
  const evidence = {
    capability: "learnedMonsterStore",
    stage,
    family,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(LEARNED_MONSTER_STORE_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Failure evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] learned monster store failed", evidence],
  });
  return evidence;
}
