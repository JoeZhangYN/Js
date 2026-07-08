import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_APPLIED = "recordApplied";
const ACTION_EFFECT_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT;
const KNOWN_PLAN_TYPES = Object.freeze({
  "attack-plan": new Set([
    "noop",
    "focus",
    "toggle-spirit",
    "spell",
    "merciful-single",
    "physical",
    "default",
  ]),
  "item-plan": new Set(["noop", "gem", "potion", "stall", "scroll"]),
  "channel-plan": new Set(["noop", "click"]),
});
const UNKNOWN_PLAN_FAILURE_REASONS = Object.freeze({
  "attack-plan": "unknownAttackPlanType",
  "item-plan": "unknownItemPlanType",
  "channel-plan": "unknownChannelPlanType",
});

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
    originalResultKind: result.originalResultKind,
    error: result.error,
  };
}

function recordAppliedActionEffect(event, deps) {
  const evidence = {
    result: summarizeResult(event.result),
    acted: Boolean(event.acted),
    knownResultKind: typeof event.knownResultKind === "boolean" ? event.knownResultKind : null,
    failureReason: classifyActionEffectFailure(event),
    executionError: event.executionError,
    commandEvidenceReadError: event.commandEvidenceReadError,
    command: summarizeCommandEvidence(event.commandEvidence),
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      ACTION_EFFECT_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle action effect", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle action effect", evidence);
  return true;
}

function summarizeCommandEvidence(commandEvidence) {
  if (!commandEvidence) return undefined;
  return {
    command: commandEvidence.command,
    result: commandEvidence.result,
    acted: Boolean(commandEvidence.acted),
    reason: commandEvidence.reason,
    failureReason: commandEvidence.failureReason,
    detail: commandEvidence.detail,
  };
}

function classifyActionEffectFailure(event) {
  if (event.failureReason) return event.failureReason;
  if (event.acted) return null;
  if (event.commandEvidence?.failureReason) return event.commandEvidence.failureReason;
  if (!event.result?.kind) return "missingActionResult";
  if (event.knownResultKind === false) return event.result.reason || "unknownActionResultKind";
  const planFailure = classifyPlanFailure(event.result);
  if (planFailure) return planFailure;
  return event.result.reason || "actionExecutorRejected";
}

function classifyPlanFailure(result) {
  const knownTypes = KNOWN_PLAN_TYPES[result.kind];
  if (!knownTypes) return null;
  const planType = result.plan?.type ?? result.plan?.kind;
  if (planType === "noop") return result.reason || "noActionCandidate";
  if (!knownTypes.has(planType)) return UNKNOWN_PLAN_FAILURE_REASONS[result.kind];
  return null;
}

const battleActionEffectEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_APPLIED]: recordAppliedActionEffect,
});

export function readBattleActionEffectEvidence(storage = window.sessionStorage) {
  try {
    return JSON.parse(storage.getItem(ACTION_EFFECT_EVIDENCE_KEY) || "null");
  } catch (_error) {
    return null;
  }
}

export function runBattleActionEffectEvidence(
  event = { type: EVENT_RECORD_APPLIED },
  deps = { sessionStorage: window.sessionStorage }
) {
  return battleActionEffectEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
