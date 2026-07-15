import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_STATE = "recordState";
const BATTLE_PAUSE_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_PAUSE;

export const BattlePauseEvidenceEvent = Object.freeze({
  RECORD_STATE: EVENT_RECORD_STATE,
});

function recordPauseState(event, deps) {
  const evidence = {
    state: event.state,
    reason: event.reason,
    detail: event.detail,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_PAUSE_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle pause", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle pause", evidence);
  return true;
}

const battlePauseEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_STATE]: recordPauseState,
});

export function runBattlePauseEvidence(
  event = { type: EVENT_RECORD_STATE },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battlePauseEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
