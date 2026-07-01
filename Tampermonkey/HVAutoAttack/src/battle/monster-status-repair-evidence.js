import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const EVENT_RECORD_REPAIR = "recordRepair";
const MONSTER_STATUS_REPAIR_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_MONSTER_STATUS_REPAIR;

export const MonsterStatusRepairEvidenceEvent = Object.freeze({
  RECORD_REPAIR: EVENT_RECORD_REPAIR,
});

function recordRepair(event, deps) {
  const evidence = {
    result: event.result,
    reason: event.reason,
    detail: event.detail,
    at: new Date().toISOString(),
  };
  try {
    deps.sessionStorage.setItem(
      MONSTER_STATUS_REPAIR_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    deps.debug("[HVAA] monster status repair", evidence);
    return false;
  }
  deps.debug("[HVAA] monster status repair", evidence);
  return true;
}

const monsterStatusRepairEvidenceEventHandlers = Object.freeze({
  [EVENT_RECORD_REPAIR]: recordRepair,
});

export function runMonsterStatusRepairEvidence(
  event = { type: EVENT_RECORD_REPAIR },
  deps = { sessionStorage: window.sessionStorage, debug: (...args) => console.debug(...args) }
) {
  return monsterStatusRepairEvidenceEventHandlers[event?.type]?.(event, deps) ?? false;
}
