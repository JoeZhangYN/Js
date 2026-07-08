import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export function recordBattleCommandResult(command, result, reason, detail) {
  try {
    return runBattleCommandEvidence({
      type: BattleCommandEvidenceEvent.RECORD_RESULT,
      command,
      result,
      reason,
      detail,
    });
  } catch (error) {
    warnCommandRecordingFailure({ command, result, reason, detail, error });
    return false;
  }
}

function warnCommandRecordingFailure({ command, result, reason, detail, error }) {
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: [
      "[HVAA] battle command evidence failed",
      {
        command,
        result,
        reason,
        detail,
        recordingError: error?.message || String(error),
      },
    ],
  });
}
