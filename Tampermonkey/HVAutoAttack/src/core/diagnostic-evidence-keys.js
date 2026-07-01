export const DiagnosticEvidenceKey = Object.freeze({
  NAVIGATION_AUDIT: "HVAA:lastNavigationAudit",
  NAVIGATION_DECISION: "HVAA:lastNavigationDecision",
  BATTLE_AUTOMATION: "HVAA:lastBattleAutomation",
  BATTLE_LIFECYCLE: "HVAA:lastBattleLifecycle",
  BATTLE_TURN_WORKFLOW: "HVAA:lastBattleTurnWorkflow",
  BATTLE_API_RESPONSE_RECOVERY: "HVAA:battleApiRecovery",
  BATTLE_COMMAND: "HVAA:lastBattleCommand",
  BATTLE_PAUSE: "HVAA:lastBattlePause",
  BATTLE_ACTION_DELAY: "HVAA:lastBattleActionDelay",
  BATTLE_ACTION_LIFECYCLE: "HVAA:lastBattleActionLifecycle",
  BATTLE_ACTION_DECISION: "HVAA:lastBattleActionDecision",
  BATTLE_ACTION_EFFECT: "HVAA:lastBattleActionEffect",
});

function source(name, key) {
  return Object.freeze({ name, key });
}

export const DIAGNOSTIC_EVIDENCE_SOURCES = Object.freeze([
  source("navigationDecision", DiagnosticEvidenceKey.NAVIGATION_DECISION),
  source("battleAutomation", DiagnosticEvidenceKey.BATTLE_AUTOMATION),
  source("battleLifecycle", DiagnosticEvidenceKey.BATTLE_LIFECYCLE),
  source("battleTurnWorkflow", DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW),
  source("battleApiResponseRecovery", DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY),
  source("battleCommand", DiagnosticEvidenceKey.BATTLE_COMMAND),
  source("battlePause", DiagnosticEvidenceKey.BATTLE_PAUSE),
  source("battleActionDelay", DiagnosticEvidenceKey.BATTLE_ACTION_DELAY),
  source("battleActionLifecycle", DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE),
  source("battleActionDecision", DiagnosticEvidenceKey.BATTLE_ACTION_DECISION),
  source("battleActionEffect", DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT),
]);

export const API_RESPONSE_SCRIPT_DIAGNOSTIC_EVIDENCE_SOURCES = Object.freeze(
  DIAGNOSTIC_EVIDENCE_SOURCES.filter(
    (item) => item.key !== DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY
  )
);
