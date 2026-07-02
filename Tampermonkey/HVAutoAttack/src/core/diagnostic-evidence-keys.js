export const DiagnosticEvidenceKey = Object.freeze({
  NAVIGATION_AUDIT: "HVAA:lastNavigationAudit",
  NAVIGATION_DECISION: "HVAA:lastNavigationDecision",
  BATTLE_AUTOMATION: "HVAA:lastBattleAutomation",
  BATTLE_LIFECYCLE: "HVAA:lastBattleLifecycle",
  BATTLE_COMPLETION: "HVAA:lastBattleCompletion",
  BATTLE_ROUND_START: "HVAA:lastBattleRoundStart",
  BATTLE_KILL_BUG_RECOVERY: "HVAA:lastBattleKillBugRecovery",
  BATTLE_MONSTER_STATUS_REPAIR: "HVAA:lastBattleMonsterStatusRepair",
  BATTLE_MONSTER_KNOWLEDGE_PERSISTENCE: "HVAA:lastBattleMonsterKnowledgePersistence",
  BATTLE_TURN_WORKFLOW: "HVAA:lastBattleTurnWorkflow",
  BATTLE_API_BRIDGE: "HVAA:lastBattleApiBridge",
  BATTLE_API_RESPONSE_RECOVERY: "HVAA:battleApiRecovery",
  BATTLE_COMMAND: "HVAA:lastBattleCommand",
  BATTLE_PAUSE: "HVAA:lastBattlePause",
  BATTLE_ACTION_DELAY: "HVAA:lastBattleActionDelay",
  BATTLE_ACTION_SPEED: "HVAA:lastBattleActionSpeed",
  BATTLE_ACTION_LIFECYCLE: "HVAA:lastBattleActionLifecycle",
  BATTLE_ACTION_DECISION: "HVAA:lastBattleActionDecision",
  BATTLE_ACTION_EFFECT: "HVAA:lastBattleActionEffect",
  HTTP_REQUEST_FAILURE: "HVAA:lastHttpRequestFailure",
  STAMINA_RECOVERY_FAILURE: "HVAA:lastStaminaRecoveryFailure",
  REPAIR_BACKEND_FAILURE: "HVAA:lastRepairBackendFailure",
});

function source(name, key) {
  return Object.freeze({ name, key });
}

export const DIAGNOSTIC_EVIDENCE_SOURCES = Object.freeze([
  source("navigationDecision", DiagnosticEvidenceKey.NAVIGATION_DECISION),
  source("battleAutomation", DiagnosticEvidenceKey.BATTLE_AUTOMATION),
  source("battleLifecycle", DiagnosticEvidenceKey.BATTLE_LIFECYCLE),
  source("battleCompletion", DiagnosticEvidenceKey.BATTLE_COMPLETION),
  source("battleRoundStart", DiagnosticEvidenceKey.BATTLE_ROUND_START),
  source("battleKillBugRecovery", DiagnosticEvidenceKey.BATTLE_KILL_BUG_RECOVERY),
  source("battleMonsterStatusRepair", DiagnosticEvidenceKey.BATTLE_MONSTER_STATUS_REPAIR),
  source(
    "battleMonsterKnowledgePersistence",
    DiagnosticEvidenceKey.BATTLE_MONSTER_KNOWLEDGE_PERSISTENCE
  ),
  source("battleTurnWorkflow", DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW),
  source("battleApiBridge", DiagnosticEvidenceKey.BATTLE_API_BRIDGE),
  source("battleApiResponseRecovery", DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY),
  source("battleCommand", DiagnosticEvidenceKey.BATTLE_COMMAND),
  source("battlePause", DiagnosticEvidenceKey.BATTLE_PAUSE),
  source("battleActionDelay", DiagnosticEvidenceKey.BATTLE_ACTION_DELAY),
  source("battleActionSpeed", DiagnosticEvidenceKey.BATTLE_ACTION_SPEED),
  source("battleActionLifecycle", DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE),
  source("battleActionDecision", DiagnosticEvidenceKey.BATTLE_ACTION_DECISION),
  source("battleActionEffect", DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT),
  source("httpRequestFailure", DiagnosticEvidenceKey.HTTP_REQUEST_FAILURE),
  source("staminaRecoveryFailure", DiagnosticEvidenceKey.STAMINA_RECOVERY_FAILURE),
  source("repairBackendFailure", DiagnosticEvidenceKey.REPAIR_BACKEND_FAILURE),
]);

export const API_RESPONSE_SCRIPT_DIAGNOSTIC_EVIDENCE_SOURCES = Object.freeze(
  DIAGNOSTIC_EVIDENCE_SOURCES.filter(
    (item) => item.key !== DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY
  )
);
