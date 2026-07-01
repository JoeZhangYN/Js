import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { safeDebug } from "./battle-evidence-debug.js";

const EVENT_RECORD_STARTUP = "recordStartup";
const BATTLE_AUTOMATION_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_AUTOMATION;

export const BattleAutomationEvidenceEvent = Object.freeze({
  RECORD_STARTUP: EVENT_RECORD_STARTUP,
});

function recordBattleAutomation(event, deps) {
  const evidence = {
    phase: event.phase,
    result: event.result,
    steps: event.steps,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      BATTLE_AUTOMATION_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    safeDebug(deps, "[HVAA] battle automation", evidence);
    return false;
  }
  safeDebug(deps, "[HVAA] battle automation", evidence);
  return true;
}

const battleAutomationEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_STARTUP]: recordBattleAutomation,
});

export function runBattleAutomationEvidence(
  event = { type: EVENT_RECORD_STARTUP },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return battleAutomationEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
