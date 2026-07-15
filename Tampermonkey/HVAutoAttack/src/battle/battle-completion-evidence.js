import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_COMPLETION = "recordCompletion";
const BATTLE_COMPLETION_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_COMPLETION;

export const BattleCompletionEvidenceEvent = Object.freeze({
  RECORD_COMPLETION: EVENT_RECORD_COMPLETION,
});

function recordCompletion(event, deps) {
  const evidence = {
    outcome: event.outcome,
    context: event.context,
    effects: event.effects,
    reason: event.reason,
    eventType: event.eventType,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_COMPLETION_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle completion", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle completion", evidence);
  return true;
}

const battleCompletionEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_COMPLETION]: recordCompletion,
});

export function runBattleCompletionEvidence(
  event = { type: EVENT_RECORD_COMPLETION },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battleCompletionEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
