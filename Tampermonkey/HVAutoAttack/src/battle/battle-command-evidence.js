import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const EVENT_RECORD_RESULT = "recordResult";
const BATTLE_COMMAND_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_COMMAND;

export const BattleCommandEvidenceEvent = Object.freeze({
  RECORD_RESULT: EVENT_RECORD_RESULT,
});

function recordCommandResult(event, deps) {
  const evidence = {
    command: event.command,
    result: event.result,
    reason: event.reason,
    detail: event.detail,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(BATTLE_COMMAND_EVIDENCE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    return false;
  }
  deps.debug("[HVAA] battle command", evidence);
  return true;
}

const battleCommandEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_RESULT]: recordCommandResult,
});

export function runBattleCommandEvidence(
  event = { type: EVENT_RECORD_RESULT },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleCommandEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
