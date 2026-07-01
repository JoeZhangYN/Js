import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch (_error) {
    return undefined;
  }
}

export function readRecentDiagnosticEvidence(storage = window.sessionStorage) {
  const evidence = {};
  const navigationDecision = readJson(storage, DiagnosticEvidenceKey.NAVIGATION_DECISION);
  if (navigationDecision) evidence.navigationDecision = navigationDecision;
  const battleTurnWorkflow = readJson(storage, DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW);
  if (battleTurnWorkflow) evidence.battleTurnWorkflow = battleTurnWorkflow;
  const battlePause = readJson(storage, DiagnosticEvidenceKey.BATTLE_PAUSE);
  if (battlePause) evidence.battlePause = battlePause;
  const battleActionLifecycle = readJson(storage, DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE);
  if (battleActionLifecycle) evidence.battleActionLifecycle = battleActionLifecycle;
  const battleActionDecision = readJson(storage, DiagnosticEvidenceKey.BATTLE_ACTION_DECISION);
  if (battleActionDecision) evidence.battleActionDecision = battleActionDecision;
  const battleActionEffect = readJson(storage, DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT);
  if (battleActionEffect) evidence.battleActionEffect = battleActionEffect;
  return Object.keys(evidence).length ? evidence : undefined;
}
