import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_ROUND_START = "recordRoundStart";
const BATTLE_ROUND_START_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ROUND_START;

export const BattleRoundStartEvidenceEvent = Object.freeze({
  RECORD_ROUND_START: EVENT_RECORD_ROUND_START,
});

function recordRoundStart(event, deps) {
  const evidence = {
    phase: event.phase,
    result: event.result,
    steps: event.steps,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_ROUND_START_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle round start", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle round start", evidence);
  return true;
}

const battleRoundStartEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_ROUND_START]: recordRoundStart,
});

export function runBattleRoundStartEvidence(
  event = { type: EVENT_RECORD_ROUND_START },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battleRoundStartEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
