import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_RECOVERY = "recordRecovery";
const BATTLE_KILL_BUG_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_KILL_BUG_RECOVERY;

export const BattleKillBugEvidenceEvent = Object.freeze({
  RECORD_RECOVERY: EVENT_RECORD_RECOVERY,
});

function recordKillBugRecovery(event, deps) {
  const evidence = {
    result: event.result,
    reason: event.reason,
    detail: event.detail,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_KILL_BUG_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle kill bug recovery", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle kill bug recovery", evidence);
  return true;
}

const battleKillBugEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_RECOVERY]: recordKillBugRecovery,
});

export function runBattleKillBugEvidence(
  event = { type: EVENT_RECORD_RECOVERY },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleKillBugEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
