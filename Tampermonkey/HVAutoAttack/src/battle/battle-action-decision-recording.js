import {
  BattleActionDecisionEvidenceEvent,
  runBattleActionDecisionEvidence,
} from "./battle-action-decision-evidence.js";

const REASON_ACTION_DECISION_EVIDENCE_WRITE_FAILED = "actionDecisionEvidenceWriteFailed";

export function recordDecisionEvidence(steps) {
  try {
    return runBattleActionDecisionEvidence({
      type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
      steps,
    });
  } catch (error) {
    return recordDecisionEvidenceFailure(steps, error);
  }
}

function recordDecisionEvidenceFailure(steps, error) {
  try {
    return runBattleActionDecisionEvidence({
      type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
      steps: [
        ...steps,
        {
          capability: "actionDecision",
          result: {
            kind: "decision-evidence-event",
            reason: REASON_ACTION_DECISION_EVIDENCE_WRITE_FAILED,
            error: error?.message || String(error),
          },
          acted: false,
        },
      ],
    });
  } catch (_error) {
    return false;
  }
}
