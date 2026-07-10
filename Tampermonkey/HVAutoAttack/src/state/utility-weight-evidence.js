import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export const UTILITY_WEIGHT_FAILURE_KEY = DiagnosticEvidenceKey.UTILITY_WEIGHT_LEARNING_FAILURE;
export const UTILITY_WEIGHT_DECISION_KEY = DiagnosticEvidenceKey.UTILITY_WEIGHT_LEARNING_DECISION;

function persistSessionEvidence(key, evidence) {
  try {
    globalThis.sessionStorage?.setItem(key, JSON.stringify(evidence));
  } catch {
    // Learning must not affect battle execution when diagnostic storage is unavailable.
  }
}

export function recordUtilityWeightFailure(stage, detail) {
  const evidence = { capability: "utilityWeightLearning", stage, ...detail };
  persistSessionEvidence(UTILITY_WEIGHT_FAILURE_KEY, evidence);
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] utility weight learning failed", evidence],
  });
  return evidence;
}

export function recordUtilityWeightDecision(detail) {
  const evidence = { capability: "utilityWeightLearning", ...detail };
  persistSessionEvidence(UTILITY_WEIGHT_DECISION_KEY, evidence);
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.INFO,
    args: ["[HVAA] utility weight learning decision", evidence],
  });
  return evidence;
}
