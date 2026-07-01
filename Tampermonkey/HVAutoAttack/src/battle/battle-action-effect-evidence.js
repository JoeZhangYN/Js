import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const EVENT_RECORD_APPLIED = "recordApplied";
const ACTION_EFFECT_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT;

export const BattleActionEffectEvidenceEvent = Object.freeze({
  RECORD_APPLIED: EVENT_RECORD_APPLIED,
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

function recordAppliedActionEffect(event, deps) {
  const evidence = {
    result: summarizeResult(event.result),
    acted: Boolean(event.acted),
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(ACTION_EFFECT_EVIDENCE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    return false;
  }
  deps.debug("[HVAA] battle action effect", evidence);
  return true;
}

const battleActionEffectEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_APPLIED]: recordAppliedActionEffect,
});

export function runBattleActionEffectEvidence(
  event = { type: EVENT_RECORD_APPLIED },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleActionEffectEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
