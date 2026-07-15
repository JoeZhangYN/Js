import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { writeDiagnosticSessionSnapshot } from "../core/diagnostic-evidence-journal.js";

export function recordStorageMaintenanceFailure(stage, error, detail = {}) {
  const evidence = {
    capability: "storageMaintenance",
    stage,
    error: error?.message || String(error),
    recovery: error?.recovery || "retryFromNonBattlePage",
    ...detail,
  };
  writeDiagnosticSessionSnapshot(DiagnosticEvidenceKey.STORAGE_MAINTENANCE_FAILURE, evidence);
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] storage maintenance failed", evidence],
  });
  return evidence;
}
