import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_LIFECYCLE = "recordLifecycle";
const BATTLE_LIFECYCLE_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_LIFECYCLE;

export const BattleLifecycleEvidenceEvent = Object.freeze({
  RECORD_LIFECYCLE: EVENT_RECORD_LIFECYCLE,
});

function recordBattleLifecycle(event, deps) {
  const evidence = {
    phase: event.phase,
    result: event.result,
    steps: event.steps,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_LIFECYCLE_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle lifecycle", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle lifecycle", evidence);
  return true;
}

const battleLifecycleEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_LIFECYCLE]: recordBattleLifecycle,
});

export function runBattleLifecycleEvidence(
  event = { type: EVENT_RECORD_LIFECYCLE },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battleLifecycleEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
