import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { diagnosticEvidenceMemoryStorage } from "../core/diagnostic-evidence-journal.js";
import { safeDebug } from "./battle-evidence-debug.js";

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
    capability: result.capability,
    error: result.error,
    planKind: result.plan?.type ?? result.plan?.kind,
  };
}

function classifyDecisionStepFailure(step) {
  if (step.acted) return null;
  if (step.effectEvidence?.failureReason) return step.effectEvidence.failureReason;
  const result = step.result || {};
  if (!result.kind) return "missingActionResult";
  if (result.kind === "noop") return result.reason || "noActionCandidate";
  return result.reason || "actionExecutorRejected";
}

function summarizeEffectEvidence(effectEvidence) {
  if (!effectEvidence) return undefined;
  return {
    result: effectEvidence.result,
    acted: Boolean(effectEvidence.acted),
    knownResultKind: effectEvidence.knownResultKind,
    failureReason: effectEvidence.failureReason,
    command: effectEvidence.command,
  };
}

function recordDecisionTrace(event, deps) {
  const evidence = {
    steps: (event.steps || []).map((step) => ({
      capability: step.capability,
      result: summarizeResult(step.result),
      acted: Boolean(step.acted),
      failureReason: classifyDecisionStepFailure(step),
      effectEvidenceReadError: step.effectEvidenceReadError,
      effect: summarizeEffectEvidence(step.effectEvidence),
    })),
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      ACTION_DECISION_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle action decision", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle action decision", evidence);
  return true;
}

const battleActionDecisionEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_TRACE]: recordDecisionTrace,
});

export function runBattleActionDecisionEvidence(
  event = { type: EVENT_RECORD_TRACE },
  deps = { sessionStorage: diagnosticEvidenceMemoryStorage }
) {
  return battleActionDecisionEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
