import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

const REASON_ACTION_EFFECT_EVIDENCE_WRITE_FAILED = "actionEffectEvidenceWriteFailed";

export function recordActionEffectEvidence(event) {
  try {
    return runBattleActionEffectEvidence({
      type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
      ...event,
    });
  } catch (error) {
    return recordActionEffectEvidenceFailure(event, error);
  }
}

function recordActionEffectEvidenceFailure(event, error) {
  try {
    return runBattleActionEffectEvidence({
      type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
      result: {
        kind: "effect-evidence-event",
        reason: REASON_ACTION_EFFECT_EVIDENCE_WRITE_FAILED,
        originalResultKind: event?.result?.kind ?? null,
        error: error?.message || String(error),
      },
      acted: false,
      knownResultKind: false,
      failureReason: REASON_ACTION_EFFECT_EVIDENCE_WRITE_FAILED,
    });
  } catch (_error) {
    return false;
  }
}
