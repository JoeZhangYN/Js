import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const EVENT_RECORD_STAGE = "recordStage";
const BATTLE_TURN_WORKFLOW_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW;

export const BattleTurnWorkflowEvidenceEvent = Object.freeze({
  RECORD_STAGE: EVENT_RECORD_STAGE,
});

function recordTurnWorkflowStage(event, deps) {
  const evidence = {
    stage: event.stage,
    detail: event.detail,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(BATTLE_TURN_WORKFLOW_EVIDENCE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    return false;
  }
  deps.debug("[HVAA] battle turn workflow", evidence);
  return true;
}

const battleTurnWorkflowEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_STAGE]: recordTurnWorkflowStage,
});

export function runBattleTurnWorkflowEvidence(
  event = { type: EVENT_RECORD_STAGE },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleTurnWorkflowEvidenceEventHandlers[event.type]?.(event, deps) ?? false;
}
