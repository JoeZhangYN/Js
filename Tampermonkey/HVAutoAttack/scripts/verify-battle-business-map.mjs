import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const businessMapFile = path.join(root, "BUSINESS-MAP.md");
const battleAutomationFile = path.join(root, "src/battle/battle-automation.js");
const mainLoopFile = path.join(root, "src/battle/main-loop.js");
const turnPreludeFile = path.join(root, "src/battle/battle-turn-prelude.js");
const actionDecisionFile = path.join(root, "src/battle/battle-action-decision.js");
const actionDecisionEvidenceFile = path.join(root, "src/battle/battle-action-decision-evidence.js");
const actionEffectDispatchFile = path.join(root, "src/battle/battle-action-effect-dispatch.js");
const violations = [];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function requireText(label, text, needle) {
  if (!text.includes(needle)) {
    violations.push(`${label} must mention ${needle}`);
  }
}

function forbidText(label, text, needle, reason) {
  if (text.includes(needle)) {
    violations.push(`${label} must not mention ${needle}: ${reason}`);
  }
}

const businessMap = read(businessMapFile);
const battleAutomation = read(battleAutomationFile);
const mainLoop = read(mainLoopFile);
const turnPrelude = read(turnPreludeFile);
const actionDecision = read(actionDecisionFile);
const actionDecisionEvidence = read(actionDecisionEvidenceFile);
const actionEffectDispatch = read(actionEffectDispatchFile);

for (const stale of ["BATTLE_RULES", "battle/rules/index.js", "`dispatch.js`"]) {
  forbidText(
    "BUSINESS-MAP.md",
    businessMap,
    stale,
    "battle workflow map must describe the current action decision entry"
  );
}

for (const required of [
  "battle-action-effect-dispatch.js",
  "battle-action-decision-evidence.js",
  "runBattleTurnAutomation(RUN_CURRENT_TURN)",
  "runBattleActionDecision(DECIDE)",
  "battle-turn-prelude",
  "survival → buffPreparation → offensiveDebuff → attack",
  "runBattleSurvivalAction(DECIDE)",
  "runBattleBuffPreparation(DECIDE)",
  "runBattleOffensiveDebuff(DECIDE)",
  "runBattleAttackAction(DECIDE)",
  "verify-battle-business-map.mjs",
]) {
  requireText("BUSINESS-MAP.md", businessMap, required);
}

if (
  !/const ACTION_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "survival"[\s\S]*capability: "buffPreparation"[\s\S]*capability: "offensiveDebuff"[\s\S]*capability: "attack"[\s\S]*\]\)/.test(
    actionDecision
  )
) {
  violations.push(
    "src/battle/battle-action-decision.js must keep the frozen documented action capability order"
  );
}

for (const required of [
  "BattleActionDecisionEvent",
  "DECIDE",
  "runBattleSurvivalAction",
  "runBattleBuffPreparation",
  "runBattleOffensiveDebuff",
  "runBattleAttackAction",
  "runBattleActionEffectDispatch",
  "BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT",
  "BattleActionDecisionEvidenceEvent.RECORD_TRACE",
  "runBattleActionDecisionEvidence",
]) {
  requireText("src/battle/battle-action-decision.js", actionDecision, required);
}

for (const required of [
  "BattleActionDecisionEvidenceEvent",
  "runBattleActionDecisionEvidence",
  "DiagnosticEvidenceKey.BATTLE_ACTION_DECISION",
]) {
  requireText("src/battle/battle-action-decision-evidence.js", actionDecisionEvidence, required);
}

for (const forbidden of ["BATTLE_RULES", "runRules", "battle/rules/index.js"]) {
  forbidText(
    "src/battle/battle-action-decision.js",
    actionDecision,
    forbidden,
    "old action rule table path must stay retired"
  );
  forbidText("src/battle/main-loop.js", mainLoop, forbidden, "main loop must stay orchestration-only");
}

for (const required of [
  "BattleTurnWorkflowEvent",
  "RUN_CURRENT_TURN",
  "runBattleTurnPrelude({ type: BattleTurnPreludeEvent.PREPARE_CURRENT_TURN })",
  "runBattleTurnContext",
  "BattleTurnContextEvent.PREPARE",
  "BattleActionDecisionEvent.DECIDE",
  "runBattleActionDecision",
]) {
  requireText("src/battle/main-loop.js", mainLoop, required);
}

for (const required of [
  "MonsterStatusEvent.ENSURE_READY",
  "BattleTurnEvent.TURN_STARTED",
  "BattleMonitorEvent.HUD_REFRESH",
  "BattleKillBugRecoveryEvent.RECOVER",
  "runBattleKillBugRecovery",
  "MonsterStatusEvent.UPDATE_HP",
  "battleLogTelemetry",
]) {
  requireText("src/battle/battle-turn-prelude.js", turnPrelude, required);
}
if (
  !/const TURN_PRELUDE_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "monsterStatusReady"[\s\S]*capability: "turnStarted"[\s\S]*capability: "monitorHudRefresh"[\s\S]*capability: "killBugRecovery"[\s\S]*capability: "monsterHpUpdate"[\s\S]*\]\)/.test(
    turnPrelude
  )
) {
  violations.push("src/battle/battle-turn-prelude.js must keep the frozen documented turn prelude order");
}

for (const required of [
  "PAGE_READY_STARTUP_STEPS",
  "installBattlePauseControls",
  "installBattleActionEventBridge",
  "reportBattleStarted",
  "startBattleRound",
  "runInitialBattleTurn",
  "BattleLifecycleEvent.BATTLE_STARTED",
  'capability: "pauseControls"',
  'capability: "actionEventBridge"',
  'capability: "battleStarted"',
  'capability: "roundStarted"',
  'capability: "initialBattleTurn"',
]) {
  requireText("src/battle/battle-automation.js", battleAutomation, required);
}
if (
  !/const PAGE_READY_STARTUP_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "pauseControls"[\s\S]*capability: "actionEventBridge"[\s\S]*capability: "battleStarted"[\s\S]*capability: "roundStarted"[\s\S]*capability: "initialBattleTurn"[\s\S]*\]\)/.test(
    battleAutomation
  )
) {
  violations.push("src/battle/battle-automation.js must keep the frozen documented page-ready order");
}

if (!/export function runBattleActionEffectDispatch\(/.test(actionEffectDispatch)) {
  violations.push("src/battle/battle-action-effect-dispatch.js must expose effect dispatch entry");
}

if (violations.length) {
  console.error("[verify-battle-business-map] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-battle-business-map] OK — battle business map matches workflow entries");
