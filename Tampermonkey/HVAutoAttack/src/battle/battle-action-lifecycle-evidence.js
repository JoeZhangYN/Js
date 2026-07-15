import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_LIFECYCLE = "recordLifecycle";
const ACTION_LIFECYCLE_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE;

export const BattleActionLifecycleEvidenceEvent = Object.freeze({
  RECORD_LIFECYCLE: EVENT_RECORD_LIFECYCLE,
});

function recordActionLifecycle(event, deps) {
  const evidence = {
    phase: event.phase,
    result: event.result,
    steps: event.steps,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      ACTION_LIFECYCLE_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle action lifecycle", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle action lifecycle", evidence);
  return true;
}

const battleActionLifecycleEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_LIFECYCLE]: recordActionLifecycle,
});

export function runBattleActionLifecycleEvidence(
  event = { type: EVENT_RECORD_LIFECYCLE },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battleActionLifecycleEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
