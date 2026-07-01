import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

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
    deps.sessionStorage.setItem(ACTION_LIFECYCLE_EVIDENCE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    return false;
  }
  deps.debug("[HVAA] battle action lifecycle", evidence);
  return true;
}

const battleActionLifecycleEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_LIFECYCLE]: recordActionLifecycle,
});

export function runBattleActionLifecycleEvidence(
  event = { type: EVENT_RECORD_LIFECYCLE },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleActionLifecycleEvidenceEventHandlers[event.type]?.(event, deps) ?? false;
}
