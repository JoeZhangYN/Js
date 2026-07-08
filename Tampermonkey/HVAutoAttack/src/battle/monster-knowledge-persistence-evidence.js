import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

const EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_MONSTER_KNOWLEDGE_PERSISTENCE;

function errorText(error) {
  return error?.message || error?.name || String(error || "unknown");
}

function makeDeps(deps) {
  return {
    sessionStorage: deps.sessionStorage || globalThis.sessionStorage,
    warn:
      deps.warn ||
      ((...args) =>
        runDiagnosticConsoleAutomation({
          type: DiagnosticConsoleEvent.WARN,
          args,
        })),
  };
}

export function recordMonsterKnowledgePersistenceFailure(failure, deps = {}) {
  const resolved = makeDeps(deps);
  const evidence = {
    source: "monsterKnowledgePersistence",
    result: "failed",
    ...failure,
  };
  if (failure.error) evidence.error = errorText(failure.error);
  if (failure.error?.failure) evidence.cause = failure.error.failure;
  try {
    resolved.sessionStorage?.setItem(EVIDENCE_KEY, JSON.stringify(evidence));
  } catch (error) {
    try {
      resolved.warn("[HVAA] monster knowledge persistence evidence failed", {
        evidence,
        error: errorText(error),
      });
    } catch (_warnError) {
      // Evidence recording must not break the battle learning flow.
    }
  }
  return evidence;
}
