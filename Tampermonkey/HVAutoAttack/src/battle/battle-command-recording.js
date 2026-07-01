import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

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
  try {
    console.warn("[HVAA] battle command evidence failed", {
      command,
      result,
      reason,
      detail,
      recordingError: error?.message || String(error),
    });
  } catch (_error) {
    // Command effects must not depend on diagnostic logging.
  }
}
