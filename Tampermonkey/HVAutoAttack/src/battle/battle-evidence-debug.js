import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export function runBattleEvidenceDebug(args) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.DEBUG,
    args,
  });
}

export function safeDebug(deps, label, evidence) {
  try {
    if (deps.debug) {
      deps.debug(label, evidence);
      return true;
    }
    return runBattleEvidenceDebug([label, evidence]);
  } catch (_error) {
    return false;
  }
}
