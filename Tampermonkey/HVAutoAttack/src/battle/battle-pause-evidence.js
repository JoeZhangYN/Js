import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

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
    deps.debug("[HVAA] battle pause", evidence);
    return false;
  }
  deps.debug("[HVAA] battle pause", evidence);
  return true;
}

const battlePauseEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_STATE]: recordPauseState,
});

export function runBattlePauseEvidence(
  event = { type: EVENT_RECORD_STATE },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battlePauseEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
