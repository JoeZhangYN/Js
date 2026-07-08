import { DiagnosticConsoleEvent, runDiagnosticConsoleAutomation } from "./diagnostic-console.js";
import { writeNavigationAudit } from "./navigation-audit.js";
import { recordNavigationDecision } from "./navigation-decision-evidence.js";

function warnRecordingFailure(label, evidence) {
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: [`[HVAA] ${label}`, evidence],
  });
}

export function recordNavigationDecisionSafely(decision, event, detail) {
  try {
    return recordNavigationDecision(decision, event, detail);
  } catch (error) {
    warnRecordingFailure("navigation decision failed", {
      decision,
      eventType: event?.type ?? null,
      commandReason: event?.reason ?? null,
      detail,
      recordingError: error?.message || String(error),
    });
    return false;
  }
}

export function writeNavigationAuditSafely(kind, payload) {
  try {
    writeNavigationAudit(kind, payload);
    return true;
  } catch (error) {
    warnRecordingFailure("navigation audit failed", {
      kind,
      ...payload,
      recordingError: error?.message || String(error),
    });
    return false;
  }
}
