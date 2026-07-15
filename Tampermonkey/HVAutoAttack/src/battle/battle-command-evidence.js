import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_RESULT = "recordResult";
const BATTLE_COMMAND_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_COMMAND;
const RESULT_ACCEPTED = "accepted";

export const BattleCommandEvidenceEvent = Object.freeze({
  RECORD_RESULT: EVENT_RECORD_RESULT,
});

function commandActed(result) {
  return result === RESULT_ACCEPTED;
}

function commandFailureReason(event) {
  return commandActed(event.result) ? null : event.reason || "commandRejected";
}

function recordCommandResult(event, deps) {
  const evidence = {
    command: event.command,
    result: event.result,
    acted: commandActed(event.result),
    reason: event.reason,
    failureReason: commandFailureReason(event),
    detail: event.detail,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_COMMAND_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle command", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle command", evidence);
  return true;
}

const battleCommandEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_RESULT]: recordCommandResult,
});

export function readBattleCommandEvidence(storage = diagnosticEvidenceMemoryStorage) {
  try {
    return JSON.parse(storage.getItem(BATTLE_COMMAND_EVIDENCE_KEY) || "null");
  } catch (_error) {
    return null;
  }
}

export function runBattleCommandEvidence(
  event = { type: EVENT_RECORD_RESULT },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battleCommandEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
