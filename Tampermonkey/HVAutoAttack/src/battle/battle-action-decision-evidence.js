import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const EVENT_RECORD_TRACE = "recordTrace";
const ACTION_DECISION_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ACTION_DECISION;

export const BattleActionDecisionEvidenceEvent = Object.freeze({
  RECORD_TRACE: EVENT_RECORD_TRACE,
});

function summarizeResult(result = {}) {
  return {
    kind: result.kind,
    reason: result.reason,
    eventType: result.eventType,
    itemId: result.itemId,
    skillId: result.skillId,
    targetId: result.targetId,
    planKind: result.plan?.type ?? result.plan?.kind,
  };
}

function recordDecisionTrace(event, deps) {
  const evidence = {
    steps: (event.steps || []).map((step) => ({
      capability: step.capability,
      result: summarizeResult(step.result),
      acted: Boolean(step.acted),
    })),
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(ACTION_DECISION_EVIDENCE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    return false;
  }
  deps.debug("[HVAA] battle action decision", evidence);
  return true;
}

const battleActionDecisionEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_TRACE]: recordDecisionTrace,
});

export function runBattleActionDecisionEvidence(
  event = { type: EVENT_RECORD_TRACE },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleActionDecisionEvidenceEventHandlers[event.type]?.(event, deps) ?? false;
}
