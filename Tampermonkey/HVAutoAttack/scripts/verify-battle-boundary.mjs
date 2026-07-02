import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const battleFile = path.join(root, "src/battle/battle-automation.js");
const battleLifecycleFile = path.join(root, "src/battle/battle-lifecycle.js");
const battleLifecycleTest = path.join(root, "src/battle/battle-lifecycle.test.js");
const actionEventBridgeFile = path.join(root, "src/battle/battle-action-event-bridge.js");
const legacyReloaderFile = path.join(root, "src/battle/reloader.js");
const actionDelayFile = path.join(root, "src/battle/battle-action-delay.js");
const actionDelayTest = path.join(root, "src/battle/battle-action-delay.test.js");
const apiBridgeFile = path.join(root, "src/battle/battle-api-bridge.js");
const apiBridgeTest = path.join(root, "src/battle/battle-api-bridge.test.js");
const actionSpeedFile = path.join(root, "src/battle/battle-action-speed.js");
const actionSpeedTest = path.join(root, "src/battle/battle-action-speed.test.js");
const actionLifecycleFile = path.join(root, "src/battle/battle-action-lifecycle.js");
const actionLifecycleTest = path.join(root, "src/battle/battle-action-lifecycle.test.js");
const actionLifecycleRecordingFile = path.join(root, "src/battle/battle-action-lifecycle-recording.js");
const actionLifecycleEvidenceFile = path.join(
  root,
  "src/battle/battle-action-lifecycle-evidence.js"
);
const actionLifecycleEvidenceTestFile = path.join(
  root,
  "src/battle/battle-action-lifecycle-evidence.test.js"
);
const legacyActionEndFile = path.join(root, "src/battle/battle-action-end.js");
const legacyActionStartFile = path.join(root, "src/battle/battle-action-start.js");
const pauseControlsFile = path.join(root, "src/battle/battle-pause-controls.js");
const pauseControlsTest = path.join(root, "src/battle/battle-pause-controls.test.js");
const nextRoundContinuationFile = path.join(root, "src/battle/battle-next-round-continuation.js");
const startRuntimeFile = path.join(root, "src/battle/battle-start-runtime.js");
const startRuntimeTest = path.join(root, "src/battle/battle-start-runtime.test.js");
const debuffCoverageFile = path.join(root, "src/battle/battle-debuff-coverage.js");
const utilityEngineFile = path.join(root, "src/battle/utility-engine.js");
const physicalSkillRankingFile = path.join(root, "src/battle/attack/physical-skill-ranking.js");
const physicalSkillRankingTest = path.join(
  root,
  "src/battle/attack/physical-skill-ranking.test.js"
);
const physicalSkillBookkeepingFile = path.join(
  root,
  "src/battle/attack/physical-skill-bookkeeping.js"
);
const activateSpiritFile = path.join(root, "src/battle/buff/activate-spirit.js");
const decideBuffPreparationFile = path.join(root, "src/battle/buff/decide-buff-preparation.js");
const decideInfusionFile = path.join(root, "src/battle/buff/decide-infusion.js");
const decideBuffFile = path.join(root, "src/battle/buff/decide-buff.js");
const decideChannelFile = path.join(root, "src/battle/buff/decide-channel.js");
const executeChannelFile = path.join(root, "src/battle/buff/execute-channel.js");
const buffFactsFile = path.join(root, "src/battle/buff/buff-facts.js");
const playerBuffStateFile = path.join(root, "src/battle/player-buff-state.js");
const playerBuffStateTestFile = path.join(root, "src/battle/player-buff-state.test.js");
const decideCriticalBuffFile = path.join(
  root,
  "src/battle/critical-buff-guard/decide-critical-buff.js"
);
const executeCriticalPauseFile = path.join(
  root,
  "src/battle/critical-buff-guard/execute-critical-pause.js"
);
const executeCriticalPauseTestFile = path.join(
  root,
  "src/battle/critical-buff-guard/execute-critical-pause.test.js"
);
const decideItemFile = path.join(root, "src/battle/item/decide-item.js");
const decideGemFile = path.join(root, "src/battle/item/decide-gem.js");
const decideScrollFile = path.join(root, "src/battle/item/decide-scroll.js");
const scrollCoverageFile = path.join(root, "src/battle/item/scroll-coverage.js");
const scrollCoverageTestFile = path.join(root, "src/battle/item/scroll-coverage.test.js");
const itemFactsFile = path.join(root, "src/battle/item/item-facts.js");
const executeItemFile = path.join(root, "src/battle/item/execute-item.js");
const potionEconomyFile = path.join(root, "src/battle/potion-economy.js");
const dynamicThresholdFile = path.join(root, "src/battle/dynamic-threshold.js");
const stallModeFile = path.join(root, "src/battle/battle-stall-mode.js");
const snapshotFile = path.join(root, "src/battle/snapshot.js");
const turnContextFile = path.join(root, "src/battle/turn-context.js");
const observationLearningFile = path.join(root, "src/battle/battle-observation-learning.js");
const skillReadinessFile = path.join(root, "src/battle/battle-skill-readiness.js");
const playerVitalsFile = path.join(root, "src/battle/battle-player-vitals.js");
const playerEffectsFile = path.join(root, "src/battle/battle-player-effects.js");
const itemSurfaceFile = path.join(root, "src/battle/battle-item-surface.js");
const monsterSurfaceFile = path.join(root, "src/battle/battle-monster-surface.js");
const logTelemetryFile = path.join(root, "src/battle/battle-log-telemetry.js");
const mainLoopFile = path.join(root, "src/battle/main-loop.js");
const turnPreludeFile = path.join(root, "src/battle/battle-turn-prelude.js");
const turnPreludeTest = path.join(root, "src/battle/battle-turn-prelude.test.js");
const actionDecisionFile = path.join(root, "src/battle/battle-action-decision.js");
const actionDecisionDispatchFile = path.join(
  root,
  "src/battle/battle-action-decision-dispatch.js"
);
const actionDecisionEvidenceFile = path.join(root, "src/battle/battle-action-decision-evidence.js");
const actionDecisionRecordingFile = path.join(root, "src/battle/battle-action-decision-recording.js");
const actionDecisionEvidenceTestFile = path.join(
  root,
  "src/battle/battle-action-decision-evidence.test.js"
);
const dispatchFile = path.join(root, "src/battle/battle-action-effect-dispatch.js");
const actionEffectExecutionFile = path.join(root, "src/battle/battle-action-effect-execution.js");
const legacyDispatchFile = path.join(root, "src/battle/dispatch.js");
const legacyDispatchTestFile = path.join(root, "src/battle/dispatch.test.js");
const attackActionSequenceFile = path.join(root, "src/battle/battle-action-attack-sequence.js");
const actionSequenceFile = path.join(root, "src/battle/battle-action-sequence.js");
const buffActionSequenceFile = path.join(root, "src/battle/battle-action-buff-sequence.js");
const debuffActionSequenceFile = path.join(root, "src/battle/battle-action-debuff-sequence.js");
const survivalActionSequenceFile = path.join(root, "src/battle/battle-action-survival-sequence.js");
const decideSurvivalActionFile = path.join(root, "src/battle/decide-survival-action.js");
const legacyStepRunnerFile = path.join(root, "src/battle/step-runner.js");
const legacyAttackFile = path.join(root, "src/battle/attack.js");
const roundStartFile = path.join(root, "src/battle/battle-round-start.js");
const roundLifecycleFile = path.join(root, "src/battle/round-lifecycle.js");
const roundStartLogFile = path.join(root, "src/battle/round-start-log.js");
const legacyNewRoundFile = path.join(root, "src/battle/new-round.js");
const battleRulesFile = actionDecisionFile;
const legacyBattleRulesFile = path.join(root, "src/battle/rules/index.js");
const ruleFactsFile = path.join(root, "src/battle/rules/rule-facts.js");
const attackFactsFile = path.join(root, "src/battle/attack/attack-facts.js");
const legacyAttackFactsFile = path.join(root, "src/battle/rules/attack-facts.js");
const bigSkillCatalogFile = path.join(root, "src/battle/big-skill-catalog.js");
const bigSkillFile = path.join(root, "src/battle/debuff/big-skill-debuff.js");
const bossImperilFile = path.join(root, "src/battle/debuff/decide-boss-imperil.js");
const legacyBigSkillFile = path.join(root, "src/battle/rules/big-skill.js");
const legacyBossImperilFile = path.join(root, "src/battle/rules/decide-boss-imperil.js");
const burstControlFile = path.join(root, "src/battle/debuff/decide-burst-control.js");
const decideOffensiveDebuffFile = path.join(root, "src/battle/debuff/decide-offensive-debuff.js");
const decideDeSkillFile = path.join(root, "src/battle/debuff/decide-de-skill.js");
const decideCastAllFile = path.join(root, "src/battle/debuff/decide-cast-all.js");
const debuffFactsFile = path.join(root, "src/battle/debuff/debuff-facts.js");
const criticalBuffFactsFile = path.join(
  root,
  "src/battle/critical-buff-guard/critical-buff-facts.js"
);
const decideDefendFile = path.join(root, "src/battle/defense/decide-defend.js");
const defendFactsFile = path.join(root, "src/battle/defense/defend-facts.js");
const decideAutoPauseFile = path.join(root, "src/battle/pause/decide-auto-pause.js");
const autoPauseFactsFile = path.join(root, "src/battle/pause/auto-pause-facts.js");
const decideFleeFile = path.join(root, "src/battle/escape/decide-flee.js");
const fleeFactsFile = path.join(root, "src/battle/escape/flee-facts.js");
const decideAttackActionFile = path.join(root, "src/battle/attack/decide-attack-action.js");
const decideAttackFile = path.join(root, "src/battle/attack/decide-attack.js");
const attackPlanFile = path.join(root, "src/battle/attack/attack-plan.js");
const spellAttackPlanFile = path.join(root, "src/battle/attack/spell-attack-plan.js");
const decideTierFile = path.join(root, "src/battle/attack/decide-tier.js");
const decideSkillFile = path.join(root, "src/battle/attack/decide-skill.js");
const physicalSkillScoringFile = path.join(root, "src/battle/attack/physical-skill-scoring.js");
const pickElementFile = path.join(root, "src/battle/attack/pick-element.js");
const autoElementSelectionFile = path.join(root, "src/battle/attack/auto-element-selection.js");
const dispatchTestFile = path.join(root, "src/battle/battle-action-effect-dispatch.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function readBattleActionRulesText() {
  return [actionDecisionFile].map((file) => fs.readFileSync(file, "utf8")).join("\n");
}

function checkInit() {
  const text = fs.readFileSync(initFile, "utf8");
  const lines = text.split(/\r?\n/);
  const forbidden = [
    /\bmain\b/,
    /\bpauseChange\b/,
    /\breloader\b/,
    /\bnewRound\b/,
    /\bsyncMonsterDb\b/,
    /\bsetupScanWatch\b/,
    /\brenderResistPanel\b/,
    /\bbattleCode\b/,
    /\bpauseButton\b/,
    /\bpauseHotkey\b/,
    /\bhvAABox2\b/,
    /\bbattle_main\b/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runBattleAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} battle workflow belongs in runBattleAutomation(event)`
      );
    }
  });
}

function checkBattleEntry() {
  if (fs.existsSync(legacyAttackFile)) {
    violations.push("src/battle/attack.js legacy HP updater module must stay deleted");
  }
  const text = fs.readFileSync(battleFile, "utf8");
  if (!/export const BattleEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(battleFile)} must expose BattleEvent`);
  }
  if (!/export function runBattleAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(battleFile)} must expose runBattleAutomation(event)`);
  }
  if (/export function runBattleAutomation\(\s*\)/.test(text)) {
    violations.push(`${rel(battleFile)} must not expose no-arg battle entry`);
  }
  if (!text.includes("runBattleRoundStartAutomation")) {
    violations.push(`${rel(battleFile)} must start rounds through runBattleRoundStartAutomation()`);
  }
  if (!text.includes("runBattleTurnAutomation")) {
    violations.push(`${rel(battleFile)} must run turns through runBattleTurnAutomation()`);
  }
  if (!text.includes("BattleTurnWorkflowEvent.RUN_CURRENT_TURN")) {
    violations.push(`${rel(battleFile)} must run turns through BattleTurnWorkflowEvent.RUN_CURRENT_TURN`);
  }
  if (!text.includes("runBattleActionEventBridgeAutomation")) {
    violations.push(
      `${rel(battleFile)} must install action events through runBattleActionEventBridgeAutomation(event)`
    );
  }
  if (!text.includes("BattleLifecycleEvent.BATTLE_STARTED")) {
    violations.push(`${rel(battleFile)} must report battle start through battle lifecycle`);
  }
  if (
    /BattleStartRuntimeEvent\.BATTLE_STARTED|MonsterKnowledgeEvent\.BATTLE_STARTED|BattleMonitorEvent\.BATTLE_STARTED/.test(
      text
    )
  ) {
    violations.push(`${rel(battleFile)} battle started exits belong in battle-lifecycle`);
  }
  if (/startBattleMonsterKnowledge|startBattleMonitoring/.test(text)) {
    violations.push(`${rel(battleFile)} must not split battle started exits in page entry`);
  }
  if (/\bsetup(?:PauseControls|MonsterKnowledge|BattleMonitor)\b/.test(text)) {
    violations.push(`${rel(battleFile)} must not use legacy setup* names for battle orchestration`);
  }
  if (!text.includes("BattleEvent") || !text.includes("EVENT_PAGE_READY")) {
    violations.push(`${rel(battleFile)} must own BattleEvent.PAGE_READY wiring`);
  }
  if (!text.includes("BattlePauseControlsEvent.INSTALL")) {
    violations.push(`${rel(battleFile)} must install pause controls through their entry`);
  }
  for (const required of [
    "PAGE_READY_STARTUP_STEPS",
    "installBattlePauseControls",
    "installBattleActionEventBridge",
    "reportBattleStarted",
    "startBattleRound",
    "runInitialBattleTurn",
    "runPageReadyStartup",
    "BattleAutomationEvidenceEvent.RECORD_STARTUP",
    "runBattleAutomationEvidence",
    "rejectUnknownBattleAutomationEvent",
    "unknownBattleAutomationEvent",
    'capability: "pauseControls"',
    'capability: "actionEventBridge"',
    'capability: "battleStarted"',
    'capability: "roundStarted"',
    'capability: "initialBattleTurn"',
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(battleFile)} must name page-ready startup step ${required}`);
    }
  }
  if (
    !/const PAGE_READY_STARTUP_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "pauseControls"[\s\S]*run: installBattlePauseControls[\s\S]*capability: "actionEventBridge"[\s\S]*run: installBattleActionEventBridge[\s\S]*capability: "battleStarted"[\s\S]*run: reportBattleStarted[\s\S]*capability: "roundStarted"[\s\S]*run: startBattleRound[\s\S]*capability: "initialBattleTurn"[\s\S]*run: runInitialBattleTurn[\s\S]*\]\)/.test(
      text
    )
  ) {
    violations.push(`${rel(battleFile)} must own frozen explicit page-ready startup order`);
  }
  if (!/function runPageReadyStartup\(deps\)[\s\S]*for\s*\(\s*const\s+step\s+of\s+PAGE_READY_STARTUP_STEPS\s*\)/.test(text)) {
    violations.push(`${rel(battleFile)} must run page-ready startup through PAGE_READY_STARTUP_STEPS`);
  }
  if (
    !/const battleEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PAGE_READY\]: \(event, deps\) => runPageReadyStartup\(deps\)/.test(
      text
    )
  ) {
    violations.push(`${rel(battleFile)} must route battle events through battleEventHandlers`);
  }
  if (!text.includes("battleEventHandlers[event?.type]")) {
    violations.push(`${rel(battleFile)} must reject null battle page events without startup side effects`);
  }
  if (!text.includes("const startupSucceeded = steps.every((step) => step.result)")) {
    violations.push(`${rel(battleFile)} must derive page-ready success from startup step results`);
  }
  if (!text.includes("recordStartup(EVENT_PAGE_READY, startupSucceeded, steps)")) {
    violations.push(`${rel(battleFile)} must not claim page-ready succeeded when a startup step failed`);
  }
  if (!text.includes("rejectUnknownBattleAutomationEvent(event, deps)")) {
    violations.push(`${rel(battleFile)} must record rejected battle automation evidence`);
  }
  const entryBody =
    text.match(/export function runBattleAutomation\(event = \{ type: EVENT_PAGE_READY \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/event\.type\s*!==|event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(battleFile)} entry must dispatch by handler table`);
  }
  for (const forbidden of [
    "runBattlePauseControlsAutomation",
    "runBattleActionEventBridgeAutomation",
    "runBattleLifecycleAutomation",
    "runBattleRoundStartAutomation",
    "runBattleTurnAutomation",
  ]) {
    if (entryBody.includes(forbidden)) {
      violations.push(`${rel(battleFile)} entry must route page ready through startup steps`);
    }
  }
  if (
    /\bpauseButton\b|\bpauseHotkey\b|\bpauseHotkeyKey\b|\bpauseChange\b|\bhvAABox2\b/.test(text)
  ) {
    violations.push(
      `${rel(battleFile)} pause controls belong in runBattlePauseControlsAutomation(event)`
    );
  }
  if (/\battackStatus\b|BattleActionSpeedEvent\.BATTLE_STARTED/.test(text)) {
    violations.push(
      `${rel(battleFile)} battle start runtime belongs in runBattleLifecycleAutomation(event)`
    );
  }
  const pageText = fs.readFileSync(path.join(root, "src/pages/page-automation.js"), "utf8");
  if (!pageText.includes("BattleEvent.PAGE_READY")) {
    violations.push("src/pages/page-automation.js must report BattleEvent.PAGE_READY");
  }
  if (/runBattleAutomation\(\s*\)/.test(pageText)) {
    violations.push("src/pages/page-automation.js must not call no-arg battle entry");
  }
  const battleTestText = fs.readFileSync(path.join(root, "src/battle/battle-automation.test.js"), "utf8");
  for (const required of [
    "rejects null events without starting battle page capabilities",
    "rejects unknown events with structured startup evidence",
    "records failed startup steps without claiming page startup succeeded",
    "HVAA:lastBattleAutomation",
    "unknownBattleAutomationEvent",
  ]) {
    if (!battleTestText.includes(required)) {
      violations.push(`src/battle/battle-automation.test.js must cover ${required}`);
    }
  }
}

function checkBattleLifecycleEntry() {
  const text = fs.readFileSync(battleLifecycleFile, "utf8");
  if (!/export const BattleLifecycleEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(battleLifecycleFile)} must expose BattleLifecycleEvent`);
  }
  if (!/export function runBattleLifecycleAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(battleLifecycleFile)} must expose runBattleLifecycleAutomation(event)`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleLifecycleEvent\b|runBattleLifecycleAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(battleLifecycleFile)} may export only its event entry`);
  }
  for (const required of [
    "BattleStartRuntimeEvent.BATTLE_STARTED",
    "MonsterKnowledgeEvent.BATTLE_STARTED",
    "BattleMonitorEvent.BATTLE_STARTED",
    "BattleLifecycleEvidenceEvent.RECORD_LIFECYCLE",
    "runBattleLifecycleEvidence",
    "unknownBattleLifecycleEvent",
    "battleLifecycleHandlers[event?.type]",
    "recordLifecycle(EVENT_BATTLE_STARTED, started, steps)",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(battleLifecycleFile)} must make ${required} visible`);
    }
  }
  const runtimeIndex = text.indexOf("BattleStartRuntimeEvent.BATTLE_STARTED");
  const knowledgeIndex = text.indexOf("MonsterKnowledgeEvent.BATTLE_STARTED");
  const monitorIndex = text.indexOf("BattleMonitorEvent.BATTLE_STARTED");
  if (
    runtimeIndex === -1 ||
    knowledgeIndex === -1 ||
    monitorIndex === -1 ||
    runtimeIndex > knowledgeIndex ||
    knowledgeIndex > monitorIndex
  ) {
    violations.push(
      `${rel(battleLifecycleFile)} must start runtime before knowledge and monitor exits`
    );
  }
  if (!fs.existsSync(battleLifecycleTest)) {
    violations.push(`${rel(battleLifecycleTest)} must cover battle lifecycle contract`);
  }
  const testText = fs.readFileSync(battleLifecycleTest, "utf8");
  for (const required of [
    "returns false and records evidence when a battle-start exit fails",
    "rejects unknown events with lifecycle evidence",
    "rejects null events with lifecycle evidence instead of throwing",
    "HVAA:lastBattleLifecycle",
    "unknownBattleLifecycleEvent",
  ]) {
    if (!testText.includes(required)) {
      violations.push(`${rel(battleLifecycleTest)} must cover ${required}`);
    }
  }
  const evidenceFile = path.join(root, "src/battle/battle-lifecycle-evidence.js");
  const evidenceTestFile = path.join(root, "src/battle/battle-lifecycle-evidence.test.js");
  const evidenceText = fs.readFileSync(evidenceFile, "utf8");
  for (const required of [
    "BattleLifecycleEvidenceEvent",
    "runBattleLifecycleEvidence",
    "DiagnosticEvidenceKey.BATTLE_LIFECYCLE",
    "battleLifecycleEvidenceEventHandlers[event?.type]",
    "[HVAA] battle lifecycle",
    "storageWriteOk",
    "storageWriteError",
  ]) {
    if (!evidenceText.includes(required)) {
      violations.push(`${rel(evidenceFile)} must own ${required}`);
    }
  }
  const evidenceTestText = fs.readFileSync(evidenceTestFile, "utf8");
  for (const required of [
    "records battle lifecycle evidence",
    "rejects null lifecycle evidence events without writing diagnostics",
    "HVAA:lastBattleLifecycle",
  ]) {
    if (!evidenceTestText.includes(required)) {
      violations.push(`${rel(evidenceTestFile)} must cover ${required}`);
    }
  }
  const diagnosticKeysText = fs.readFileSync(
    path.join(root, "src/core/diagnostic-evidence-keys.js"),
    "utf8"
  );
  for (const required of [
    'BATTLE_LIFECYCLE: "HVAA:lastBattleLifecycle"',
    'source("battleLifecycle", DiagnosticEvidenceKey.BATTLE_LIFECYCLE)',
  ]) {
    if (!diagnosticKeysText.includes(required)) {
      violations.push(`src/core/diagnostic-evidence-keys.js must include ${required}`);
    }
  }
  for (const file of [battleFile, actionEventBridgeFile, mainLoopFile, roundStartFile]) {
    const source = fs.readFileSync(file, "utf8");
    if (file !== battleFile && /from\s+["']\.\/battle-lifecycle\.js["']/.test(source)) {
      violations.push(`${rel(file)} must not import internal battle lifecycle workflow`);
    }
  }
}

function checkRoundStartCallers() {
  for (const file of [battleFile, actionEventBridgeFile]) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes("runBattleRoundStartAutomation")) return;
      if (/\bnewRound\s*\(/.test(line)) {
        violations.push(
          `${rel(file)}:${index + 1} legacy newRound() call is forbidden; use runBattleRoundStartAutomation(event)`
        );
      }
    });
  }
}

function checkRoundStartEntry() {
  if (fs.existsSync(legacyNewRoundFile)) {
    violations.push("src/battle/new-round.js legacy round start path must stay deleted");
  }
  const text = fs.readFileSync(roundStartFile, "utf8");
  const roundLifecycleText = fs.readFileSync(roundLifecycleFile, "utf8");
  const roundStartLogText = fs.readFileSync(roundStartLogFile, "utf8");
  if (!/export function runBattleRoundStartAutomation\(/.test(text)) {
    violations.push(`${rel(roundStartFile)} must expose runBattleRoundStartAutomation(event)`);
  }
  if (!text.includes("EncounterEvent.RANDOM_ENCOUNTER_STARTED")) {
    violations.push(
      `${rel(roundStartFile)} must report random encounter starts through encounter entry`
    );
  }
  if (/OptionEvent|runOptionAutomation|["']encounter["']/.test(text)) {
    violations.push(`${rel(roundStartFile)} must not decide encounter option gates directly`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(roundStartFile)} must not read round-start options directly`);
  }
  if (/\b(?:export\s+)?function\s+newRound\s*\(/.test(text)) {
    violations.push(
      `${rel(roundStartFile)} legacy newRound() bridge must stay deleted; use runBattleRoundStartAutomation(event)`
    );
  }
  if (/from\s+["']\.\/new-round\.js["']/.test(text)) {
    violations.push(`${rel(roundStartFile)} must not import legacy new-round path`);
  }
  const startRoundLifecycleBody =
    roundLifecycleText.match(/function startRoundLifecycle\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  const readyRoundLifecycleBody =
    roundLifecycleText.match(/function readyRoundLifecycle\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (
    startRoundLifecycleBody.indexOf("AutoTuneEvent.ROUND_STARTED") === -1 ||
    startRoundLifecycleBody.indexOf("BattleTurnEvent.ROUND_STARTED") === -1 ||
    startRoundLifecycleBody.indexOf("AutoTuneEvent.ROUND_STARTED") >
      startRoundLifecycleBody.indexOf("BattleTurnEvent.ROUND_STARTED")
  ) {
    violations.push(`${rel(roundLifecycleFile)} must start auto-tune before battle-turn round runtime`);
  }
  if (
    readyRoundLifecycleBody.indexOf("BattleSkillUsageEvent.RESET_ROUND") === -1 ||
    readyRoundLifecycleBody.indexOf("MonsterKnowledgeEvent.ROUND_STARTED") === -1 ||
    readyRoundLifecycleBody.indexOf("BattleSkillUsageEvent.RESET_ROUND") >
      readyRoundLifecycleBody.indexOf("MonsterKnowledgeEvent.ROUND_STARTED")
  ) {
    violations.push(`${rel(roundLifecycleFile)} must reset skill usage before monster knowledge round start`);
  }
  if (!/const BATTLE_LOG_SELECTOR = ["']#textlog>tbody>tr>td["']/.test(roundStartLogText)) {
    violations.push(`${rel(roundStartLogFile)} must own the battle log selector constant`);
  }
}

function checkTurnEntry() {
  const text = fs.readFileSync(mainLoopFile, "utf8");
  const actionDecisionText = fs.readFileSync(actionDecisionFile, "utf8");
  const actionDecisionDispatchText = fs.readFileSync(actionDecisionDispatchFile, "utf8");
  const actionDecisionRecordingText = fs.readFileSync(actionDecisionRecordingFile, "utf8");
  if (!/export function runBattleTurnAutomation\(/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must expose runBattleTurnAutomation()`);
  }
  if (!/export const BattleTurnWorkflowEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must expose BattleTurnWorkflowEvent`);
  }
  if (!text.includes("RUN_CURRENT_TURN")) {
    violations.push(`${rel(mainLoopFile)} must own RUN_CURRENT_TURN event`);
  }
  if (/\b(?:export\s+)?function\s+main\s*\(/.test(text)) {
    violations.push(
      `${rel(mainLoopFile)} legacy main() bridge must stay deleted; use runBattleTurnAutomation()`
    );
  }
  if (!text.includes("runBattleActionDecision")) {
    violations.push(`${rel(mainLoopFile)} must delegate action decisions to one entry`);
  }
  if (
    !text.includes("BattleTurnPreludeEvent.PREPARE_CURRENT_TURN") ||
    !text.includes("runBattleTurnPrelude")
  ) {
    violations.push(`${rel(mainLoopFile)} must run turn prelude through one entry`);
  }
  if (
    /MonsterStatusEvent\.(?:ENSURE_READY|UPDATE_HP)|BattleTurnEvent\.TURN_STARTED|BattleMonitorEvent\.HUD_REFRESH|killBug|runMonsterStatusAutomation|runBattleTurnRuntime|runBattleMonitorAutomation/.test(
      text
    )
  ) {
    violations.push(`${rel(mainLoopFile)} must not assemble turn prelude directly`);
  }
  if (
    !/runBattleTurnContext\(\{\s*type:\s*BattleTurnContextEvent\.PREPARE,\s*logTelemetry:\s*prelude\?\.battleLogTelemetry,\s*\}\)/.test(text) ||
    !/runBattleActionDecision\(\{\s*type:\s*BattleActionDecisionEvent\.DECIDE,\s*context,\s*\}\)/.test(text)
  ) {
    violations.push(
      `${rel(mainLoopFile)} must pass prelude battle log telemetry into prepared turn context before action decision`
    );
  }
  if (/const\s*\{[^}]*\bsnap\b[^}]*\}\s*=\s*runBattleTurnContext\(\)/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must not unpack prepared turn context`);
  }
  if (/runBattleActionDecision\([^,\n]+,\s*[^)]+\)/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must not call action decision through old two-arg path`);
  }
  if (!text.includes("BattleActionDecisionEvent.DECIDE")) {
    violations.push(`${rel(mainLoopFile)} must call action decision through BattleActionDecisionEvent.DECIDE`);
  }
  if (/\bBATTLE_RULES\b|\bBattleRule\b|\brunRules\b/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must not assemble battle action rule chains directly`);
  }
  for (const required of [
    "BattleTurnWorkflowEvidenceEvent.RECORD_STAGE",
    "runBattleTurnWorkflowEvidence",
    "recordTurnWorkflowStage",
    "turnWorkflowEvidenceWriteFailed",
    'stage: "workflowEvidenceFailed"',
    'recordTurnWorkflowStage("started")',
    'recordTurnWorkflowStage("paused"',
    'recordTurnWorkflowStage("preludePrepared"',
    'recordTurnWorkflowStage("contextPrepared"',
    'recordTurnWorkflowStage("decisionCompleted", { acted: Boolean(acted) })',
    'recordTurnWorkflowStage("failed"',
    'recordTurnWorkflowStage("rejected"',
    "eventType: event?.type ?? null",
    "battleTurnWorkflowEventHandlers[event?.type]",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(mainLoopFile)} must record turn workflow evidence ${required}`);
    }
  }
  const mainLoopTestText = fs.readFileSync(path.join(root, "src/battle/main-loop.test.js"), "utf8");
  if (
    !mainLoopTestText.includes(
      "rejects null turn workflow events with structured evidence instead of throwing"
    )
  ) {
    violations.push("src/battle/main-loop.test.js must cover null turn workflow rejection");
  }
  if (
    !mainLoopTestText.includes(
      "records failed turn workflow stage as not acted without rethrowing"
    )
  ) {
    violations.push("src/battle/main-loop.test.js must cover failed turn workflow as not acted");
  }
  if (!mainLoopTestText.includes("eventType: null")) {
    violations.push("src/battle/main-loop.test.js must preserve null turn workflow event identity");
  }
  const mainLoopEvidenceFailureTestFile = path.join(
    root,
    "src/battle/main-loop-evidence-failure.test.js"
  );
  const mainLoopEvidenceFailureTestText = fs.existsSync(mainLoopEvidenceFailureTestFile)
    ? fs.readFileSync(mainLoopEvidenceFailureTestFile, "utf8")
    : "";
  for (const required of [
    "continues the turn when workflow evidence recording fails once",
    "does not throw when workflow evidence recording keeps failing",
    "turnWorkflowEvidenceWriteFailed",
  ]) {
    if (!mainLoopEvidenceFailureTestText.includes(required)) {
      violations.push(`${rel(mainLoopEvidenceFailureTestFile)} must cover ${required}`);
    }
  }
  const turnWorkflowEvidenceFile = path.join(
    root,
    "src/battle/battle-turn-workflow-evidence.js"
  );
  const turnWorkflowEvidenceText = fs.existsSync(turnWorkflowEvidenceFile)
    ? fs.readFileSync(turnWorkflowEvidenceFile, "utf8")
    : "";
  for (const required of [
    "BattleTurnWorkflowEvidenceEvent",
    "runBattleTurnWorkflowEvidence",
    "DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW",
    "[HVAA] battle turn workflow",
    "storageWriteOk",
    "storageWriteError",
  ]) {
    if (!turnWorkflowEvidenceText.includes(required)) {
      violations.push(`${rel(turnWorkflowEvidenceFile)} must own ${required}`);
    }
  }
  if (!turnWorkflowEvidenceText.includes("battleTurnWorkflowEvidenceEventHandlers[event?.type]")) {
    violations.push(`${rel(turnWorkflowEvidenceFile)} must reject null turn workflow evidence events`);
  }
  const turnWorkflowEvidenceTestFile = path.join(
    root,
    "src/battle/battle-turn-workflow-evidence.test.js"
  );
  const turnWorkflowEvidenceTestText = fs.existsSync(turnWorkflowEvidenceTestFile)
    ? fs.readFileSync(turnWorkflowEvidenceTestFile, "utf8")
    : "";
  if (!turnWorkflowEvidenceTestText.includes("runBattleTurnWorkflowEvidence(null)")) {
    violations.push(`${rel(turnWorkflowEvidenceTestFile)} must cover null turn workflow evidence events`);
  }
  for (const required of [
    "keeps turn workflow evidence stored when debug output fails",
    "storageWriteOk: true",
    "console blocked",
  ]) {
    if (!turnWorkflowEvidenceTestText.includes(required)) {
      violations.push(`${rel(turnWorkflowEvidenceTestFile)} must cover ${required}`);
    }
  }
  const actionEvidencePersistenceTestFile = path.join(
    root,
    "src/battle/battle-action-evidence-persistence.test.js"
  );
  const actionEvidencePersistenceTestText = fs.existsSync(actionEvidencePersistenceTestFile)
    ? fs.readFileSync(actionEvidencePersistenceTestFile, "utf8")
    : "";
  for (const required of [
    "keeps turn workflow evidence visible when storage is unavailable",
    "storageWriteError: \"quota\"",
  ]) {
    if (!actionEvidencePersistenceTestText.includes(required)) {
      violations.push(`${rel(actionEvidencePersistenceTestFile)} must cover ${required}`);
    }
  }
  if (!/export function runBattleActionDecision\(/.test(actionDecisionText)) {
    violations.push(`${rel(actionDecisionFile)} must expose runBattleActionDecision()`);
  }
  if (!actionDecisionText.includes("BattleActionDecisionEvent")) {
    violations.push(`${rel(actionDecisionFile)} must expose BattleActionDecisionEvent`);
  }
  const turnPreludeText = fs.readFileSync(turnPreludeFile, "utf8");
  for (const required of [
    "BattleTurnPreludeEvent",
    "PREPARE_CURRENT_TURN",
    "TURN_PRELUDE_STEPS",
    'capability: "monsterStatusReady"',
    'capability: "turnStarted"',
    'capability: "monitorHudRefresh"',
    'capability: "killBugRecovery"',
    'capability: "monsterHpUpdate"',
    "MonsterStatusEvent.ENSURE_READY",
    "BattleTurnEvent.TURN_STARTED",
    "BattleMonitorEvent.HUD_REFRESH",
    "BattleKillBugRecoveryEvent.RECOVER",
    "runBattleKillBugRecovery",
    "MonsterStatusEvent.UPDATE_HP",
  ]) {
    if (!turnPreludeText.includes(required)) {
      violations.push(`${rel(turnPreludeFile)} must own ${required}`);
    }
  }
  if (!fs.existsSync(turnPreludeTest)) {
    violations.push(`${rel(turnPreludeTest)} must cover turn prelude contract`);
  }
  if (
    !/const TURN_PRELUDE_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "monsterStatusReady"[\s\S]*capability: "turnStarted"[\s\S]*capability: "monitorHudRefresh"[\s\S]*capability: "killBugRecovery"[\s\S]*capability: "monsterHpUpdate"[\s\S]*\]\)/.test(
      turnPreludeText
    )
  ) {
    violations.push(`${rel(turnPreludeFile)} must own frozen explicit turn prelude order`);
  }
  const prepareCurrentTurnBody =
    turnPreludeText.match(/function prepareCurrentTurn\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/for\s*\(\s*const\s+step\s+of\s+TURN_PRELUDE_STEPS\s*\)/.test(prepareCurrentTurnBody)) {
    violations.push(`${rel(turnPreludeFile)} must run current-turn prelude through TURN_PRELUDE_STEPS`);
  }
  if (fs.existsSync(legacyBattleRulesFile)) {
    violations.push(
      `${rel(legacyBattleRulesFile)} must stay retired; action rules belong inside runBattleActionDecision`
    );
  }
  if (fs.existsSync(legacyDispatchFile) || fs.existsSync(legacyDispatchTestFile)) {
    violations.push("src/battle/dispatch.js legacy action effect path must stay retired");
  }
  for (const required of [
    "ACTION_STEPS",
    "readBattleActionEffectEvidence",
    "applyActionResultStep",
    "actionOptions",
    "const actionContext = { snap, actionOptions }",
    "for (const step of ACTION_STEPS)",
    "decideActionStep(step, actionContext)",
    "actionDecisionStepThrew",
    "const steps = []",
    "const stepTrace = { capability: step.capability, result, acted }",
    "if (effectEvidence) stepTrace.effectEvidence = effectEvidence",
    "effectEvidenceReadError",
    "steps.push(stepTrace)",
    "readEffectEvidenceSafely",
    "readFreshEffectEvidence",
    "recordDecisionEvidence(steps)",
    "rejectUnknownActionDecisionEvent",
    "unknownActionDecisionEvent",
    'capability: "actionDecision"',
    "return true",
    "return false",
    "decideSurvivalStep",
    "BattleSurvivalActionEvent.DECIDE",
    "runBattleSurvivalAction",
    "decideBuffPreparationStep",
    "BattleBuffPreparationEvent.DECIDE",
    "runBattleBuffPreparation",
    "decideOffensiveDebuffStep",
    "BattleOffensiveDebuffEvent.DECIDE",
    "runBattleOffensiveDebuff",
    "decideAttackStep",
    "BattleAttackActionEvent.DECIDE",
    "runBattleAttackAction",
  ]) {
    if (!actionDecisionText.includes(required)) {
      violations.push(`${rel(actionDecisionFile)} must own action decision ${required}`);
    }
  }
  for (const required of [
    "BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT",
    "runBattleActionEffectDispatch",
    "applyActionResultStep",
    "actionEffectDispatchThrew",
    "effect-dispatch-event",
    "originalResultKind: result?.kind ?? null",
    "failureReason: REASON_ACTION_EFFECT_DISPATCH_THROW",
  ]) {
    if (!actionDecisionDispatchText.includes(required)) {
      violations.push(`${rel(actionDecisionDispatchFile)} must own action dispatch ${required}`);
    }
  }
  if (
    !/const ACTION_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "survival"[\s\S]*decide: decideSurvivalStep[\s\S]*capability: "buffPreparation"[\s\S]*decide: decideBuffPreparationStep[\s\S]*capability: "offensiveDebuff"[\s\S]*decide: decideOffensiveDebuffStep[\s\S]*capability: "attack"[\s\S]*decide: decideAttackStep[\s\S]*\]\)/.test(
      actionDecisionText
    )
  ) {
    violations.push(`${rel(actionDecisionFile)} must own frozen explicit action step order`);
  }
  const actionStepsBody =
    actionDecisionText.match(/const ACTION_STEPS = Object\.freeze\(\[[\s\S]*?\]\);/)?.[0] || "";
  if (/type:\s*Battle\w+Event\.DECIDE|decide:\s*runBattle\w+/.test(actionStepsBody)) {
    violations.push(
      `${rel(actionDecisionFile)} action step order must name business steps, not expose event fields`
    );
  }
  if (/\(snap,\s*opt\)\s*=>/.test(actionDecisionText)) {
    violations.push(
      `${rel(actionDecisionFile)} must not reintroduce repeated two-arg step wrappers`
    );
  }
  if (
    !actionDecisionText.includes("battleActionDecisionEventHandlers[event?.type]?.(event)") ||
    !actionDecisionText.includes("rejectUnknownActionDecisionEvent(event)")
  ) {
    violations.push(`${rel(actionDecisionFile)} must record decision evidence for unknown events`);
  }
  for (const required of [
    "BattleActionDecisionEvidenceEvent.RECORD_TRACE",
    "runBattleActionDecisionEvidence",
    "actionDecisionEvidenceWriteFailed",
    "decision-evidence-event",
    "recordDecisionEvidenceFailure",
  ]) {
    if (!actionDecisionRecordingText.includes(required)) {
      violations.push(`${rel(actionDecisionRecordingFile)} must own action decision recording ${required}`);
    }
  }
  const actionDecisionTestFile = path.join(root, "src/battle/battle-action-decision.test.js");
  const actionDecisionExceptionTestFile = path.join(
    root,
    "src/battle/battle-action-decision-exception.test.js"
  );
  const actionDecisionEvidenceFailureTestFile = path.join(
    root,
    "src/battle/battle-action-decision-evidence-failure.test.js"
  );
  const actionDecisionEffectEvidenceFailureTestFile = path.join(
    root,
    "src/battle/battle-action-decision-effect-evidence-failure.test.js"
  );
  const actionDecisionTestText = fs.existsSync(actionDecisionTestFile)
    ? fs.readFileSync(actionDecisionTestFile, "utf8")
    : "";
  for (const required of [
    "does not reuse stale effect evidence when dispatch writes no new effect",
    "DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT",
    "effectEvidence",
    "staleFailure",
  ]) {
    if (!actionDecisionTestText.includes(required)) {
      violations.push(`${rel(actionDecisionTestFile)} must cover ${required}`);
    }
  }
  const actionDecisionExceptionTestText = fs.existsSync(actionDecisionExceptionTestFile)
    ? fs.readFileSync(actionDecisionExceptionTestFile, "utf8")
    : "";
  for (const required of [
    "records thrown decision steps as structured not-acted results",
    "records thrown effect dispatch as structured not-acted evidence",
    "actionDecisionStepThrew",
    "actionEffectDispatchThrew",
    "decision-step-error",
    "survival exploded",
  ]) {
    if (!actionDecisionExceptionTestText.includes(required)) {
      violations.push(`${rel(actionDecisionExceptionTestFile)} must cover ${required}`);
    }
  }
  const actionDecisionEvidenceFailureTestText = fs.existsSync(actionDecisionEvidenceFailureTestFile)
    ? fs.readFileSync(actionDecisionEvidenceFailureTestFile, "utf8")
    : "";
  for (const required of [
    "keeps acted decisions acted when decision evidence recording fails once",
    "keeps acted decisions acted when decision evidence recording keeps failing",
    "expect(result).toBe(true)",
    "actionDecisionEvidenceWriteFailed",
  ]) {
    if (!actionDecisionEvidenceFailureTestText.includes(required)) {
      violations.push(`${rel(actionDecisionEvidenceFailureTestFile)} must cover ${required}`);
    }
  }
  const actionDecisionEffectEvidenceFailureTestText = fs.existsSync(
    actionDecisionEffectEvidenceFailureTestFile
  )
    ? fs.readFileSync(actionDecisionEffectEvidenceFailureTestFile, "utf8")
    : "";
  for (const required of [
    "keeps acted decisions acted when effect evidence reads throw",
    "effectEvidenceReadError",
    "effect evidence read failed",
    "acted: true",
  ]) {
    if (!actionDecisionEffectEvidenceFailureTestText.includes(required)) {
      violations.push(`${rel(actionDecisionEffectEvidenceFailureTestFile)} must cover ${required}`);
    }
  }
  const actionDecisionEvidenceText = fs.readFileSync(actionDecisionEvidenceFile, "utf8");
  for (const required of [
    "BattleActionDecisionEvidenceEvent",
    "RECORD_TRACE",
    "runBattleActionDecisionEvidence",
    "ACTION_DECISION_EVIDENCE_KEY",
    "DiagnosticEvidenceKey.BATTLE_ACTION_DECISION",
    "summarizeResult",
    "classifyDecisionStepFailure",
    "eventType: result.eventType",
    "capability: result.capability",
    "error: result.error",
    "result.plan?.type ?? result.plan?.kind",
    "acted: Boolean(step.acted)",
    "effectEvidenceReadError: step.effectEvidenceReadError",
    "effect: summarizeEffectEvidence(step.effectEvidence)",
    "knownResultKind: effectEvidence.knownResultKind",
    "step.effectEvidence?.failureReason",
    "failureReason: classifyDecisionStepFailure(step)",
    "missingActionResult",
    "noActionCandidate",
    "actionExecutorRejected",
    "[HVAA] battle action decision",
  ]) {
    if (!actionDecisionEvidenceText.includes(required)) {
      violations.push(`${rel(actionDecisionEvidenceFile)} must own decision evidence ${required}`);
    }
  }
  const actionDecisionEvidenceTestText = fs.existsSync(actionDecisionEvidenceTestFile)
    ? fs.readFileSync(actionDecisionEvidenceTestFile, "utf8")
    : "";
  for (const required of [
    "records decision trace with acted and not-acted steps",
    "records per-step failure reasons when a real action candidate is rejected",
    "failureReason",
    "keeps legacy plan kind fallback for older decision evidence",
    "records event type for rejected decision events",
    "knownResultKind: true",
    "HVAA:lastBattleActionDecision",
    "rejects unknown decision evidence events",
  ]) {
    if (!actionDecisionEvidenceTestText.includes(required)) {
      violations.push(`${rel(actionDecisionEvidenceTestFile)} must cover ${required}`);
    }
  }
  const actionDecisionEffectEvidenceTestFile = path.join(
    root,
    "src/battle/battle-action-decision-effect-evidence.test.js"
  );
  if (!fs.existsSync(actionDecisionEffectEvidenceTestFile)) {
    violations.push(`${rel(actionDecisionEffectEvidenceTestFile)} must cover decision/effect evidence bridging`);
  } else {
    const testText = fs.readFileSync(actionDecisionEffectEvidenceTestFile, "utf8");
    for (const required of [
      "carries fresh effect command failure evidence into the decision step",
      "targetDead",
      "HVAA:lastBattleActionDecision",
      "command: \"target.clickSkillThenTarget\"",
    ]) {
      if (!testText.includes(required)) {
        violations.push(`${rel(actionDecisionEffectEvidenceTestFile)} must cover ${required}`);
      }
    }
  }
  const actionEffectText = fs.readFileSync(dispatchFile, "utf8");
  const actionEffectExecutionText = fs.readFileSync(actionEffectExecutionFile, "utf8");
  for (const required of [
    "executeActionResult",
    "isKnownActionResultKind",
    "recordActionEffectEvidence",
    "rejectUnknownActionEffectEvent",
    "unknownActionEffectDispatchEvent",
  ]) {
    if (!actionEffectText.includes(required)) {
      violations.push(`${rel(dispatchFile)} must lock ActionResult dispatch ${required}`);
    }
  }
  for (const required of [
    "ACTION_RESULT_EXECUTORS",
    "noop: executeNoopResult",
    '"item-command": executeItemCommandResult',
    '"skill-command": executeSkillCommandResult',
    '"defend-command": executeDefendCommandResult',
    '"toggle-spirit": executeToggleSpiritResult',
    '"click-skill-then-target": executeSkillTargetResult',
    '"flee-command": executeFleeCommandResult',
    '"alert-and-pause": executeAlertPauseResult',
    "pause: executePauseResult",
    '"critical-pause": executeCriticalPauseResult',
    '"attack-plan": executeAttackPlanResult',
    '"item-plan": executeItemPlanResult',
    '"channel-plan": executeChannelPlanResult',
  ]) {
    if (!actionEffectExecutionText.includes(required)) {
      violations.push(`${rel(actionEffectExecutionFile)} must lock ActionResult executor ${required}`);
    }
  }
  for (const forbidden of ["halt: executeHaltResult", "function executeHaltResult"]) {
    if (actionEffectText.includes(forbidden) || actionEffectExecutionText.includes(forbidden)) {
      violations.push(`${rel(dispatchFile)} must keep retired halt ActionResult out of dispatch`);
    }
  }
  if (/switch\s*\(\s*result\.kind\s*\)/.test(actionEffectExecutionText)) {
    violations.push(`${rel(actionEffectExecutionFile)} must dispatch ActionResult through ACTION_RESULT_EXECUTORS`);
  }
  if (fs.existsSync(actionSequenceFile)) {
    violations.push(
      `${rel(actionSequenceFile)} must stay retired; action order belongs in runBattleActionDecision`
    );
  }
  if (/\bBATTLE_RULES\b|\bBattleRule\b|\brule\.decide\b/.test(actionDecisionText)) {
    violations.push(`${rel(actionDecisionFile)} must not keep legacy rule-table abstraction`);
  }
  for (const forbidden of [
    "attackFacts",
    "infusionFacts",
    "channelFacts",
    "buffFacts",
    "buffPreparationFacts",
    "burstControlFacts",
    "bossImperilFacts",
    "debuffActionFacts",
    "allDebuffFacts",
    "singleDebuffFacts",
  ]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(actionDecisionText)) {
      violations.push(`${rel(actionDecisionFile)} must not assemble ${forbidden} directly`);
    }
  }
  for (const retired of [
    attackActionSequenceFile,
    buffActionSequenceFile,
    debuffActionSequenceFile,
    survivalActionSequenceFile,
  ]) {
    if (fs.existsSync(retired)) {
      violations.push(
        `${rel(retired)} must stay retired; phase actions belong in runBattleActionDecision`
      );
    }
  }
  if (fs.existsSync(legacyStepRunnerFile)) {
    violations.push("src/battle/step-runner.js legacy action runner must stay deleted");
  }
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      if (entry.name.endsWith(".test.js")) continue;
      const file = path.join(entry.parentPath, entry.name);
      const source = fs.readFileSync(file, "utf8");
      if (file !== actionDecisionFile && /from\s+["'][^"']*rules\/index\.js["']/.test(source)) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not rules/index.js`);
      }
      if (
        file !== actionDecisionFile &&
        /from\s+["'][^"']*battle-action-sequence\.js["']/.test(source)
      ) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not action sequence`);
      }
      if (/from\s+["'][^"']*battle-action-survival-sequence\.js["']/.test(source)) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not survival sequence`);
      }
      if (/from\s+["'][^"']*battle-action-buff-sequence\.js["']/.test(source)) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not buff sequence`);
      }
      if (/from\s+["'][^"']*battle-action-debuff-sequence\.js["']/.test(source)) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not debuff sequence`);
      }
      if (/from\s+["'][^"']*battle-action-attack-sequence\.js["']/.test(source)) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not attack sequence`);
      }
    }
  }
  for (const file of [battleFile, actionEventBridgeFile]) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes("runBattleTurnAutomation")) return;
      if (/\bmain\s*\(/.test(line)) {
        violations.push(
          `${rel(file)}:${index + 1} legacy main() call is forbidden; use runBattleTurnAutomation()`
        );
      }
    });
  }
  for (const file of [
    battleFile,
    actionLifecycleFile,
    pauseControlsFile,
    nextRoundContinuationFile,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      source.includes("runBattleTurnAutomation") &&
      !source.includes("BattleTurnWorkflowEvent.RUN_CURRENT_TURN")
    ) {
      violations.push(`${rel(file)} must call battle turn workflow through RUN_CURRENT_TURN event`);
    }
    if (/runBattleTurnAutomation\(\s*\)/.test(source)) {
      violations.push(`${rel(file)} must not call battle turn workflow without an event`);
    }
  }
}

function checkActionEventBridgeEntry() {
  if (fs.existsSync(legacyReloaderFile)) {
    violations.push("src/battle/reloader.js legacy action event bridge path must stay deleted");
  }
  const text = fs.readFileSync(actionEventBridgeFile, "utf8");
  if (!/export function runBattleActionEventBridgeAutomation\(/.test(text)) {
    violations.push(
      `${rel(actionEventBridgeFile)} must expose runBattleActionEventBridgeAutomation(event)`
    );
  }
  if (/\b(?:export\s+)?function\s+reloader\s*\(/.test(text)) {
    violations.push(
      `${rel(actionEventBridgeFile)} legacy reloader() bridge must stay deleted; use runBattleActionEventBridgeAutomation(event)`
    );
  }
  const battleText = fs.readFileSync(battleFile, "utf8");
  if (/\breloader\s*\(/.test(battleText)) {
    violations.push(
      `${rel(battleFile)} legacy reloader() call is forbidden; use runBattleActionEventBridgeAutomation(event)`
    );
  }
  if (
    /\bdelayAlert\b|\bdelayReload\b|BattleActionDelayEvent|AlarmEvent\.TRIGGER|NavigationEvent\.SCHEDULE_RELOAD/.test(
      text
    ) ||
    /\bclearTimeout\b/.test(text)
  ) {
    violations.push(
      `${rel(actionEventBridgeFile)} battle action delay timers belong in runBattleActionDelayAutomation(event)`
    );
  }
  if (
    /\bapi_call\b|\bapi_response\b|\bfakeApiCall\b|\bfakeApiResponse\b|sessionStorage\.delay\b|sessionStorage\.delay2\b|\.textContent\s*=/.test(
      text
    )
  ) {
    violations.push(
      `${rel(actionEventBridgeFile)} battle api script injection belongs in runBattleApiBridgeAutomation(event)`
    );
  }
  if (!text.includes("BattleApiBridgeEvent.INSTALL")) {
    violations.push(
      `${rel(actionEventBridgeFile)} must install battle api bridge through its entry`
    );
  }
  if (!text.includes("rejectUnknownActionEventBridgeEvent")) {
    violations.push(`${rel(actionEventBridgeFile)} must route unknown bridge events to lifecycle evidence`);
  }
  if (
    !text.includes(
      "battleActionEventBridgeEventHandlers[event?.type]?.(event) ?? rejectUnknownActionEventBridgeEvent(event)"
    )
  ) {
    violations.push(`${rel(actionEventBridgeFile)} must reject null bridge events without throwing`);
  }
  if (/\brunSpeed\b|\btimeNow\b|TimeEvent\.EPOCH_MS/.test(text)) {
    violations.push(
      `${rel(actionEventBridgeFile)} battle action speed belongs in runBattleActionSpeedAutomation(event)`
    );
  }
  if (
    /BattleCompletionEvent|BattleCompletionOutcome|BattleMonitorEvent\.COMPLETION_REACHED|RiddleEvent\.BATTLE_POST_RESULT|runBattleTurnAutomation|runBattleRoundStartAutomation|runMonsterStatusAutomation|unsafeWindow\.battle|#pane_completion|#btcp|#battle_right|#battle_left|window\.location\.href|post\(/.test(
      text
    )
  ) {
    violations.push(
      `${rel(actionEventBridgeFile)} battle action lifecycle belongs in runBattleActionLifecycleAutomation(event)`
    );
  }
  if (!text.includes("BattleActionLifecycleEvent.ACTION_ENDED")) {
    violations.push(
      `${rel(actionEventBridgeFile)} must report battle action end through lifecycle entry`
    );
  }
  if (/BattleMonitorEvent\.ACTION_STARTED|runBattleMonitorAutomation/.test(text)) {
    violations.push(
      `${rel(actionEventBridgeFile)} battle action lifecycle belongs in runBattleActionLifecycleAutomation(event)`
    );
  }
  if (!text.includes("BattleActionLifecycleEvent.ACTION_STARTED")) {
    violations.push(
      `${rel(actionEventBridgeFile)} must report battle action start through lifecycle entry`
    );
  }
  if (/from\s+["']\.\/battle-action-(?:start|end)\.js["']/.test(text)) {
    violations.push(`${rel(actionEventBridgeFile)} must not import split action lifecycle entries`);
  }
}

function checkActionDelayEntry() {
  const text = fs.readFileSync(actionDelayFile, "utf8");
  if (!/export const BattleActionDelayEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(actionDelayFile)} must expose BattleActionDelayEvent`);
  }
  if (!/export function runBattleActionDelayAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(actionDelayFile)} must expose runBattleActionDelayAutomation(event)`);
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(actionDelayFile)} must read action delay options through option entry`);
  }
  if (/OptionEvent\.READ\b/.test(text)) {
    violations.push(`${rel(actionDelayFile)} must not read the whole option bag`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(actionDelayFile)} must not read action delay options directly`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleActionDelayEvent\b|runBattleActionDelayAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(actionDelayFile)} may export only its event entry`);
  }
  if (!text.includes("activeDelayTimers")) {
    violations.push(`${rel(actionDelayFile)} must track action delay timers in one registry`);
  }
  for (const required of [
    "DELAY_ALERT_OPTION_KEY",
    "DELAY_ALERT_TIME_OPTION_KEY",
    "DELAY_RELOAD_OPTION_KEY",
    "DELAY_RELOAD_TIME_OPTION_KEY",
    "trackDelayTimer",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(actionDelayFile)} must own action delay contract ${required}`);
    }
  }
  if (/\bdelayAlertTimer\b|\bdelayReloadTimer\b/.test(text)) {
    violations.push(`${rel(actionDelayFile)} must not track action delay timers in parallel vars`);
  }
  if (!/for\s*\(\s*const\s+timer\s+of\s+activeDelayTimers\s*\)/.test(text)) {
    violations.push(`${rel(actionDelayFile)} must cancel action delay timers through one loop`);
  }
  const endActionDelayMatch = text.match(
    /function\s+endActionDelay\s*\([^)]*\)\s*\{(?<body>[\s\S]*?)\n\}/
  );
  if (!endActionDelayMatch) {
    violations.push(`${rel(actionDelayFile)} must own endActionDelay cleanup`);
  } else if (/\breadDelayOption\s*\(/.test(endActionDelayMatch.groups.body)) {
    violations.push(
      `${rel(actionDelayFile)} action-end cleanup must cancel registered timers, not reread option state`
    );
  }
  const files = [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    actionDelayFile,
    actionDelayTest,
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== actionEventBridgeFile &&
      file !== actionDelayFile &&
      file !== actionDelayTest &&
      /from\s+["']\.\/battle-action-delay\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle action delay`);
    }
  }
}

function checkApiBridgeEntry() {
  const text = fs.readFileSync(apiBridgeFile, "utf8");
  if (!/export const BattleApiBridgeEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(apiBridgeFile)} must expose BattleApiBridgeEvent`);
  }
  if (!/export function runBattleApiBridgeAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(apiBridgeFile)} must expose runBattleApiBridgeAutomation(event)`);
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(apiBridgeFile)} must read API bridge delay options through option entry`
    );
  }
  for (const required of ["readApiBridgeDelayOption", "writeApiBridgeDelayRuntime"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(apiBridgeFile)} must own ${required}`);
    }
  }
  if (
    !/Number\([^)]*readOptionField\(MAGIC_DELAY_SESSION_KEY,\s*0\)[^)]*\)\s*\|\|\s*0/.test(text)
  ) {
    violations.push(`${rel(apiBridgeFile)} must normalize delay before writing runtime state`);
  }
  if (
    !/Number\([^)]*readOptionField\(ACTION_DELAY_SESSION_KEY,\s*0\)[^)]*\)\s*\|\|\s*0/.test(text)
  ) {
    violations.push(`${rel(apiBridgeFile)} must normalize delay2 before writing runtime state`);
  }
  if (/OptionEvent\.READ\b/.test(text)) {
    violations.push(`${rel(apiBridgeFile)} must not read the whole option bag`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(apiBridgeFile)} must not read API bridge delay options directly`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleApiBridgeEvent\b|runBattleApiBridgeAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(apiBridgeFile)} may export only its event entry`);
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    apiBridgeFile,
    apiBridgeTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== actionEventBridgeFile &&
      file !== apiBridgeFile &&
      file !== apiBridgeTest &&
      /from\s+["']\.\/battle-api-bridge\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle api bridge`);
    }
  }
}

function checkActionSpeedEntry() {
  const text = fs.readFileSync(actionSpeedFile, "utf8");
  if (!/export const BattleActionSpeedEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(actionSpeedFile)} must expose BattleActionSpeedEvent`);
  }
  if (!/export function runBattleActionSpeedAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(actionSpeedFile)} must expose runBattleActionSpeedAutomation(event)`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleActionSpeedEvent\b|runBattleActionSpeedAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(actionSpeedFile)} may export only its event entry`);
  }
  if (!/const battleActionSpeedEventHandlers\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(actionSpeedFile)} must route events through one table`);
  }
  if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(text)) {
    violations.push(`${rel(actionSpeedFile)} must not route events through an if ladder`);
  }
  for (const required of [
    "DEFAULT_RUN_SPEED",
    "ACTION_TIMESTAMP_RUNTIME_KEY",
    "ACTION_SPEED_RUNTIME_KEY",
    "normalizeTimestamp",
    "formatRunSpeed",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(actionSpeedFile)} must internalize action speed invariants`);
    }
  }
  if (
    /deps\.read\(["'](?:timeNow|runSpeed)["']\)|deps\.write\(["'](?:timeNow|runSpeed)["']/.test(
      text
    )
  ) {
    violations.push(`${rel(actionSpeedFile)} must use runtime key constants for speed state`);
  }
  if ((text.match(/formatRunSpeed\(/g) || []).length < 4) {
    violations.push(`${rel(actionSpeedFile)} must normalize action speed writes and reads`);
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    actionSpeedFile,
    actionSpeedTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== battleFile &&
      file !== actionEventBridgeFile &&
      file !== actionSpeedFile &&
      file !== actionSpeedTest &&
      /from\s+["']\.\/battle-action-speed\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle action speed`);
    }
  }
}

function checkActionLifecycleEntry() {
  for (const legacy of [legacyActionEndFile, legacyActionStartFile]) {
    if (fs.existsSync(legacy)) {
      violations.push(`${rel(legacy)} legacy split action lifecycle entry must stay deleted`);
    }
  }
  const text = fs.readFileSync(actionLifecycleFile, "utf8");
  if (!/export const BattleActionLifecycleEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(actionLifecycleFile)} must expose BattleActionLifecycleEvent`);
  }
  if (!/export function runBattleActionLifecycleAutomation\(\s*event\b/.test(text)) {
    violations.push(
      `${rel(actionLifecycleFile)} must expose runBattleActionLifecycleAutomation(event)`
    );
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleActionLifecycleEvent\b|runBattleActionLifecycleAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(actionLifecycleFile)} may export only its event entry`);
  }
  for (const required of [
    "battleActionLifecycleEventHandlers",
    "BattleActionDelayEvent.ACTION_STARTED",
    "BattleMonitorEvent.ACTION_STARTED",
    "BattleActionSpeedEvent.ACTION_ENDED",
    "BattleActionDelayEvent.ACTION_ENDED",
    "MonsterStatusEvent.REFRESH_COMBATANT_COUNTS",
    "BattleMonitorEvent.ACTION_ENDED",
    "BattleCompletionEvent.COMPLETION_REACHED",
    "BattleCompletionEvent.READ_REACHED",
    "OUTCOME_NEXT_ROUND",
    "OUTCOME_ONGOING",
    "BattleNextRoundContinuationEvent.CONTINUE",
    "runBattleNextRoundContinuation",
    "continueNextRoundStep",
    "continuationStarted",
    "runBattleTurnAutomation",
    "BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE",
    "runBattleActionLifecycleEvidence",
    "EVENT_UNKNOWN_ACTION_LIFECYCLE",
    "OUTCOME_REJECTED",
    "rejectUnknownActionLifecycleEvent",
    "unknownActionLifecycleEvent",
    "recordLifecycleSafely",
    'step: "routeEvent"',
    "recordStep(steps, \"startDelay\", deps.startDelay)",
    "recordStep(steps, \"monitorActionStarted\", deps.monitorActionStarted)",
    "recordStep(steps, \"recordSpeed\", deps.recordSpeed)",
    "recordStep(steps, \"endDelay\", deps.endDelay)",
    "recordStep(steps, \"refreshCombatants\", deps.refreshCombatants)",
    "recordStep(steps, \"monitorActionEnded\", deps.monitorActionEnded)",
    "REASON_ACTION_LIFECYCLE_STEP_THROW",
    "rejectedLifecycleResult",
    "completeBattleStep",
    "result === undefined ? true : result",
    "const started = steps.every((step) => step.result)",
    "recordStep(steps, \"isCompletionReached\", deps.isCompletionReached)",
    "steps[steps.length - 1].continued = continued",
    "recordStep(steps, \"runTurn\", deps.runTurn)",
    "const turnStarted = Boolean(recordStep(steps, \"runTurn\", deps.runTurn))",
    "continuationStarted: turnStarted",
    "recordLifecycleSafely(deps, EVENT_ACTION_STARTED, started, steps)",
    "recordLifecycleSafely(deps, EVENT_ACTION_ENDED, result, steps)",
  ]) {
    if (!text.includes(required)) {
      violations.push(
        `${rel(actionLifecycleFile)} must make ${required} visible in action lifecycle entry`
      );
    }
  }
  const entryBody =
    text.match(/export function runBattleActionLifecycleAutomation\([^)]*\) \{[\s\S]*?\n\}/)
      ?.[0] || "";
  if (
    !/Object\.freeze\(\{[\s\S]*\[EVENT_ACTION_STARTED\][\s\S]*\[EVENT_ACTION_ENDED\]/.test(text)
  ) {
    violations.push(
      `${rel(actionLifecycleFile)} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(actionLifecycleFile)} entry must dispatch by handler table`);
  }
  if (
    !text.includes(
      "battleActionLifecycleEventHandlers[event?.type]?.(deps) ?? rejectUnknownActionLifecycleEvent(event, deps)"
    )
  ) {
    violations.push(`${rel(actionLifecycleFile)} must record lifecycle evidence for unknown events`);
  }
  const recordingText = fs.readFileSync(actionLifecycleRecordingFile, "utf8");
  for (const required of [
    "recordLifecycleSafely",
    "REASON_LIFECYCLE_EVIDENCE_WRITE_FAILED",
    'step: "recordLifecycle"',
    "lifecycleEvidenceWriteFailed",
    "deps.recordLifecycle?.(phase, result, steps)",
  ]) {
    if (!recordingText.includes(required)) {
      violations.push(`${rel(actionLifecycleRecordingFile)} must own safe lifecycle recording ${required}`);
    }
  }
  const lifecycleTestText = fs.readFileSync(actionLifecycleTest, "utf8");
  for (const required of [
    "records failed action start steps without claiming action start succeeded",
    "continuationStarted: true",
  ]) {
    if (!lifecycleTestText.includes(required)) {
      violations.push(`${rel(actionLifecycleTest)} must cover ${required}`);
    }
  }
  const lifecycleStepResultTestText = fs.readFileSync(
    path.join(root, "src/battle/battle-action-lifecycle-step-result.test.js"),
    "utf8"
  );
  if (!lifecycleStepResultTestText.includes("continuationStarted: false")) {
    violations.push("src/battle/battle-action-lifecycle-step-result.test.js must cover continuationStarted: false");
  }
  const lifecycleExceptionTestText = fs.readFileSync(
    path.join(root, "src/battle/battle-action-lifecycle-exception.test.js"),
    "utf8"
  );
  for (const required of [
    "records action-start step exceptions without throwing",
    "records completion check exceptions as rejected lifecycle results",
    "records completeBattle exceptions as rejected lifecycle results",
    "keeps action-ended result when lifecycle evidence recording fails once",
    "keeps action-started accepted when lifecycle evidence recording keeps failing",
    "expect(result).toBe(true)",
    "actionLifecycleStepThrew",
    "lifecycleEvidenceWriteFailed",
  ]) {
    if (!lifecycleExceptionTestText.includes(required)) {
      violations.push("src/battle/battle-action-lifecycle-exception.test.js must cover " + required);
    }
  }
  const evidenceText = fs.readFileSync(actionLifecycleEvidenceFile, "utf8");
  for (const required of [
    "BattleActionLifecycleEvidenceEvent",
    "RECORD_LIFECYCLE",
    "runBattleActionLifecycleEvidence",
    "DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE",
    "ACTION_LIFECYCLE_EVIDENCE_KEY",
    "steps: event.steps",
    "[HVAA] battle action lifecycle",
  ]) {
    if (!evidenceText.includes(required)) {
      violations.push(`${rel(actionLifecycleEvidenceFile)} must own lifecycle evidence ${required}`);
    }
  }
  const evidenceTestText = fs.existsSync(actionLifecycleEvidenceTestFile)
    ? fs.readFileSync(actionLifecycleEvidenceTestFile, "utf8")
    : "";
  for (const required of [
    "records action lifecycle phase and result for diagnostics",
    "rejects unknown lifecycle evidence events",
  ]) {
    if (!evidenceTestText.includes(required)) {
      violations.push(`${rel(actionLifecycleEvidenceTestFile)} must cover ${required}`);
    }
  }
  const actionLifecycleTestText = fs.existsSync(actionLifecycleTest)
    ? fs.readFileSync(actionLifecycleTest, "utf8")
    : "";
  for (const required of [
    "rejects unknown events with structured lifecycle evidence",
    "rejects null events with structured lifecycle evidence instead of throwing",
    "unknownActionLifecycleEvent",
  ]) {
    if (!actionLifecycleTestText.includes(required)) {
      violations.push(`${rel(actionLifecycleTest)} must cover ${required}`);
    }
  }
  if (/BattleMonitorEvent\.COMPLETION_REACHED/.test(text)) {
    violations.push(
      `${rel(actionLifecycleFile)} completion recording belongs in runBattleCompletionAutomation(event)`
    );
  }
  if (/#btcp|gE\(/.test(text)) {
    violations.push(
      `${rel(actionLifecycleFile)} completion reachability belongs in runBattleCompletionAutomation(event)`
    );
  }
  if (
    /RiddleEvent\.BATTLE_POST_RESULT|BattleRoundStartEvent\.ROUND_STARTED|runBattleRoundStartAutomation|unsafeWindow\.battle|#pane_completion|#battle_right|#battle_left|post\(/.test(
      text
    )
  ) {
    violations.push(`${rel(actionLifecycleFile)} must not own next-round continuation IO`);
  }
  const actionLifecycleStepResultTest = path.join(
    root,
    "src/battle/battle-action-lifecycle-step-result.test.js"
  );
  const actionLifecycleStepResultTestText = fs.existsSync(actionLifecycleStepResultTest)
    ? fs.readFileSync(actionLifecycleStepResultTest, "utf8")
    : "";
  for (const required of [
    "records actual lifecycle step results when a dependency reports false",
    "refreshCombatants",
    "runTurn",
    "result: false",
  ]) {
    if (!actionLifecycleStepResultTestText.includes(required)) {
      violations.push(`${rel(actionLifecycleStepResultTest)} must cover ${required}`);
    }
  }
  const actionLifecycleContinuationTest = path.join(
    root,
    "src/battle/battle-action-lifecycle-continuation.test.js"
  );
  const actionLifecycleContinuationTestText = fs.existsSync(actionLifecycleContinuationTest)
    ? fs.readFileSync(actionLifecycleContinuationTest, "utf8")
    : "";
  for (const required of [
    "records when next-round continuation starts",
    "records failed next-round continuation start without claiming it succeeded",
    "continuationStarted: true",
    "continuationStarted: false",
    "result: false, continued: \"nextRound\"",
  ]) {
    if (!actionLifecycleContinuationTestText.includes(required)) {
      violations.push(`${rel(actionLifecycleContinuationTest)} must cover ${required}`);
    }
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    actionLifecycleFile,
    actionLifecycleTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== actionEventBridgeFile &&
      file !== actionLifecycleFile &&
      file !== actionLifecycleTest &&
      /from\s+["']\.\/battle-action-lifecycle\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle action lifecycle workflow`);
    }
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/from\s+["']\.\/battle-action-(?:start|end)\.js["']/.test(line)) {
      violations.push(
        `${rel(actionLifecycleFile)}:${index + 1} must not import split action lifecycle entries`
      );
    }
  });
}

function checkPauseControlsEntry() {
  const text = fs.readFileSync(pauseControlsFile, "utf8");
  if (!/export const BattlePauseControlsEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(pauseControlsFile)} must expose BattlePauseControlsEvent`);
  }
  if (!/export function runBattlePauseControlsAutomation\(\s*event\b/.test(text)) {
    violations.push(
      `${rel(pauseControlsFile)} must expose runBattlePauseControlsAutomation(event)`
    );
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(pauseControlsFile)} must read pause control options through option entry`
    );
  }
  if (/OptionEvent\.READ\b/.test(text)) {
    violations.push(`${rel(pauseControlsFile)} must not read the whole option bag`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(pauseControlsFile)} must not read pause control options directly`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattlePauseControlsEvent\b|runBattlePauseControlsAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(pauseControlsFile)} may export only its event entry`);
  }
  for (const required of [
    "battlePauseControlsEventHandlers",
    "BattlePauseEvent.TOGGLE",
    "runBattleTurnAutomation",
    "PAUSE_BUTTON_OPTION_KEY",
    "PAUSE_HOTKEY_OPTION_KEY",
    "PAUSE_HOTKEY_KEY_OPTION_KEY",
    "DEFAULT_PAUSE_HOTKEY_KEY",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(pauseControlsFile)} must own ${required}`);
    }
  }
  const entryBody =
    text.match(/export function runBattlePauseControlsAutomation\([^)]*\) \{[\s\S]*?\n\}/)
      ?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_INSTALL\]/.test(text)) {
    violations.push(`${rel(pauseControlsFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(pauseControlsFile)} entry must dispatch by handler table`);
  }
  for (const direct of [
    /readOptionField\(["']pauseButton["']/,
    /readOptionField\(["']pauseHotkey["']/,
    /readOptionField\(["']pauseHotkeyKey["']/,
  ]) {
    if (direct.test(text)) {
      violations.push(`${rel(pauseControlsFile)} must use pause option key constants`);
    }
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    pauseControlsFile,
    pauseControlsTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== battleFile &&
      file !== pauseControlsFile &&
      file !== pauseControlsTest &&
      /from\s+["']\.\/battle-pause-controls\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle pause controls`);
    }
  }
}

function checkStartRuntimeEntry() {
  const text = fs.readFileSync(startRuntimeFile, "utf8");
  if (!/export const BattleStartRuntimeEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must expose BattleStartRuntimeEvent`);
  }
  if (!/export function runBattleStartRuntimeAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must expose runBattleStartRuntimeAutomation(event)`);
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(startRuntimeFile)} must read start runtime options through option entry`
    );
  }
  for (const required of [
    "ATTACK_STATUS_RUNTIME_KEY",
    "ATTACK_STATUS_OPTION_KEY",
    "DEFAULT_ATTACK_STATUS",
    "normalizeAttackStatus",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(startRuntimeFile)} must internalize attackStatus invariants`);
    }
  }
  if (!/readOptionField\(ATTACK_STATUS_OPTION_KEY,\s*DEFAULT_ATTACK_STATUS\)/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must read attackStatus with an explicit fallback`);
  }
  for (const direct of [
    /deps\.read\(["']attackStatus["']\)/,
    /deps\.write\(["']attackStatus["']/,
    /readOptionField\(["']attackStatus["']/,
  ]) {
    if (direct.test(text)) {
      violations.push(`${rel(startRuntimeFile)} must use attackStatus key constants`);
    }
  }
  if ((text.match(/normalizeAttackStatus\(/g) || []).length < 3) {
    violations.push(`${rel(startRuntimeFile)} must normalize attackStatus on write and read`);
  }
  if (/OptionEvent\.READ\b/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must not read the whole option bag`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must not read start runtime options directly`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleStartRuntimeEvent\b|runBattleStartRuntimeAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(startRuntimeFile)} may export only its event entry`);
  }
  if (!/const battleStartRuntimeEventHandlers\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must route events through one table`);
  }
  if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(text)) {
    violations.push(`${rel(startRuntimeFile)} must not route events through an if ladder`);
  }
  for (const required of ["attackStatus", "BattleActionSpeedEvent.BATTLE_STARTED"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(startRuntimeFile)} must own ${required}`);
    }
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    startRuntimeFile,
    startRuntimeTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== battleFile &&
      file !== startRuntimeFile &&
      file !== startRuntimeTest &&
      /from\s+["']\.\/battle-start-runtime\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle start runtime`);
    }
  }
}

function checkPhysicalSkillRanking() {
  if (fs.existsSync(utilityEngineFile)) {
    violations.push(
      `${rel(utilityEngineFile)} legacy top-level utility engine must stay deleted; physical ranking belongs in attack`
    );
  }
  const text = fs.readFileSync(physicalSkillRankingFile, "utf8");
  if (/OptionEvent|runOptionAutomation/.test(text)) {
    violations.push(
      `${rel(physicalSkillRankingFile)} must not read options; attack entry passes ranking debug facts`
    );
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(
      `${rel(physicalSkillRankingFile)} must not read ranking debug options directly`
    );
  }
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const file = path.join(entry.parentPath, entry.name);
      const source = fs.readFileSync(file, "utf8");
      if (/from\s+["'][^"']*utility-engine\.js["']/.test(source)) {
        violations.push(`${rel(file)} must not import legacy utility-engine.js`);
      }
      if (
        ![attackPlanFile, physicalSkillScoringFile, physicalSkillRankingTest].includes(file) &&
        /from\s+["'][^"']*physical-skill-ranking\.js["']/.test(source)
      ) {
        violations.push(`${rel(file)} must not bypass attack physical skill ranking owners`);
      }
    }
  }
}

function checkPhysicalSkillBookkeeping() {
  const text = fs.readFileSync(physicalSkillBookkeepingFile, "utf8");
  for (const required of [
    "PhysicalSkillBookkeepingEvent",
    "runPhysicalSkillBookkeeping",
    "physicalSkillBookkeepingEventHandlers",
    "[EVENT_RECORD_FIRE]: recordPhysicalSkillFire",
    "BattleSkillUsageEvent.RECORD_USE",
    "CdRuntimeEvent.RECORD_FIRE",
    "CdLearningEvent.RECORD_FIRE",
    "BigSkillKillLearningEvent.RECORD_CAST",
    "event.observedBosses",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(physicalSkillBookkeepingFile)} must own physical fire ${required}`);
    }
  }
  const bookkeepingEntryBody =
    text.match(/export function runPhysicalSkillBookkeeping\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/event\.type\s*!==|event\.type\s*===/.test(bookkeepingEntryBody)) {
    violations.push(`${rel(physicalSkillBookkeepingFile)} entry must dispatch by handler table`);
  }
  if (!text.includes("physicalSkillBookkeepingEventHandlers[event?.type]")) {
    violations.push(`${rel(physicalSkillBookkeepingFile)} must reject null physical fire bookkeeping events`);
  }
  if (!text.includes("return true;") || !bookkeepingEntryBody.includes("?? false")) {
    violations.push(`${rel(physicalSkillBookkeepingFile)} must report whether physical fire bookkeeping was recorded`);
  }
  const bookkeepingTestText = fs.readFileSync(
    path.join(root, "src/battle/attack/physical-skill-bookkeeping.test.js"),
    "utf8"
  );
  if (
    !bookkeepingTestText.includes(
      "rejects unknown physical skill bookkeeping events without side effects"
    )
  ) {
    violations.push(`${rel(physicalSkillBookkeepingFile)} tests must cover unknown bookkeeping events`);
  }
  if (!bookkeepingTestText.includes("runPhysicalSkillBookkeeping(null)")) {
    violations.push(`${rel(physicalSkillBookkeepingFile)} tests must cover null bookkeeping events`);
  }
  if (/\bevent\.snap\b/.test(text)) {
    violations.push(
      `${rel(physicalSkillBookkeepingFile)} must consume observedBosses, not snap, for physical fire bookkeeping`
    );
  }
  const executeText = fs.readFileSync(
    path.join(root, "src/battle/attack/execute-attack.js"),
    "utf8"
  );
  for (const required of [
    "ATTACK_PLAN_EXECUTORS",
    "noop: executeNoopPlan",
    "focus: executeFocusPlan",
    '"toggle-spirit": executeToggleSpiritPlan',
    "spell: executeSpellPlan",
    '"merciful-single": executeMercifulSinglePlan',
    "physical: executePhysicalPlan",
    "default: executeDefaultPlan",
  ]) {
    if (!executeText.includes(required)) {
      violations.push(`src/battle/attack/execute-attack.js must lock attack executor ${required}`);
    }
  }
  const applyPlanBody =
    executeText.match(/function applyAttackPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/switch\s*\(\s*plan\.type\s*\)/.test(applyPlanBody)) {
    violations.push(
      "src/battle/attack/execute-attack.js must dispatch attack plans by ATTACK_PLAN_EXECUTORS"
    );
  }
  for (const legacy of [
    "runBattleSkillUsageAutomation",
    "runCdRuntimeAutomation",
    "runCdLearningAutomation",
    "runBigSkillKillLearningAutomation",
  ]) {
    if (executeText.includes(legacy)) {
      violations.push(
        `src/battle/attack/execute-attack.js must report physical skill fire through runPhysicalSkillBookkeeping`
      );
    }
  }
  for (const call of executeText.matchAll(/runPhysicalSkillBookkeeping\(\s*\{[\s\S]*?\}\s*\)/g)) {
    if (/\bsnap\s*:/.test(call[0])) {
      violations.push(
        `src/battle/attack/execute-attack.js must pass observedBosses, not snap, to physical skill bookkeeping`
      );
    }
  }
}

function checkActivateSpirit() {
  const text = fs.readFileSync(activateSpiritFile, "utf8");
  for (const required of [
    "BattlePreCastSpiritEvent",
    "battlePreCastSpiritEventHandlers",
    "runBattlePreCastSpiritAutomation",
    "ACTIVATE_IF_ALLOWED",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(activateSpiritFile)} must own ${required}`);
    }
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(activateSpiritFile)} must read pre-cast Spirit options through option entry`
    );
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(activateSpiritFile)} must not read pre-cast Spirit options directly`);
  }
  if (/export function checkAndActivateSpirit\(/.test(text)) {
    violations.push(`${rel(activateSpiritFile)} legacy checkAndActivateSpirit export must stay retired`);
  }
}

function checkExecuteItem() {
  const text = fs.readFileSync(executeItemFile, "utf8");
  for (const required of [
    "ITEM_PLAN_EXECUTORS",
    "STALL_ATTEMPT_EXECUTORS",
    "noop: executeNoopPlan",
    "gem: executeGemPlan",
    "potion: executePotionPlan",
    "stall: executeStallPlan",
    "scroll: executeScrollPlan",
    '"spirit-off": executeStallSpiritOffAttempt',
    "focus: executeStallFocusAttempt",
    "draught: executeStallDraughtAttempt",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(executeItemFile)} must lock item execution step ${required}`);
    }
  }
  const applyPlanBody = text.match(/function applyItemPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/switch\s*\(\s*plan\.type\s*\)/.test(applyPlanBody)) {
    violations.push(`${rel(executeItemFile)} must dispatch item plans by ITEM_PLAN_EXECUTORS`);
  }
  if (!text.includes("AutoTuneEvent.RECORD_POTION_USE")) {
    violations.push(
      `${rel(executeItemFile)} must report potion-use bookkeeping through auto-tune entry`
    );
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(executeItemFile)} must not read item execution options directly`);
  }
}

function checkSnapshot() {
  const text = fs.readFileSync(snapshotFile, "utf8");
  const turnContextText = fs.readFileSync(turnContextFile, "utf8");
  if (!text.includes("learnIncomingBurst")) {
    violations.push(`${rel(snapshotFile)} must receive burst learning decision from turn context`);
  }
  if (
    !text.includes("BattleObservationLearningEvent.FINALIZE_TURN_OBSERVATIONS") ||
    !text.includes("runBattleObservationLearning")
  ) {
    violations.push(`${rel(snapshotFile)} must finalize observations through one learning entry`);
  }
  for (const forbidden of [
    "runRecoveryLearningAutomation",
    "runCdLearningAutomation",
    "runBigSkillKillLearningAutomation",
    "runIncomingBurstLearningAutomation",
  ]) {
    if (text.includes(forbidden)) {
      violations.push(`${rel(snapshotFile)} must not bypass observation learning via ${forbidden}`);
    }
  }
  const observationText = fs.readFileSync(observationLearningFile, "utf8");
  for (const required of [
    "RecoveryLearningEvent.FINALIZE_PENDING",
    "CdLearningEvent.FINALIZE_PENDING",
    "BigSkillKillLearningEvent.FINALIZE_PENDING",
    "IncomingBurstLearningEvent.RECORD_EVENTS",
  ]) {
    if (!observationText.includes(required)) {
      violations.push(`${rel(observationLearningFile)} must own ${required}`);
    }
  }
  if (/OptionEvent|runOptionAutomation|burstControlSwitch/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read battle action options directly`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read snapshot option facts directly`);
  }
  if (/BattleStartRuntimeEvent\.READ_ATTACK_STATUS|runBattleStartRuntimeAutomation/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not attach turn runtime facts`);
  }
  if (!turnContextText.includes("BattleDecisionRuntimeEvent.READ_CURRENT")) {
    violations.push(`${rel(turnContextFile)} must attach decision runtime through one entry`);
  }
  if (/\bg\(\s*["']attackStatus["']/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read attackStatus directly`);
  }
  if (!text.includes("AbilityAoeEvent.READ_SPELL_AOE")) {
    violations.push(`${rel(snapshotFile)} must read spellAoe through ability AoE entry`);
  }
  if (/\bg\(\s*["']spellAoe["']/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read spellAoe directly`);
  }
  if (!text.includes("BattleSkillUsageEvent.READ_USAGE")) {
    violations.push(`${rel(snapshotFile)} must read skillOTOS through battle skill usage entry`);
  }
  if (
    !text.includes("BattleSkillReadinessEvent.READ_READY_MAP") ||
    !text.includes("runBattleSkillReadiness")
  ) {
    violations.push(
      `${rel(snapshotFile)} must read skillReady through battle skill readiness entry`
    );
  }
  if (/document\.getElementById|style\.opacity !== ["']0\.5["']|BATTLE_SKILL_IDS/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not own skill readiness DOM rules`);
  }
  const skillReadinessText = fs.readFileSync(skillReadinessFile, "utf8");
  for (const required of [
    "BattleSkillReadinessEvent",
    "BATTLE_SKILL_IDS",
    "document.getElementById",
  ]) {
    if (!skillReadinessText.includes(required)) {
      violations.push(`${rel(skillReadinessFile)} must own ${required}`);
    }
  }
  if (
    !text.includes("BattlePlayerVitalsEvent.READ_CURRENT") ||
    !text.includes("runBattlePlayerVitals")
  ) {
    violations.push(`${rel(snapshotFile)} must read player vitals through one entry`);
  }
  if (/#vbh|#dvbh|#dvrhd|#dvrm|#dvrs|readPlayerVitals/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not own player vitals DOM rules`);
  }
  const playerVitalsText = fs.readFileSync(playerVitalsFile, "utf8");
  for (const required of [
    "BattlePlayerVitalsEvent",
    "MIRROR_RUNTIME",
    "hpAbs",
    "mpAbs",
    "spAbs",
    "hpDeficit",
  ]) {
    if (!playerVitalsText.includes(required)) {
      violations.push(`${rel(playerVitalsFile)} must own ${required}`);
    }
  }
  if (
    !text.includes("BattlePlayerEffectsEvent.READ_CURRENT") ||
    !text.includes("runBattlePlayerEffects")
  ) {
    violations.push(`${rel(snapshotFile)} must read player effects through one entry`);
  }
  if (/#pane_effects|etherTapActiveX2:\s*!!gE|playerBuffs:\s*playerEffects\.map/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not own player effect DOM rules`);
  }
  const playerEffectsText = fs.readFileSync(playerEffectsFile, "utf8");
  for (const required of ["BattlePlayerEffectsEvent", "playerBuffs", "channeling"]) {
    if (!playerEffectsText.includes(required)) {
      violations.push(`${rel(playerEffectsFile)} must own ${required}`);
    }
  }
  if (
    !text.includes("BattleItemSurfaceEvent.READ_GEM_NAME") ||
    !text.includes("runBattleItemSurface")
  ) {
    violations.push(`${rel(snapshotFile)} must read gemName through one item surface entry`);
  }
  if (/#ikey_p|gemName:\s*gE/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not own item surface DOM reads`);
  }
  const itemSurfaceText = fs.readFileSync(itemSurfaceFile, "utf8");
  for (const required of ["BattleItemSurfaceEvent", "READ_GEM_NAME", "#ikey_p"]) {
    if (!itemSurfaceText.includes(required)) {
      violations.push(`${rel(itemSurfaceFile)} must own ${required}`);
    }
  }
  if (
    !text.includes("BattleMonsterSurfaceEvent.READ_CURRENT") ||
    !text.includes("runBattleMonsterSurface")
  ) {
    violations.push(`${rel(snapshotFile)} must read monsters through battle monster surface entry`);
  }
  if (/readMonsters|readMonsterBuffs|div\.btm1|\.btm5|\.btm6|nbargreen|nbardead/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not own monster surface DOM reads`);
  }
  const monsterSurfaceText = fs.readFileSync(monsterSurfaceFile, "utf8");
  for (const required of ["BattleMonsterSurfaceEvent", "READ_CURRENT", 'gE("div.btm1", "all")']) {
    if (!monsterSurfaceText.includes(required)) {
      violations.push(`${rel(monsterSurfaceFile)} must own ${required}`);
    }
  }
  if (
    !text.includes("BattleLogTelemetryEvent.READ_CURRENT") ||
    !text.includes("runBattleLogTelemetry")
  ) {
    violations.push(`${rel(snapshotFile)} must read battle log telemetry through one entry`);
  }
  if (/parseBattleLog|estimatePlayerIncomingDps|estimatePerMonsterDps/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not assemble battle log telemetry directly`);
  }
  const logTelemetryText = fs.readFileSync(logTelemetryFile, "utf8");
  for (const required of [
    "BattleLogTelemetryEvent",
    "BattleLogParserEvent.PARSE_CURRENT_LOG",
    "BattleLogParserEvent.ESTIMATE_PLAYER_INCOMING_DPS",
    "BattleLogParserEvent.ESTIMATE_PER_MONSTER_DPS",
    "runBattleLogParser",
  ]) {
    if (!logTelemetryText.includes(required)) {
      violations.push(`${rel(logTelemetryFile)} must own ${required}`);
    }
  }
  if (
    !text.includes("BattleSpiritToggleEvent.READ_ACTIVE") ||
    !text.includes("runBattleSpiritToggleAutomation")
  ) {
    violations.push(
      `${rel(snapshotFile)} must read Spirit active state through battle spirit entry`
    );
  }
  if (/#ckey_spirit|isSpiritActive/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not own Spirit active DOM reads`);
  }
  if (/\bg\(\s*["']skillOTOS["']/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read skillOTOS directly`);
  }
  if (!text.includes("BattleMonsterViewEvent.READ_VIEW")) {
    violations.push(
      `${rel(snapshotFile)} must read unified monster view through battle monster view entry`
    );
  }
  if (/MonsterStatusEvent\.READ_STATUS|MonsterCacheEvent\.READ_DB|joinMonsterView/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not assemble monster status/cache/view directly`);
  }
  if (/monsterHpVars|\.filter\(\s*\(?\w+\)?\s*=>\s*!\w+\.isDead/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not derive monster view summary directly`);
  }
  if (/\bmonsterStatus\b/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not pass full monsterStatus downstream`);
  }
  if (/\bg\(\s*["']monsterStatus["']/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read monsterStatus directly`);
  }
}

function checkBattleRulesRuntimeContext() {
  const text = readBattleActionRulesText();
  if (/\bwhen\s*:/.test(text)) {
    violations.push(
      `${rel(battleRulesFile)} must not define action step gates; business gates belong in decide entries`
    );
  }
  for (const legacy of ["readRuleRuntimeContext", "isStallingForRules", "hasMissingDebuff"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(text)) {
      violations.push(`${rel(battleRulesFile)} must not own all-debuff runtime gate helpers`);
    }
  }
  if (text.includes("runBattleDebuffCoverageAutomation")) {
    violations.push(`${rel(battleRulesFile)} all-debuff coverage belongs in decideCastDebuffOnAll`);
  }
  if (/\.filter\(\s*\(?\w+\)?\s*=>\s*\w+\.buffs/.test(text)) {
    violations.push(`${rel(battleRulesFile)} must not assemble debuff coverage from monster buffs`);
  }
  if (/\bg\(\s*["'](?:roundNow|roundAll|roundType|monsterAlive)["']/.test(text)) {
    violations.push(
      `${rel(battleRulesFile)} action decision must read runtime fields through turn context`
    );
  }
  const allowedRuleChainImporters = new Set([actionDecisionFile]);
  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== battleRulesFile &&
      /from\s+["'][^"']*rules\/index\.js["']/.test(source) &&
      !allowedRuleChainImporters.has(file)
    ) {
      violations.push(`${rel(file)} must use runBattleActionDecision(), not BATTLE_RULES`);
    }
    if (
      /from\s+["'][^"']*step-runner\.js["']/.test(source) &&
      !allowedRuleChainImporters.has(file)
    ) {
      violations.push(`${rel(file)} must use runBattleActionDecision(), not runRules`);
    }
  }
}

function checkBattleDebuffCoverage() {
  const text = fs.readFileSync(debuffCoverageFile, "utf8");
  for (const required of [
    "BattleDebuffCoverageEvent",
    "battleDebuffCoverageEventHandlers",
    "runBattleDebuffCoverageAutomation",
    "HAS_MISSING_DEBUFF",
    "event.monsterBuffs",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(debuffCoverageFile)} must own ${required}`);
    }
  }
  if (/\bevent\.snap\b|\bsnap\?\.view\b|\bsnap\.view\b/.test(text)) {
    violations.push(`${rel(debuffCoverageFile)} must consume monsterBuffs, not snap`);
  }
  const entryBody =
    text.match(/export function runBattleDebuffCoverageAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_HAS_MISSING_DEBUFF\]/.test(text)) {
    violations.push(`${rel(debuffCoverageFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(debuffCoverageFile)} entry must dispatch by handler table`);
  }
  if (/battleDebuffCoverageEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(`${rel(debuffCoverageFile)} entry must fail closed for invalid debuff coverage events`);
  }
  if (!/battleDebuffCoverageEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(`${rel(debuffCoverageFile)} entry must dispatch invalid debuff coverage events through optional type`);
  }
  const debuffCoverageTest = path.join(root, "src/battle/battle-debuff-coverage.test.js");
  const testText = fs.readFileSync(debuffCoverageTest, "utf8");
  if (!testText.includes("rejects invalid debuff coverage events")) {
    violations.push(`${rel(debuffCoverageTest)} must cover invalid debuff coverage events`);
  }
  if (!/runBattleDebuffCoverageAutomation\(null\)/.test(testText)) {
    violations.push(`${rel(debuffCoverageTest)} must cover null debuff coverage events`);
  }
  const castAllText = fs.readFileSync(decideCastAllFile, "utf8");
  for (const call of castAllText.matchAll(
    /runBattleDebuffCoverageAutomation\(\s*\{[\s\S]*?\}\s*\)/g
  )) {
    if (/\bsnap\s*:/.test(call[0])) {
      violations.push(
        `${rel(decideCastAllFile)} must pass monsterBuffs, not snap, to debuff coverage`
      );
    }
  }
}

function checkBossImperilEntry() {
  if (fs.existsSync(legacyBossImperilFile)) {
    violations.push(
      `${rel(legacyBossImperilFile)} must stay retired; boss Imperil belongs in debuff`
    );
  }
  const ownerText = fs.readFileSync(bossImperilFile, "utf8");
  for (const required of ["BossImperilEvent", "runBossImperilAutomation", "CAN_CAST", "DECIDE"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bossImperilFile)} must own ${required}`);
    }
  }
  if (/export\s+function\s+decideBossImperil\s*\(/.test(ownerText)) {
    violations.push(`${rel(bossImperilFile)} legacy decideBossImperil export must stay private`);
  }
  for (const required of [
    "event?.monsterFacts",
    "event?.imperilSkillReady",
    "event?.imperilAoe",
    "event?.stallActive",
    "event?.skipImperilForBigSkill",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bossImperilFile)} must consume ${required}`);
    }
  }
  if (/runBigSkillDebuffAutomation|BigSkillDebuffEvent/.test(ownerText)) {
    violations.push(`${rel(bossImperilFile)} must consume offensive debuff skip rulings`);
  }
  if (
    /runBigSkillKillLearningAutomation|BigSkillKillLearningEvent|WILL_KILL_BOSS/.test(ownerText)
  ) {
    violations.push(`${rel(bossImperilFile)} must not call big-skill kill learner directly`);
  }
  if (/\bevent\.snap\b/.test(ownerText)) {
    violations.push(`${rel(bossImperilFile)} must not consume snap-shaped event input`);
  }
  const rulesText = readBattleActionRulesText();
  const offensiveDebuffText = fs.existsSync(decideOffensiveDebuffFile)
    ? fs.readFileSync(decideOffensiveDebuffFile, "utf8")
    : "";
  if (
    !rulesText.includes("runBossImperilAutomation") &&
    !offensiveDebuffText.includes("runBossImperilAutomation")
  ) {
    violations.push(
      `${rel(decideOffensiveDebuffFile)} must read boss Imperil decisions through their entry`
    );
  }
  for (const call of rulesText.matchAll(/runBossImperilAutomation\s*\(\s*\{[\s\S]*?\}\s*\)/g)) {
    if (/\bsnap\s*:/.test(call[0])) {
      violations.push(`${rel(battleRulesFile)} must pass narrow facts, not snap, to boss Imperil`);
    }
  }
  const bossRule =
    rulesText.match(/name:\s*["']bossImperil["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  for (const legacy of ["BossImperilEvent", "CAN_CAST", "debuffSkillSwitch", "skillReady"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(bossRule)) {
      violations.push(`${rel(battleRulesFile)} must not assemble boss Imperil gates directly`);
    }
  }
  for (const legacy of [
    "runBigSkillKillLearningAutomation",
    "BigSkillKillLearningEvent",
    "WILL_KILL_BOSS",
  ]) {
    if (rulesText.includes(legacy)) {
      violations.push(
        `${rel(battleRulesFile)} must not assemble boss Imperil kill checks directly`
      );
    }
  }
  if (/\.filter\(\s*\(?\w+\)?\s*=>\s*\w+\.isBoss\s*&&\s*!\w+\.isDead/.test(rulesText)) {
    violations.push(`${rel(battleRulesFile)} must not assemble boss Imperil boss lists directly`);
  }
}

function checkBigSkillDebuffEntry() {
  if (fs.existsSync(legacyBigSkillFile)) {
    violations.push(
      `${rel(legacyBigSkillFile)} must stay retired; big-skill debuff belongs in debuff`
    );
  }
  const catalogText = fs.readFileSync(bigSkillCatalogFile, "utf8");
  const ownerText = fs.readFileSync(bigSkillFile, "utf8");
  for (const required of [
    "BigSkillCatalogEvent",
    "bigSkillCatalogEventHandlers",
    "runBigSkillCatalog",
    "READ_CODES",
    "READ_SPEC",
    "IS_ENABLED",
  ]) {
    if (!catalogText.includes(required)) {
      violations.push(`${rel(bigSkillCatalogFile)} must own ${required}`);
    }
  }
  for (const legacy of ["bigSkillCodes", "readBigSkillSpec", "isBigSkillEnabled"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(catalogText)) {
      violations.push(`${rel(bigSkillCatalogFile)} legacy ${legacy} export must stay retired`);
    }
  }
  if (/bigSkillCatalogEventHandlers\[event\.type\]/.test(catalogText)) {
    violations.push(`${rel(bigSkillCatalogFile)} entry must fail closed for invalid catalog events`);
  }
  if (!/bigSkillCatalogEventHandlers\[event\?\.type\]/.test(catalogText)) {
    violations.push(`${rel(bigSkillCatalogFile)} entry must dispatch invalid catalog events through optional type`);
  }
  const catalogTest = path.join(root, "src/battle/big-skill-catalog.test.js");
  const catalogTestText = fs.readFileSync(catalogTest, "utf8");
  if (!catalogTestText.includes("rejects invalid catalog events")) {
    violations.push(`${rel(catalogTest)} must cover invalid catalog events`);
  }
  if (!/runBigSkillCatalog\(null\)/.test(catalogTestText)) {
    violations.push(`${rel(catalogTest)} must cover null catalog events`);
  }
  for (const required of [
    "BigSkillCatalogEvent.READ_CODES",
    "BigSkillCatalogEvent.READ_SPEC",
    "BigSkillCatalogEvent.IS_ENABLED",
    "runBigSkillCatalog",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bigSkillFile)} must read clear-skill specs through catalog`);
    }
  }
  if (/["']OFC["']\s*,\s*["']FRD["']|skill\s*===\s*["']OFC["']\s*\?\s*205/.test(ownerText)) {
    violations.push(`${rel(bigSkillFile)} must not hard-code OFC/FRD clear-skill specs`);
  }
  for (const required of [
    "BigSkillDebuffEvent",
    "bigSkillDebuffEventHandlers",
    "runBigSkillDebuffAutomation",
    "READ_CLEAR_RESOURCE_READY",
    "SHOULD_SKIP_DEBUFF",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bigSkillFile)} must own ${required}`);
    }
  }
  for (const legacy of ["clearSkillReadyNow", "shouldSkipForBigSkill"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
      violations.push(`${rel(bigSkillFile)} legacy ${legacy} export must stay private`);
    }
  }
  for (const required of [
    "event?.skillCooldowns",
    "event?.overcharge",
    "event?.aliveCount",
    "event?.monsterFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bigSkillFile)} must consume ${required}`);
    }
  }
  if (/\bevent\.snap\b/.test(ownerText)) {
    violations.push(`${rel(bigSkillFile)} must not consume snap-shaped event input`);
  }
  const entryBody =
    ownerText.match(/export function runBigSkillDebuffAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_CLEAR_RESOURCE_READY\]/.test(ownerText)) {
    violations.push(`${rel(bigSkillFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(bigSkillFile)} entry must dispatch by handler table`);
  }
  if (/bigSkillDebuffEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(`${rel(bigSkillFile)} entry must fail closed for invalid big-skill debuff events`);
  }
  if (!/bigSkillDebuffEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(`${rel(bigSkillFile)} entry must dispatch invalid big-skill debuff events through optional type`);
  }
  const bigSkillTestFile = path.join(root, "src/battle/debuff/big-skill-debuff.test.js");
  if (!fs.existsSync(bigSkillTestFile)) {
    violations.push(`${rel(bigSkillTestFile)} must cover big-skill debuff entry`);
  } else {
    const testText = fs.readFileSync(bigSkillTestFile, "utf8");
    if (!testText.includes("rejects unknown big skill debuff events")) {
      violations.push(`${rel(bigSkillTestFile)} must cover unknown big-skill debuff events`);
    }
    if (!/runBigSkillDebuffAutomation\(null\)/.test(testText)) {
      violations.push(`${rel(bigSkillTestFile)} must cover null big-skill debuff events`);
    }
  }
  const offensiveDebuffText = fs.readFileSync(decideOffensiveDebuffFile, "utf8");
  if (!offensiveDebuffText.includes("runBigSkillDebuffAutomation")) {
    violations.push(`${rel(decideOffensiveDebuffFile)} must own big-skill debuff skip rulings`);
  }
  for (const file of [decideCastAllFile, bossImperilFile]) {
    const text = fs.readFileSync(file, "utf8");
    if (/runBigSkillDebuffAutomation|BigSkillDebuffEvent/.test(text)) {
      violations.push(`${rel(file)} must consume offensive debuff skip rulings`);
    }
    if (/\b(?:clearSkillReadyNow|shouldSkipForBigSkill)\b/.test(text)) {
      violations.push(`${rel(file)} must not call legacy big-skill debuff helpers`);
    }
    for (const call of text.matchAll(/runBigSkillDebuffAutomation\s*\(\s*\{[\s\S]*?\}\s*\)/g)) {
      if (/\bsnap\s*:/.test(call[0])) {
        violations.push(`${rel(file)} must pass narrow facts, not snap, to big-skill debuff entry`);
      }
    }
  }
  const castAllText = fs.readFileSync(decideCastAllFile, "utf8");
  if (/\bbigSkillDebuffFacts\b/.test(castAllText)) {
    violations.push(`${rel(decideCastAllFile)} must not project big-skill boss facts locally`);
  }
  if (!/const ALL_DEBUFF_GATES = Object\.freeze\(\{/.test(castAllText)) {
    violations.push(`${rel(decideCastAllFile)} must own frozen all-debuff gate table`);
  }
  if (/READ_CLEAR_READY|readClearReady/.test(ownerText)) {
    violations.push(`${rel(bigSkillFile)} legacy clear-ready name must stay retired`);
  }
}

function checkBurstControlEntry() {
  const ownerText = fs.readFileSync(burstControlFile, "utf8");
  for (const required of [
    "BattleBurstControlDecisionEvent",
    "battleBurstControlDecisionEventHandlers",
    "DECIDE",
    "runBattleBurstControlDecision",
    "decideBurstControl",
    "PHYSICAL_TYPES",
    "CONTROL_IMG",
    "burstControlSwitch",
    "debuffSkillSwitch",
    "event.willClearWithBigSkill",
    "event.healthAbs",
    "event.skillReady",
    "event.learnedBurstByMid",
    "event.monsterFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(burstControlFile)} must own burst-control gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleBurstControlDecisionEvent\b|runBattleBurstControlDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(burstControlFile)} may export only its event entry`);
  }
  const burstControlEntryBody =
    ownerText.match(/export function runBattleBurstControlDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(burstControlFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(burstControlEntryBody)) {
    violations.push(`${rel(burstControlFile)} entry must dispatch by handler table`);
  }
  if (/battleBurstControlDecisionEventHandlers\[event\.type\]/.test(burstControlEntryBody)) {
    violations.push(`${rel(burstControlFile)} entry must fail closed for invalid burst-control events`);
  }
  if (!/battleBurstControlDecisionEventHandlers\[event\?\.type\]/.test(burstControlEntryBody)) {
    violations.push(`${rel(burstControlFile)} entry must dispatch invalid burst-control events through optional type`);
  }
  const burstControlTestFile = path.join(root, "src/battle/debuff/decide-burst-control.test.js");
  const burstControlTestText = fs.existsSync(burstControlTestFile)
    ? fs.readFileSync(burstControlTestFile, "utf8")
    : "";
  if (!/runBattleBurstControlDecision\(null\)/.test(burstControlTestText)) {
    violations.push(`${rel(burstControlTestFile)} must cover null burst-control events`);
  }
  if (
    !/const PHYSICAL_TYPES = Object\.freeze\(\{/.test(ownerText) ||
    !/const CONTROL_IMG = Object\.freeze\(\{/.test(ownerText)
  ) {
    violations.push(`${rel(burstControlFile)} must own frozen burst-control decision tables`);
  }
  if (/decideBurstControl\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(burstControlFile)} must not expose opt/snap decision input`);
  }
  if (
    /decideAttack|AttackDecisionEvent|from\s+["'][^"']*attack\/decide-attack\.js["']/.test(
      ownerText
    )
  ) {
    violations.push(
      `${rel(burstControlFile)} must consume attack clear verdict, not attack internals`
    );
  }
  const rulesText = readBattleActionRulesText();
  const burstRule =
    rulesText.match(/name:\s*["']burstControl["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideBurstControl\(\s*opt\s*,\s*snap\s*\)/.test(burstRule)) {
    violations.push(`${rel(battleRulesFile)} must pass narrow facts, not snap, to burst control`);
  }
  if (rulesText.includes("burstControlSwitch")) {
    violations.push(`${rel(battleRulesFile)} must not assemble burst-control gates directly`);
  }
}

function checkOffensiveDebuffEntry() {
  const ownerText = fs.readFileSync(decideOffensiveDebuffFile, "utf8");
  for (const required of [
    "BattleOffensiveDebuffEvent",
    "DECIDE",
    "runBattleOffensiveDebuff",
    "OFFENSIVE_DEBUFF_STEPS",
    'capability: "burstControl"',
    'capability: "bossImperil"',
    'capability: "weakenAll"',
    'capability: "imperilAll"',
    'capability: "singleTargetDebuff"',
    "BattleAttackActionEvent.WILL_CLEAR_WITH_BIG_SKILL",
    "runBattleAttackAction",
    "willClearWithBigSkill",
    "BigSkillDebuffEvent.SHOULD_SKIP_DEBUFF",
    "runBigSkillDebuffAutomation",
    "BattleStallModeEvent.READ_ACTIVE",
    "runBattleStallModeAutomation",
    "stallActive",
    "skipWeakenForBigSkill",
    "skipImperilForBigSkill",
    "BattleDebuffFactsEvent.READ_BURST_CONTROL",
    "BattleDebuffFactsEvent.READ_BOSS_IMPERIL",
    "BattleDebuffFactsEvent.READ_DEBUFF_ACTION",
    "runBattleDebuffFacts",
    "BattleBurstControlDecisionEvent.DECIDE",
    "runBattleBurstControlDecision",
    "runBossImperilAutomation",
    "BattleAllDebuffDecisionEvent.DECIDE",
    "runBattleAllDebuffDecision",
    "BattleDeSkillDecisionEvent.DECIDE",
    "runBattleDeSkillDecision",
    'debuffKey: "We"',
    'debuffKey: "Im"',
    "isEmptyDecision",
    "EMPTY_DECISION_PREDICATES",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideOffensiveDebuffFile)} must own offensive debuff ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleOffensiveDebuffEvent\b|runBattleOffensiveDebuff\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideOffensiveDebuffFile)} may export only its event entry`);
  }
  if (
    !/const OFFENSIVE_DEBUFF_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "burstControl"[\s\S]*capability: "bossImperil"[\s\S]*capability: "weakenAll"[\s\S]*capability: "imperilAll"[\s\S]*capability: "singleTargetDebuff"[\s\S]*\]\)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideOffensiveDebuffFile)} must own frozen offensive debuff order`);
  }
  for (const required of ["noop: () => true"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideOffensiveDebuffFile)} must lock empty offensive debuff decision ${required}`);
    }
  }
  const emptyDecisionBody =
    ownerText.match(/function isEmptyDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/result\.kind\s*===|result\.kind\s*!==/.test(emptyDecisionBody)) {
    violations.push(`${rel(decideOffensiveDebuffFile)} must route empty offensive debuff decisions through predicate tables`);
  }

  const rulesText = readBattleActionRulesText();
  if (
    !rulesText.includes("BattleOffensiveDebuffEvent.DECIDE") ||
    !rulesText.includes("runBattleOffensiveDebuff")
  ) {
    violations.push(`${rel(battleRulesFile)} must route offensive debuffs through one entry`);
  }
  if (/decideOffensiveDebuff\(\s*snap\s*,\s*actionOptions\s*\)/.test(rulesText)) {
    violations.push(
      `${rel(battleRulesFile)} must not call offensive debuff through old two-arg path`
    );
  }
  for (const legacyRule of [
    "burstControl",
    "bossImperil",
    "castWeakenAll",
    "castImperilAll",
    "useDeSkill",
  ]) {
    if (new RegExp(`name:\\s*["']${legacyRule}["']`).test(rulesText)) {
      violations.push(`${rel(battleRulesFile)} must not split offensive debuff rule ${legacyRule}`);
    }
  }

  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    if (
      file === decideOffensiveDebuffFile ||
      file === burstControlFile ||
      file === bossImperilFile ||
      file === decideCastAllFile ||
      file === decideDeSkillFile
    ) {
      continue;
    }
    const source = fs.readFileSync(file, "utf8");
    if (
      /from\s+["'][^"']*debuff\/decide-(?:burst-control|boss-imperil|cast-all|de-skill)\.js["']/.test(
        source
      ) ||
      /\b(?:decideBurstControl|runBossImperilAutomation|decideCastDebuffOnAll|decideDeSkill)\s*\(/.test(
        source
      )
    ) {
      violations.push(`${rel(file)} must call offensive debuffs through runBattleOffensiveDebuff`);
    }
  }
}

function checkCriticalBuffEntry() {
  const ownerText = fs.readFileSync(decideCriticalBuffFile, "utf8");
  for (const required of [
    "CriticalBuffDecisionEvent",
    "criticalBuffDecisionEventHandlers",
    "DECIDE",
    "runCriticalBuffDecision",
    "decideCriticalBuff",
    "criticalBuffDecisionInput",
    "CriticalBuffFactsEvent.READ_DECISION",
    "runCriticalBuffFacts",
    "event.manaPercent",
    "event.playerEffects",
    "critical-pause",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideCriticalBuffFile)} must own critical buff fact ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!CriticalBuffDecisionEvent\b|runCriticalBuffDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideCriticalBuffFile)} may export only its event entry`);
  }
  const criticalBuffEntryBody =
    ownerText.match(/export function runCriticalBuffDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideCriticalBuffFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(criticalBuffEntryBody)) {
    violations.push(`${rel(decideCriticalBuffFile)} entry must dispatch by handler table`);
  }
  if (/decideCriticalBuff\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideCriticalBuffFile)} must not expose opt/snap decision input`);
  }
  for (const forbidden of [
    "executeCriticalPause",
    "runAlarmAutomation",
    "triggerCriticalAlarm",
    "alarmResult",
    "alarmError",
    "runBattlePauseAutomation",
    'reason: "criticalBuff"',
    "document.title",
  ]) {
    if (ownerText.includes(forbidden)) {
      violations.push(`${rel(decideCriticalBuffFile)} must not own critical pause execution`);
    }
  }
  const executionText = fs.readFileSync(executeCriticalPauseFile, "utf8");
  if (!fs.existsSync(executeCriticalPauseTestFile)) {
    violations.push(`${rel(executeCriticalPauseTestFile)} must lock critical pause execution`);
  }
  for (const required of [
    "CriticalBuffPauseExecutionEvent",
    "criticalBuffPauseExecutionEventHandlers",
    "APPLY_PLAN",
    "runCriticalBuffPauseExecution",
    "runAlarmAutomation",
    "runBattlePauseAutomation",
    "runBattlePauseEvidence",
    "document.title",
    "const pauseResult = runBattlePauseAutomation",
    "return Boolean(pauseResult)",
    "invalidCriticalBuffPausePlan",
    "unknownCriticalPauseExecutionEvent",
    "rejectUnknownCriticalPauseEvent",
    "detail: { eventType: event?.type ?? null }",
  ]) {
    if (!executionText.includes(required)) {
      violations.push(
        `${rel(executeCriticalPauseFile)} must own critical pause execution ${required}`
      );
    }
  }
  const executionEntryBody =
    executionText.match(/export function runCriticalBuffPauseExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_PLAN\]/.test(executionText)) {
    violations.push(`${rel(executeCriticalPauseFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(executionEntryBody)) {
    violations.push(`${rel(executeCriticalPauseFile)} entry must dispatch by handler table`);
  }
  if (!executionText.includes("criticalBuffPauseExecutionEventHandlers[event?.type]")) {
    violations.push(`${rel(executeCriticalPauseFile)} must reject null critical pause events as not acted`);
  }
  if (fs.existsSync(executeCriticalPauseTestFile)) {
    const executionTestText = fs.readFileSync(executeCriticalPauseTestFile, "utf8");
    if (!executionTestText.includes("rejects unknown critical pause execution events")) {
      violations.push(`${rel(executeCriticalPauseTestFile)} must cover unknown critical pause events`);
    }
    if (!executionTestText.includes("unknownCriticalPauseExecutionEvent")) {
      violations.push(`${rel(executeCriticalPauseTestFile)} must cover unknown critical pause evidence`);
    }
    if (!executionTestText.includes("runCriticalBuffPauseExecution(null)")) {
      violations.push(`${rel(executeCriticalPauseTestFile)} must cover null critical pause events`);
    }
    if (!executionTestText.includes("rejects missing critical pause plans as not acted with evidence")) {
      violations.push(`${rel(executeCriticalPauseTestFile)} must cover invalid critical pause plans`);
    }
  }
  const executeCriticalPauseResultTestFile = path.join(
    root,
    "src/battle/critical-buff-guard/execute-critical-pause-result.test.js"
  );
  if (!fs.existsSync(executeCriticalPauseResultTestFile)) {
    violations.push(
      "src/battle/critical-buff-guard/execute-critical-pause-result.test.js must cover critical pause acted result semantics"
    );
  } else {
    const resultTestText = fs.readFileSync(executeCriticalPauseResultTestFile, "utf8");
    for (const required of [
      "returns not acted when the pause entry rejects the critical pause",
      "still pauses when the alarm side effect fails",
      "alarm failed",
      "alarmError",
      "runBattlePauseAutomation",
      "toBe(false)",
    ]) {
      if (!resultTestText.includes(required)) {
        violations.push(
          `src/battle/critical-buff-guard/execute-critical-pause-result.test.js must cover ${required}`
        );
      }
    }
  }
  if (!fs.readFileSync(actionEffectExecutionFile, "utf8").includes("runCriticalBuffPauseExecution")) {
    violations.push(`${rel(actionEffectExecutionFile)} must execute critical pauses through execution entry`);
  }
  const rulesText = readBattleActionRulesText();
  const criticalRule =
    rulesText.match(/name:\s*["']criticalBuffGuard["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideCriticalBuff\(\s*opt\s*,\s*snap\s*\)/.test(criticalRule)) {
    violations.push(
      `${rel(battleRulesFile)} must pass narrow facts, not snap, to critical buff guard`
    );
  }
}

function checkSurvivalActionEntry() {
  const ownerText = fs.readFileSync(decideSurvivalActionFile, "utf8");
  for (const required of [
    "BattleSurvivalActionEvent",
    "DECIDE",
    "runBattleSurvivalAction",
    "CriticalBuffDecisionEvent.DECIDE",
    "runCriticalBuffDecision",
    "BattleFleeDecisionEvent.DECIDE",
    "runBattleFleeDecision",
    "BattleAutoPauseDecisionEvent.DECIDE",
    "runBattleAutoPauseDecision",
    "runBattleItemDecision",
    "BattleDefendDecisionEvent.DECIDE",
    "runBattleDefendDecision",
    "BattleItemDecisionEvent.DECIDE_GEM",
    "BattleItemDecisionEvent.DECIDE_POTION",
    "BattleItemDecisionEvent.DECIDE_STALL_TOPUP",
    "BattleItemDecisionEvent.DECIDE_SCROLL",
    "EMPTY_DECISION_PREDICATES",
    "EMPTY_ITEM_PLAN_PREDICATES",
    "isEmptyItemPlanDecision",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideSurvivalActionFile)} must own survival action ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleSurvivalActionEvent\b|runBattleSurvivalAction\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideSurvivalActionFile)} may export only its event entry`);
  }
  if (!ownerText.includes("isEmptyDecision")) {
    violations.push(`${rel(decideSurvivalActionFile)} must own structured empty decisions`);
  }
  if (
    !/const SURVIVAL_ACTION_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "criticalBuffGuard"[\s\S]*capability: "flee"[\s\S]*capability: "autoPause"[\s\S]*capability: "gem"[\s\S]*capability: "potion"[\s\S]*capability: "stallTopup"[\s\S]*capability: "defend"[\s\S]*capability: "scroll"[\s\S]*\]\)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideSurvivalActionFile)} must own frozen survival action priority order`);
  }
  for (const required of [
    "noop: () => true",
    '"item-plan": isEmptyItemPlanDecision',
    "potion: (plan) => !plan.candidates?.length",
    "stall: (plan) => !plan.attempts?.length",
    "scroll: (plan) => !plan.candidates?.length",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideSurvivalActionFile)} must lock empty survival decision ${required}`);
    }
  }
  const emptyDecisionBody =
    ownerText.match(/function isEmptyDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/result\.kind\s*===|plan\.type\s*===/.test(emptyDecisionBody)) {
    violations.push(`${rel(decideSurvivalActionFile)} must route empty survival decisions through predicate tables`);
  }
  if (
    /from\s+["'][^"']*(?:critical-buff-facts|flee-facts|auto-pause-facts|defend-facts)\.js["']/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideSurvivalActionFile)} must not assemble survival sub-action facts`);
  }

  const rulesText = readBattleActionRulesText();
  if (
    !rulesText.includes("BattleSurvivalActionEvent.DECIDE") ||
    !rulesText.includes("runBattleSurvivalAction")
  ) {
    violations.push(`${rel(battleRulesFile)} must route survival through one entry`);
  }
  if (/decideSurvivalAction\(\s*snap\s*,\s*actionOptions\s*\)/.test(rulesText)) {
    violations.push(`${rel(battleRulesFile)} must not call survival through old two-arg path`);
  }
  for (const legacyRule of [
    "criticalBuffGuard",
    "flee",
    "autoPause",
    "useGem",
    "deadSoon",
    "stallTopup",
    "defend",
    "useScroll",
  ]) {
    if (new RegExp(`name:\\s*["']${legacyRule}["']`).test(rulesText)) {
      violations.push(`${rel(battleRulesFile)} must not split survival rule ${legacyRule}`);
    }
  }

  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    if (
      file === decideSurvivalActionFile ||
      file === decideCriticalBuffFile ||
      file === decideFleeFile ||
      file === decideAutoPauseFile ||
      file === decideDefendFile ||
      file === decideItemFile ||
      file === dispatchFile
    ) {
      continue;
    }
    const source = fs.readFileSync(file, "utf8");
    if (
      /from\s+["'][^"']*(?:critical-buff-guard\/decide-critical-buff|escape\/decide-flee|pause\/decide-auto-pause|defense\/decide-defend|item\/decide-item)\.js["']/.test(
        source
      ) ||
      /\b(?:decideCriticalBuff|decideFlee|decideAutoPause|decideDefend|runBattleItemDecision)\s*\(/.test(
        source
      )
    ) {
      violations.push(`${rel(file)} must call survival through runBattleSurvivalAction`);
    }
  }
}

function checkBuffPreparationEntry() {
  const ownerText = fs.readFileSync(decideBuffPreparationFile, "utf8");
  for (const required of [
    "BattleBuffPreparationEvent",
    "DECIDE",
    "runBattleBuffPreparation",
    "BUFF_PREPARATION_STEPS",
    'capability: "infusion"',
    'capability: "channel"',
    'capability: "buff"',
    "BattleBuffFactsEvent.READ_PREPARATION",
    "runBattleBuffFacts",
    "BattleInfusionDecisionEvent.DECIDE",
    "runBattleInfusionDecision",
    "BattleChannelDecisionEvent.DECIDE",
    "runBattleChannelDecision",
    "BattleBuffDecisionEvent.DECIDE",
    "runBattleBuffDecision",
    "isEmptyDecision",
    "EMPTY_DECISION_PREDICATES",
    "EMPTY_CHANNEL_PLAN_PREDICATES",
    "isEmptyChannelPlanDecision",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideBuffPreparationFile)} must own buff preparation ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleBuffPreparationEvent\b|runBattleBuffPreparation\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideBuffPreparationFile)} may export only its event entry`);
  }
  if (
    !/const BUFF_PREPARATION_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "infusion"[\s\S]*capability: "channel"[\s\S]*capability: "buff"[\s\S]*\]\)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideBuffPreparationFile)} must own frozen buff preparation order`);
  }
  for (const required of [
    "noop: () => true",
    '"channel-plan": isEmptyChannelPlanDecision',
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideBuffPreparationFile)} must lock empty buff preparation decision ${required}`);
    }
  }
  const emptyDecisionBody =
    ownerText.match(/function isEmptyDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/result\.kind\s*===|plan\.type\s*===/.test(emptyDecisionBody)) {
    violations.push(`${rel(decideBuffPreparationFile)} must route empty buff preparation decisions through predicate tables`);
  }

  const rulesText = readBattleActionRulesText();
  if (
    !rulesText.includes("BattleBuffPreparationEvent.DECIDE") ||
    !rulesText.includes("runBattleBuffPreparation")
  ) {
    violations.push(`${rel(battleRulesFile)} must route buff preparation through one entry`);
  }
  if (/decideBuffPreparation\(\s*snap\s*,\s*actionOptions\s*\)/.test(rulesText)) {
    violations.push(
      `${rel(battleRulesFile)} must not call buff preparation through old two-arg path`
    );
  }
  for (const legacyRule of ["useInfusions", "useChannelSkill", "useBuffSkill"]) {
    if (rulesText.includes(legacyRule)) {
      violations.push(`${rel(battleRulesFile)} must not split buff preparation rule ${legacyRule}`);
    }
  }

  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    if (
      file === decideBuffPreparationFile ||
      file === decideInfusionFile ||
      file === decideChannelFile ||
      file === decideBuffFile
    ) {
      continue;
    }
    const source = fs.readFileSync(file, "utf8");
    if (
      /from\s+["'][^"']*buff\/decide-(?:infusion|channel|buff)\.js["']/.test(source) ||
      /\b(?:decideInfusion|decideChannel|decideBuff)\s*\(/.test(source)
    ) {
      violations.push(`${rel(file)} must call buff preparation through runBattleBuffPreparation`);
    }
  }
}

function checkInfusionEntry() {
  const ownerText = fs.readFileSync(decideInfusionFile, "utf8");
  for (const required of [
    "BattleInfusionDecisionEvent",
    "battleInfusionDecisionEventHandlers",
    "DECIDE",
    "runBattleInfusionDecision",
    "decideInfusion",
    "INFUSION_LIB",
    "infusionSwitch",
    "infusionCondition",
    "conditionFacts",
    "event.attackStatus",
    "BattlePlayerBuffStateEvent.READ_ACTIVE",
    "runBattlePlayerBuffState",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideInfusionFile)} must own infusion gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleInfusionDecisionEvent\b|runBattleInfusionDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideInfusionFile)} may export only its event entry`);
  }
  const infusionEntryBody =
    ownerText.match(/export function runBattleInfusionDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideInfusionFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(infusionEntryBody)) {
    violations.push(`${rel(decideInfusionFile)} entry must dispatch by handler table`);
  }
  if (/battleInfusionDecisionEventHandlers\[event\.type\]/.test(infusionEntryBody)) {
    violations.push(`${rel(decideInfusionFile)} entry must fail closed for invalid infusion decision events`);
  }
  if (!/battleInfusionDecisionEventHandlers\[event\?\.type\]/.test(infusionEntryBody)) {
    violations.push(`${rel(decideInfusionFile)} entry must dispatch invalid infusion decision events through optional type`);
  }
  const infusionTestFile = path.join(root, "src/battle/buff/decide-infusion.test.js");
  const infusionTestText = fs.existsSync(infusionTestFile)
    ? fs.readFileSync(infusionTestFile, "utf8")
    : "";
  if (!/runBattleInfusionDecision\(null\)/.test(infusionTestText)) {
    violations.push(`${rel(infusionTestFile)} must cover null infusion decision events`);
  }
  if (!/const INFUSION_LIB = Object\.freeze\(\[/.test(ownerText)) {
    violations.push(`${rel(decideInfusionFile)} must own frozen infusion item table`);
  }
  if (/decideInfusion\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideInfusionFile)} must not expose opt/snap infusion input`);
  }
  const rulesText = readBattleActionRulesText();
  const infusionRule =
    rulesText.match(/name:\s*["']useInfusions["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideInfusion\(\s*opt\s*,\s*snap\s*\)/.test(infusionRule)) {
    violations.push(`${rel(battleRulesFile)} must pass infusion facts, not snap, to infusion`);
  }
  for (const legacy of ["infusionSwitch", "infusionCondition"]) {
    if (rulesText.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble infusion rule gates directly`);
    }
  }
}

function checkChannelEntry() {
  const ownerText = fs.readFileSync(decideChannelFile, "utf8");
  for (const required of [
    "BattleChannelDecisionEvent",
    "battleChannelDecisionEventHandlers",
    "DECIDE",
    "runBattleChannelDecision",
    "decideChannel",
    "channelSkillSwitch",
    "channelSkill",
    "event.channeling",
    "event.skillReady",
    "event.playerEffects",
    "BattlePlayerBuffStateEvent.READ_ACTIVE",
    "BattlePlayerBuffStateEvent.SHOULD_RECAST",
    "runBattlePlayerBuffState",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideChannelFile)} must own channel gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleChannelDecisionEvent\b|runBattleChannelDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideChannelFile)} may export only its event entry`);
  }
  const channelEntryBody =
    ownerText.match(/export function runBattleChannelDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideChannelFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(channelEntryBody)) {
    violations.push(`${rel(decideChannelFile)} entry must dispatch by handler table`);
  }
  if (/battleChannelDecisionEventHandlers\[event\.type\]/.test(channelEntryBody)) {
    violations.push(`${rel(decideChannelFile)} entry must fail closed for invalid channel decision events`);
  }
  if (!/battleChannelDecisionEventHandlers\[event\?\.type\]/.test(channelEntryBody)) {
    violations.push(`${rel(decideChannelFile)} entry must dispatch invalid channel decision events through optional type`);
  }
  const channelTestFile = path.join(root, "src/battle/buff/decide-channel.test.js");
  const channelTestText = fs.existsSync(channelTestFile)
    ? fs.readFileSync(channelTestFile, "utf8")
    : "";
  if (!/runBattleChannelDecision\(null\)/.test(channelTestText)) {
    violations.push(`${rel(channelTestFile)} must cover null channel decision events`);
  }
  if (/decideChannel\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideChannelFile)} must not expose opt/snap decision input`);
  }
  const rulesText = readBattleActionRulesText();
  const channelRule =
    rulesText.match(/name:\s*["']useChannelSkill["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideChannel\(\s*opt\s*,\s*snap\s*\)/.test(channelRule)) {
    violations.push(`${rel(battleRulesFile)} must pass narrow facts, not snap, to channel`);
  }
  for (const legacy of ["channelSkillSwitch", "channelSkill"]) {
    if (rulesText.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble channel rule gates directly`);
    }
  }
  const executeText = fs.readFileSync(executeChannelFile, "utf8");
  for (const required of ["CHANNEL_PLAN_EXECUTORS", "click: executeClickPlan"]) {
    if (!executeText.includes(required)) {
      violations.push(`${rel(executeChannelFile)} must lock channel execution step ${required}`);
    }
  }
  const applyPlanBody =
    executeText.match(/function applyChannelPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/plan\.type\s*===/.test(applyPlanBody)) {
    violations.push(`${rel(executeChannelFile)} must dispatch channel plans by CHANNEL_PLAN_EXECUTORS`);
  }
}

function checkBuffEntry() {
  const ownerText = fs.readFileSync(decideBuffFile, "utf8");
  for (const required of [
    "BattleBuffDecisionEvent",
    "battleBuffDecisionEventHandlers",
    "DECIDE",
    "runBattleBuffDecision",
    "decideBuff",
    "DRAUGHT_PACK",
    "buffSkillSwitch",
    "buffSkill",
    "buffSkillCondition",
    "conditionFacts",
    "event.skillReady",
    "BattlePlayerBuffStateEvent.READ_ACTIVE",
    "BattlePlayerBuffStateEvent.SHOULD_RECAST",
    "runBattlePlayerBuffState",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideBuffFile)} must own buff gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleBuffDecisionEvent\b|runBattleBuffDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideBuffFile)} may export only its event entry`);
  }
  const buffEntryBody =
    ownerText.match(/export function runBattleBuffDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideBuffFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(buffEntryBody)) {
    violations.push(`${rel(decideBuffFile)} entry must dispatch by handler table`);
  }
  if (/battleBuffDecisionEventHandlers\[event\.type\]/.test(buffEntryBody)) {
    violations.push(`${rel(decideBuffFile)} entry must fail closed for invalid buff decision events`);
  }
  if (!/battleBuffDecisionEventHandlers\[event\?\.type\]/.test(buffEntryBody)) {
    violations.push(`${rel(decideBuffFile)} entry must dispatch invalid buff decision events through optional type`);
  }
  const buffTestFile = path.join(root, "src/battle/buff/decide-buff.test.js");
  const buffTestText = fs.existsSync(buffTestFile) ? fs.readFileSync(buffTestFile, "utf8") : "";
  if (!/runBattleBuffDecision\(null\)/.test(buffTestText)) {
    violations.push(`${rel(buffTestFile)} must cover null buff decision events`);
  }
  if (!/const DRAUGHT_PACK = Object\.freeze\(\[/.test(ownerText)) {
    violations.push(`${rel(decideBuffFile)} must own frozen draught decision table`);
  }
  if (/decideBuff\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideBuffFile)} must not expose opt/snap buff input`);
  }
  const rulesText = readBattleActionRulesText();
  const buffRule =
    rulesText.match(/name:\s*["']useBuffSkill["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideBuff\(\s*opt\s*,\s*snap\s*\)/.test(buffRule)) {
    violations.push(`${rel(battleRulesFile)} must pass buff facts, not snap, to buff`);
  }
  for (const legacy of ["buffSkillSwitch", "buffSkillCondition"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(rulesText)) {
      violations.push(`${rel(battleRulesFile)} must not assemble buff rule gates directly`);
    }
  }
}

function checkPlayerBuffStateQuery() {
  if (!fs.existsSync(playerBuffStateFile)) {
    violations.push(`${rel(playerBuffStateFile)} must own player buff state query`);
    return;
  }
  if (!fs.existsSync(playerBuffStateTestFile)) {
    violations.push(`${rel(playerBuffStateTestFile)} must lock player buff state query`);
  }

  const ownerText = fs.readFileSync(playerBuffStateFile, "utf8");
  for (const required of [
    "BattlePlayerBuffStateEvent",
    "battlePlayerBuffStateEventHandlers",
    "runBattlePlayerBuffState",
    "READ_ACTIVE",
    "SHOULD_RECAST",
    "isPlayerBuffActive",
    "shouldRecastPlayerBuff",
    "playerBuffs",
    "playerEffectTurns",
    "playerEffects",
    "hasOwnProperty",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(playerBuffStateFile)} must own player buff state fact ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattlePlayerBuffStateEvent\b|runBattlePlayerBuffState\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(playerBuffStateFile)} may export only its event query entry`);
  }
  if (fs.existsSync(path.join(root, "src/battle/buff/player-buff-state.js"))) {
    violations.push(
      "src/battle/buff/player-buff-state.js must be promoted to battle player-buff-state"
    );
  }
  if (fs.existsSync(path.join(root, "src/battle/buff/player-buff-recast.js"))) {
    violations.push("src/battle/buff/player-buff-recast.js must be retired into player-buff-state");
  }

  const channelText = fs.readFileSync(decideChannelFile, "utf8");
  if (/function\s+needsRecast\b/.test(channelText)) {
    violations.push(`${rel(decideChannelFile)} must not keep local needsRecast logic`);
  }

  const buffText = fs.readFileSync(decideBuffFile, "utf8");
  if (/playerEffectTurns\?\.\[\s*lib\.img\s*\]|\bturnsLeft\b/.test(buffText)) {
    violations.push(`${rel(decideBuffFile)} must use player buff recast query`);
  }

  const directPlayerBuffReaders = [
    [decideInfusionFile, fs.readFileSync(decideInfusionFile, "utf8")],
    [decideChannelFile, channelText],
    [decideBuffFile, buffText],
    [decideItemFile, fs.readFileSync(decideItemFile, "utf8")],
    [stallModeFile, fs.readFileSync(stallModeFile, "utf8")],
  ];
  for (const [file, text] of directPlayerBuffReaders) {
    if (/playerBuffs\s*\|\|\s*\[\]\)\.includes|playerBuffs\?\.includes/.test(text)) {
      violations.push(`${rel(file)} must use player buff active query`);
    }
    if (!text.includes("runBattlePlayerBuffState")) {
      violations.push(`${rel(file)} must query player buff state through one entry`);
    }
    if (/import\s*\{[^}]*\b(?:isPlayerBuffActive|shouldRecastPlayerBuff)\b/.test(text)) {
      violations.push(`${rel(file)} must not import raw player buff state functions`);
    }
  }

  const allowedProductionImporters = new Set([
    decideInfusionFile,
    decideChannelFile,
    decideBuffFile,
    decideItemFile,
    stallModeFile,
  ]);
  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const file = path.join(entry.parentPath, entry.name);
    if (file.endsWith(".test.js")) continue;
    const text = fs.readFileSync(file, "utf8");
    if (
      /from\s+["'][^"']*player-buff-state\.js["']/.test(text) &&
      !allowedProductionImporters.has(file)
    ) {
      violations.push(`${rel(file)} must not bypass player buff state query consumers`);
    }
    if (/from\s+["'][^"']*player-buff-recast\.js["']/.test(text)) {
      violations.push(`${rel(file)} must use player-buff-state.js`);
    }
  }
}

function checkSingleDebuffEntry() {
  const ownerText = fs.readFileSync(decideDeSkillFile, "utf8");
  for (const required of [
    "BattleDeSkillDecisionEvent",
    "battleDeSkillDecisionEventHandlers",
    "DECIDE",
    "runBattleDeSkillDecision",
    "decideDeSkill",
    "debuffSkillSwitch",
    "debuffSkill",
    "debuffSkillCondition",
    "event.stallActive",
    "conditionFacts",
    "event.monsterFacts",
    "event.skillReady",
    "event.spellAoe",
    "BattleDebuffApplicabilityEvent.READ_VERDICT",
    "runBattleDebuffApplicability",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideDeSkillFile)} must own single-debuff gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleDeSkillDecisionEvent\b|runBattleDeSkillDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideDeSkillFile)} may export only its event entry`);
  }
  const deSkillEntryBody =
    ownerText.match(/export function runBattleDeSkillDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideDeSkillFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(deSkillEntryBody)) {
    violations.push(`${rel(decideDeSkillFile)} entry must dispatch by handler table`);
  }
  if (/battleDeSkillDecisionEventHandlers\[event\.type\]/.test(deSkillEntryBody)) {
    violations.push(`${rel(decideDeSkillFile)} entry must fail closed for invalid de-skill events`);
  }
  if (!/battleDeSkillDecisionEventHandlers\[event\?\.type\]/.test(deSkillEntryBody)) {
    violations.push(`${rel(decideDeSkillFile)} entry must dispatch invalid de-skill events through optional type`);
  }
  const deSkillTestFile = path.join(root, "src/battle/debuff/decide-de-skill.test.js");
  const deSkillTestText = fs.existsSync(deSkillTestFile)
    ? fs.readFileSync(deSkillTestFile, "utf8")
    : "";
  if (!/runBattleDeSkillDecision\(null\)/.test(deSkillTestText)) {
    violations.push(`${rel(deSkillTestFile)} must cover null de-skill events`);
  }
  if (/decideDeSkill\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideDeSkillFile)} must not expose opt/snap single-debuff input`);
  }
  if (/import\s*\{[^}]*\bcanApplyDebuffPure\b/.test(ownerText)) {
    violations.push(`${rel(decideDeSkillFile)} must consume debuff applicability through one entry`);
  }
  const rulesText = readBattleActionRulesText();
  const useDeSkillRule =
    rulesText.match(/name:\s*["']useDeSkill["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideDeSkill\(\s*opt\s*,\s*snap\s*\)/.test(useDeSkillRule)) {
    violations.push(`${rel(battleRulesFile)} must pass single-debuff facts, not snap`);
  }
  for (const legacy of ["isStallingForRules", "debuffSkillSwitch", "debuffSkillCondition"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(useDeSkillRule)) {
      violations.push(
        `${rel(battleRulesFile)} must not assemble single-debuff rule gates directly`
      );
    }
  }
}

function checkAllDebuffEntry() {
  const ownerText = fs.readFileSync(decideCastAllFile, "utf8");
  for (const required of [
    "BattleAllDebuffDecisionEvent",
    "battleAllDebuffDecisionEventHandlers",
    "DECIDE",
    "runBattleAllDebuffDecision",
    "decideCastDebuffOnAll",
    "debuffSkillSwitch",
    "debuffSkillAllWk",
    "debuffSkillAllIm",
    "debuffSkillWkCondition",
    "debuffSkillImpCondition",
    "runBattleDebuffCoverageAutomation",
    "skipWeakenForBigSkill",
    "skipImperilForBigSkill",
    "event?.stallActive",
    "conditionFacts",
    "event.monsterFacts",
    "event.skillReady",
    "event.spellAoe",
    "BattleDebuffApplicabilityEvent.READ_VERDICT",
    "runBattleDebuffApplicability",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideCastAllFile)} must own all-debuff gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleAllDebuffDecisionEvent\b|runBattleAllDebuffDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideCastAllFile)} may export only its event entry`);
  }
  const castAllEntryBody =
    ownerText.match(/export function runBattleAllDebuffDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideCastAllFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(castAllEntryBody)) {
    violations.push(`${rel(decideCastAllFile)} entry must dispatch by handler table`);
  }
  if (/battleAllDebuffDecisionEventHandlers\[event\.type\]/.test(castAllEntryBody)) {
    violations.push(`${rel(decideCastAllFile)} entry must fail closed for invalid all-debuff events`);
  }
  if (!/battleAllDebuffDecisionEventHandlers\[event\?\.type\]/.test(castAllEntryBody)) {
    violations.push(`${rel(decideCastAllFile)} entry must dispatch invalid all-debuff events through optional type`);
  }
  const castAllTestFile = path.join(root, "src/battle/debuff/decide-cast-all.test.js");
  const castAllTestText = fs.existsSync(castAllTestFile)
    ? fs.readFileSync(castAllTestFile, "utf8")
    : "";
  if (!/runBattleAllDebuffDecision\(null\)/.test(castAllTestText)) {
    violations.push(`${rel(castAllTestFile)} must cover null all-debuff events`);
  }
  if (/decideCastDebuffOnAll\s*\(\s*opt\s*,\s*snap\s*,/.test(ownerText)) {
    violations.push(`${rel(decideCastAllFile)} must not expose opt/snap all-debuff input`);
  }
  if (/import\s*\{[^}]*\bcanApplyDebuffPure\b/.test(ownerText)) {
    violations.push(`${rel(decideCastAllFile)} must consume debuff applicability through one entry`);
  }
  const canApplyText = fs.readFileSync(path.join(root, "src/battle/debuff/can-apply.js"), "utf8");
  for (const required of [
    "BattleDebuffApplicabilityEvent",
    "battleDebuffApplicabilityEventHandlers",
    "runBattleDebuffApplicability",
    "READ_VERDICT",
    "canApplyDebuffPure",
  ]) {
    if (!canApplyText.includes(required)) {
      violations.push(`src/battle/debuff/can-apply.js must own debuff applicability query ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleDebuffApplicabilityEvent\b|runBattleDebuffApplicability\b)/.test(
      canApplyText
    )
  ) {
    violations.push("src/battle/debuff/can-apply.js may export only its event query entry");
  }
  const canApplyEntryBody =
    canApplyText.match(/export function runBattleDebuffApplicability\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/battleDebuffApplicabilityEventHandlers\[event\.type\]/.test(canApplyEntryBody)) {
    violations.push("src/battle/debuff/can-apply.js entry must fail closed for invalid debuff applicability events");
  }
  if (!/battleDebuffApplicabilityEventHandlers\[event\?\.type\]/.test(canApplyEntryBody)) {
    violations.push("src/battle/debuff/can-apply.js entry must dispatch invalid debuff applicability events through optional type");
  }
  const canApplyTestFile = path.join(root, "src/battle/debuff/can-apply.test.js");
  const canApplyTestText = fs.existsSync(canApplyTestFile)
    ? fs.readFileSync(canApplyTestFile, "utf8")
    : "";
  if (!/runBattleDebuffApplicability\(null\)/.test(canApplyTestText)) {
    violations.push(`${rel(canApplyTestFile)} must cover null debuff applicability events`);
  }
  const rulesText = readBattleActionRulesText();
  for (const ruleName of ["castWeakenAll", "castImperilAll"]) {
    const rule =
      rulesText.match(
        new RegExp(`name:\\s*["']${ruleName}["'][\\s\\S]*?decide:[\\s\\S]*?\\n\\s*\\}`)
      )?.[0] || "";
    if (/decideCastDebuffOnAll\(\s*opt\s*,\s*snap\s*,/.test(rule)) {
      violations.push(`${rel(battleRulesFile)} must pass all-debuff facts, not snap`);
    }
    for (const legacy of [
      "debuffSkillSwitch",
      "debuffSkillAllWk",
      "debuffSkillAllIm",
      "debuffSkillWkCondition",
      "debuffSkillImpCondition",
      "runBattleDebuffCoverageAutomation",
      "runBigSkillDebuffAutomation",
      "runBattleStallModeAutomation",
    ]) {
      if (new RegExp(`\\b${legacy}\\b`).test(rule)) {
        violations.push(`${rel(battleRulesFile)} must not assemble all-debuff rule gates directly`);
      }
    }
  }
}

function checkBattleItemDecisionEntry() {
  const itemText = fs.readFileSync(decideItemFile, "utf8");
  for (const required of [
    "BattleItemDecisionEvent",
    "runBattleItemDecision",
    "DECIDE_GEM",
    "DECIDE_POTION",
    "DECIDE_STALL_TOPUP",
    "DECIDE_SCROLL",
    "itemDecisionInput",
    "battleItemDecisionHandlers",
    "BattleItemFactsEvent.READ_GEM",
    "BattleItemFactsEvent.READ_POTION",
    "BattleItemFactsEvent.READ_STALL_TOPUP",
    "BattleItemFactsEvent.READ_SCROLL",
    "runBattleItemFacts",
    "BattleGemDecisionEvent.DECIDE",
    "runBattleGemDecision",
    "BattleScrollDecisionEvent.DECIDE",
    "runBattleScrollDecision",
    "GEM_RESULT_PLAN_MAPPERS",
    "mapGemResultToItemPlan",
  ]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} must expose item decision entry ${required}`);
    }
  }
  for (const legacy of ["decideGemUse", "decidePotion", "decideStallTopup"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(itemText)) {
      violations.push(`${rel(decideItemFile)} must not export legacy item decision ${legacy}`);
    }
  }
  if (/export\s*\{\s*decideScroll\s*\}/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must route scroll through runBattleItemDecision`);
  }
  const itemEntryBody =
    itemText.match(/export function runBattleItemDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/const battleItemDecisionHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[DECIDE_GEM\]/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must route item decisions through a frozen handler table`);
  }
  if (/switch\s*\(\s*event\.type\s*\)|event\.type\s*===/.test(itemEntryBody)) {
    violations.push(`${rel(decideItemFile)} entry must dispatch by handler table`);
  }
  if (/battleItemDecisionHandlers\[event\.type\]/.test(itemEntryBody)) {
    violations.push(`${rel(decideItemFile)} entry must fail closed for invalid item decision events`);
  }
  if (!/battleItemDecisionHandlers\[event\?\.type\]/.test(itemEntryBody)) {
    violations.push(`${rel(decideItemFile)} entry must dispatch invalid item decision events through optional type`);
  }
  const itemTestFile = path.join(root, "src/battle/item/decide-item.test.js");
  const itemTestText = fs.existsSync(itemTestFile) ? fs.readFileSync(itemTestFile, "utf8") : "";
  if (!itemTestText.includes("rejects unknown item decision events with a noop plan")) {
    violations.push(`${rel(itemTestFile)} must cover unknown item decision events`);
  }
  if (!/runBattleItemDecision\(null\)/.test(itemTestText)) {
    violations.push(`${rel(itemTestFile)} must cover null item decision events`);
  }
  for (const required of ["gem: () => ({ type: \"gem\" })", "noop: () => ({ type: \"noop\" })"]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} must lock gem result plan mapper ${required}`);
    }
  }
  const decideGemUseBody =
    itemText.match(/function decideGemUse\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/result\.kind\s*===/.test(decideGemUseBody)) {
    violations.push(`${rel(decideItemFile)} must map gem result kinds through GEM_RESULT_PLAN_MAPPERS`);
  }
  const scrollText = fs.readFileSync(decideScrollFile, "utf8");
  if (!/const SCROLL_LIB = Object\.freeze\(\{/.test(scrollText)) {
    violations.push(`${rel(decideScrollFile)} must own frozen scroll decision table`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleScrollDecisionEvent\b|runBattleScrollDecision\b)/.test(
      scrollText
    )
  ) {
    violations.push(`${rel(decideScrollFile)} may export only its event entry`);
  }
  const scrollEntryBody =
    scrollText.match(/export function runBattleScrollDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(scrollText)) {
    violations.push(`${rel(decideScrollFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(scrollEntryBody)) {
    violations.push(`${rel(decideScrollFile)} entry must dispatch by handler table`);
  }
  if (/battleScrollDecisionEventHandlers\[event\.type\]/.test(scrollEntryBody)) {
    violations.push(`${rel(decideScrollFile)} entry must fail closed for invalid scroll decision events`);
  }
  if (!/battleScrollDecisionEventHandlers\[event\?\.type\]/.test(scrollEntryBody)) {
    violations.push(`${rel(decideScrollFile)} entry must dispatch invalid scroll decision events through optional type`);
  }
  if (!/runBattleScrollDecision\(null\)/.test(itemTestText)) {
    violations.push(`${rel(itemTestFile)} must cover null scroll decision events`);
  }

  const rulesText = readBattleActionRulesText();
  const survivalText = fs.existsSync(decideSurvivalActionFile)
    ? fs.readFileSync(decideSurvivalActionFile, "utf8")
    : "";
  const itemDecisionConsumersText = `${rulesText}\n${survivalText}`;
  for (const required of [
    "runBattleItemDecision",
    "BattleItemDecisionEvent.DECIDE_GEM",
    "BattleItemDecisionEvent.DECIDE_POTION",
    "BattleItemDecisionEvent.DECIDE_STALL_TOPUP",
    "BattleItemDecisionEvent.DECIDE_SCROLL",
    "snap",
  ]) {
    if (!itemDecisionConsumersText.includes(required)) {
      violations.push(`${rel(battleRulesFile)} must call item decisions through ${required}`);
    }
  }
  for (const legacy of ["decideGemUse", "decidePotion", "decideStallTopup", "decideScroll"]) {
    if (new RegExp(`\\b${legacy}\\s*\\(`).test(itemDecisionConsumersText)) {
      violations.push(`${rel(battleRulesFile)} must not call legacy item decision ${legacy}`);
    }
  }

  const battleDir = path.join(root, "src/battle");
  const allowedItemDecisionImporters = new Set([decideSurvivalActionFile]);
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    if (file === decideItemFile || file === decideGemFile || file === decideScrollFile) continue;
    const source = fs.readFileSync(file, "utf8");
    if (
      /from\s+["'][^"']*item\/decide-item\.js["']/.test(source) &&
      !allowedItemDecisionImporters.has(file)
    ) {
      violations.push(`${rel(file)} must not bypass survival action for item decision entry`);
    }
    if (
      /from\s+["'][^"']*item\/decide-item\.js["']/.test(source) &&
      /\b(?:decideGemUse|decidePotion|decideStallTopup|decideScroll)\b/.test(source)
    ) {
      violations.push(`${rel(file)} must import only the item decision entry`);
    }
    if (/from\s+["'][^"']*item\/decide-gem\.js["']/.test(source)) {
      violations.push(`${rel(file)} must not bypass item decision entry for gem`);
    }
    if (/from\s+["'][^"']*item\/decide-scroll\.js["']/.test(source)) {
      violations.push(`${rel(file)} must not bypass item decision entry for scroll`);
    }
  }
}

function checkItemScrollEntry() {
  const itemText = fs.readFileSync(decideScrollFile, "utf8");
  for (const required of [
    "BattleScrollDecisionEvent",
    "battleScrollDecisionEventHandlers",
    "DECIDE",
    "runBattleScrollDecision",
    "decideScroll",
    "scrollSwitch",
    "scrollCondition",
    "scrollRoundType",
    "conditionFacts",
    "event.roundType",
    "BattleScrollCoverageEvent.READ_COVERAGE",
    "runBattleScrollCoverage",
  ]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideScrollFile)} must own scroll gate ${required}`);
    }
  }
  if (/decideScroll\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideScrollFile)} must not expose opt/snap scroll input`);
  }
  if (/import\s*\{[^}]*\bisScrollCoveredByPlayerBuffs\b/.test(itemText)) {
    violations.push(`${rel(decideScrollFile)} must consume scroll coverage through one entry`);
  }
  const rulesText = readBattleActionRulesText();
  const scrollRule =
    rulesText.match(/name:\s*["']useScroll["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideScroll\(\s*opt\s*,\s*snap\s*\)/.test(scrollRule)) {
    violations.push(`${rel(battleRulesFile)} must pass scroll facts, not snap, to scroll`);
  }
  for (const legacy of ["scrollSwitch", "scrollCondition", "scrollRoundType"]) {
    if (rulesText.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble scroll rule gates directly`);
    }
  }
}

function checkItemScrollCoverageQuery() {
  if (!fs.existsSync(scrollCoverageFile)) {
    violations.push(`${rel(scrollCoverageFile)} must own scroll coverage query`);
    return;
  }
  if (!fs.existsSync(scrollCoverageTestFile)) {
    violations.push(`${rel(scrollCoverageTestFile)} must lock scroll coverage semantics`);
  }

  const ownerText = fs.readFileSync(scrollCoverageFile, "utf8");
  for (const required of [
    "BattleScrollCoverageEvent",
    "battleScrollCoverageEventHandlers",
    "runBattleScrollCoverage",
    "READ_COVERAGE",
    "isScrollCoveredByPlayerBuffs",
    "playerBuffs",
    "scrollFirst",
    "_scroll",
    "includes",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(scrollCoverageFile)} must own scroll coverage fact ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleScrollCoverageEvent\b|runBattleScrollCoverage\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(scrollCoverageFile)} may export only its event query entry`);
  }
  const coverageEntryBody =
    ownerText.match(/export function runBattleScrollCoverage\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/battleScrollCoverageEventHandlers\[event\.type\]/.test(coverageEntryBody)) {
    violations.push(`${rel(scrollCoverageFile)} entry must fail closed for invalid scroll coverage events`);
  }
  if (!/battleScrollCoverageEventHandlers\[event\?\.type\]/.test(coverageEntryBody)) {
    violations.push(`${rel(scrollCoverageFile)} entry must dispatch invalid scroll coverage events through optional type`);
  }
  const coverageTestText = fs.readFileSync(scrollCoverageTestFile, "utf8");
  if (!/runBattleScrollCoverage\(null\)/.test(coverageTestText)) {
    violations.push(`${rel(scrollCoverageTestFile)} must cover null scroll coverage events`);
  }

  const scrollText = fs.readFileSync(decideScrollFile, "utf8");
  if (
    /playerBuffs\s*\|\|\s*\[\]\)\.some|\.some\(\s*\(?\w+\)?\s*=>\s*\w+\.includes/.test(scrollText)
  ) {
    violations.push(`${rel(decideScrollFile)} must use scroll coverage query`);
  }

  const allowedProductionImporters = new Set([decideScrollFile]);
  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const file = path.join(entry.parentPath, entry.name);
    if (file.endsWith(".test.js")) continue;
    const text = fs.readFileSync(file, "utf8");
    if (
      /from\s+["'][^"']*scroll-coverage\.js["']/.test(text) &&
      !allowedProductionImporters.has(file)
    ) {
      violations.push(`${rel(file)} must not bypass scroll decision coverage query`);
    }
    if (/import\s*\{[^}]*\bisScrollCoveredByPlayerBuffs\b/.test(text)) {
      violations.push(`${rel(file)} must not import raw scroll coverage function`);
    }
  }
}

function checkItemGemEntry() {
  const itemText = fs.readFileSync(decideItemFile, "utf8");
  const gemText = fs.readFileSync(decideGemFile, "utf8");
  for (const required of [
    "BattleGemDecisionEvent",
    "battleGemDecisionEventHandlers",
    "DECIDE",
    "runBattleGemDecision",
    "decideGemUse",
    "event.gemName",
    "event?.healthPercent",
    "event?.manaPercent",
    "event?.spiritPercent",
  ]) {
    if (!itemText.includes(required) && !gemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} gem use must own fact ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleGemDecisionEvent\b|runBattleGemDecision\b)/.test(
      gemText
    )
  ) {
    violations.push(`${rel(decideGemFile)} may export only its event entry`);
  }
  const gemEntryBody =
    gemText.match(/export function runBattleGemDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(gemText)) {
    violations.push(`${rel(decideGemFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(gemEntryBody)) {
    violations.push(`${rel(decideGemFile)} entry must dispatch by handler table`);
  }
  if (/battleGemDecisionEventHandlers\[event\.type\]/.test(gemEntryBody)) {
    violations.push(`${rel(decideGemFile)} entry must fail closed for invalid gem decision events`);
  }
  if (!/battleGemDecisionEventHandlers\[event\?\.type\]/.test(gemEntryBody)) {
    violations.push(`${rel(decideGemFile)} entry must dispatch invalid gem decision events through optional type`);
  }
  const itemTestFile = path.join(root, "src/battle/item/decide-item.test.js");
  const itemTestText = fs.existsSync(itemTestFile) ? fs.readFileSync(itemTestFile, "utf8") : "";
  if (!/runBattleGemDecision\(null\)/.test(itemTestText)) {
    violations.push(`${rel(itemTestFile)} must cover null gem decision events`);
  }
  if (/decideGemUse\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must not expose opt/snap gem decision input`);
  }
  if (/decideGem\s*\(\s*opt\s*,\s*snap\s*,\s*gemName\s*\)/.test(gemText)) {
    violations.push(`${rel(decideGemFile)} must not expose opt/snap gem helper input`);
  }
  const rulesText = readBattleActionRulesText();
  const gemRule =
    rulesText.match(/name:\s*["']useGem["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideGemUse\(\s*opt\s*,\s*snap\s*\)/.test(gemRule)) {
    violations.push(`${rel(battleRulesFile)} must pass narrow facts, not snap, to gem use`);
  }
}

function checkItemStallTopupEntry() {
  const itemText = fs.readFileSync(decideItemFile, "utf8");
  for (const required of [
    "decideStallTopup",
    "event?.roundNow",
    "event?.roundAll",
    "event?.monsterFacts",
    "event?.overcharge",
    "event?.manaPercent",
    "event?.spiritPercent",
    "event.spiritOn",
    "event.globalTurn",
    "event.lastSpiritToggleGlobalTurn",
    "event?.playerBuffs",
  ]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} stall top-up must own fact ${required}`);
    }
  }
  if (/decideStallTopup\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must not expose opt/snap stall top-up input`);
  }
  const rulesText = readBattleActionRulesText();
  const stallRule =
    rulesText.match(/name:\s*["']stallTopup["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideStallTopup\(\s*opt\s*,\s*snap\s*\)/.test(stallRule)) {
    violations.push(`${rel(battleRulesFile)} must pass narrow facts, not snap, to stall top-up`);
  }
}

function checkPotionEntry() {
  const itemText = fs.readFileSync(decideItemFile, "utf8");
  for (const required of [
    "decidePotion",
    "itemOrderName",
    "itemOrderValue",
    "item",
    "conditionFacts",
    "event.deficitFacts",
  ]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} must own potion gate ${required}`);
    }
  }
  if (/decidePotion\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must not expose opt/snap potion input`);
  }
  const rulesText = readBattleActionRulesText();
  const deadSoonRule =
    rulesText.match(/name:\s*["']deadSoon["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decidePotion\(\s*opt\s*,\s*snap\s*\)/.test(deadSoonRule)) {
    violations.push(`${rel(battleRulesFile)} must pass potion facts, not snap`);
  }
  for (const legacy of ["itemOrderName", "itemOrderValue", "item"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(deadSoonRule)) {
      violations.push(`${rel(battleRulesFile)} must not assemble potion rule gates directly`);
    }
  }
}

function checkDefendEntry() {
  const ownerText = fs.readFileSync(decideDefendFile, "utf8");
  for (const required of [
    "BattleDefendDecisionEvent",
    "battleDefendDecisionEventHandlers",
    "DECIDE",
    "runBattleDefendDecision",
    "decideDefend",
    "defendDecisionInput",
    "BattleDefendFactsEvent.READ_DECISION",
    "runBattleDefendFacts",
    "defendCondition",
    "defend-command",
    "conditionFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideDefendFile)} must own defend gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleDefendDecisionEvent\b|runBattleDefendDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideDefendFile)} may export only its event entry`);
  }
  const defendEntryBody =
    ownerText.match(/export function runBattleDefendDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideDefendFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(defendEntryBody)) {
    violations.push(`${rel(decideDefendFile)} entry must dispatch by handler table`);
  }
  if (/decideDefend\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideDefendFile)} must not expose opt/snap defend input`);
  }
  const rulesText = readBattleActionRulesText();
  const defendRule =
    rulesText.match(/name:\s*["']defend["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideDefend\(\s*opt\s*,\s*snap\s*\)/.test(defendRule)) {
    violations.push(`${rel(battleRulesFile)} must pass condition facts, not snap, to defend`);
  }
  for (const legacy of ["defendCondition", "#ckey_defend"]) {
    if (defendRule.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble defend rule gates directly`);
    }
  }
}

function checkAutoPauseEntry() {
  const ownerText = fs.readFileSync(decideAutoPauseFile, "utf8");
  for (const required of [
    "BattleAutoPauseDecisionEvent",
    "battleAutoPauseDecisionEventHandlers",
    "DECIDE",
    "runBattleAutoPauseDecision",
    "decideAutoPause",
    "autoPauseDecisionInput",
    "BattleAutoPauseFactsEvent.READ_DECISION",
    "runBattleAutoPauseFacts",
    "autoPause",
    "pauseCondition",
    "conditionFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAutoPauseFile)} must own auto-pause gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleAutoPauseDecisionEvent\b|runBattleAutoPauseDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideAutoPauseFile)} may export only its event entry`);
  }
  const autoPauseEntryBody =
    ownerText.match(/export function runBattleAutoPauseDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideAutoPauseFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(autoPauseEntryBody)) {
    violations.push(`${rel(decideAutoPauseFile)} entry must dispatch by handler table`);
  }
  if (/decideAutoPause\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideAutoPauseFile)} must not expose opt/snap auto-pause input`);
  }
  const rulesText = readBattleActionRulesText();
  const pauseRule =
    rulesText.match(/name:\s*["']autoPause["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideAutoPause\(\s*opt\s*,\s*snap\s*\)/.test(pauseRule)) {
    violations.push(`${rel(battleRulesFile)} must pass condition facts, not snap, to auto-pause`);
  }
  for (const legacy of ["canAutoPause", "pauseCondition"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(pauseRule)) {
      violations.push(`${rel(battleRulesFile)} must not assemble auto-pause rule gates directly`);
    }
  }
}

function checkFleeEntry() {
  const ownerText = fs.readFileSync(decideFleeFile, "utf8");
  for (const required of [
    "BattleFleeDecisionEvent",
    "battleFleeDecisionEventHandlers",
    "DECIDE",
    "runBattleFleeDecision",
    "decideFlee",
    "fleeDecisionInput",
    "BattleFleeFactsEvent.READ_DECISION",
    "runBattleFleeFacts",
    "autoFlee",
    "fleeCondition",
    "flee-command",
    "conditionFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideFleeFile)} must own flee gate ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleFleeDecisionEvent\b|runBattleFleeDecision\b)/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(decideFleeFile)} may export only its event entry`);
  }
  const fleeEntryBody =
    ownerText.match(/export function runBattleFleeDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
    violations.push(`${rel(decideFleeFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(fleeEntryBody)) {
    violations.push(`${rel(decideFleeFile)} entry must dispatch by handler table`);
  }
  if (/decideFlee\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideFleeFile)} must not expose opt/snap flee input`);
  }
  const rulesText = readBattleActionRulesText();
  const fleeRule = rulesText.match(/name:\s*["']flee["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideFlee\(\s*opt\s*,\s*snap\s*\)/.test(fleeRule)) {
    violations.push(`${rel(battleRulesFile)} must pass condition facts, not snap, to flee`);
  }
  for (const legacy of ["canFlee", "autoFlee", "fleeCondition", "click-then-reload"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(fleeRule)) {
      violations.push(`${rel(battleRulesFile)} must not assemble flee rule gates directly`);
    }
  }
}

function checkAttackEntry() {
  if (fs.existsSync(decideTierFile)) {
    violations.push(
      `${rel(decideTierFile)} legacy spell-tier helper must stay deleted; tier decisions belong in runAttackDecision`
    );
  }
  if (fs.existsSync(decideSkillFile)) {
    violations.push(
      `${rel(decideSkillFile)} legacy technical skill helper must stay deleted; physical scoring belongs in physical-skill-scoring`
    );
  }
  if (fs.existsSync(pickElementFile)) {
    violations.push(
      `${rel(pickElementFile)} legacy technical element helper must stay deleted; auto element selection belongs in auto-element-selection`
    );
  }
  const ownerText = fs.readFileSync(decideAttackFile, "utf8");
  for (const required of [
    "runAttackDecision",
    "AttackDecisionEvent",
    "attackDecisionEventHandlers",
    "WILL_CLEAR_WITH_BIG_SKILL",
    "AttackPlanDecisionEvent.DECIDE",
    "runAttackPlanDecision",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAttackFile)} must own attack decision entry ${required}`);
    }
  }
  const attackPlanText = fs.readFileSync(attackPlanFile, "utf8");
  for (const required of [
    "AttackPlanDecisionEvent",
    "attackPlanDecisionEventHandlers",
    "DECIDE",
    "runAttackPlanDecision",
    "decideAttackPlan",
    "ATTACK_PLAN_STEPS",
    'capability: "focus"',
    'capability: "spiritToggle"',
    'capability: "spell"',
    'capability: "mercifulSingle"',
    'capability: "physicalUtility"',
    'capability: "defaultAttack"',
    "buildAttackPlanContext",
    "conditionFacts",
    "event.monsterFacts",
    "event.overcharge",
    "SpellAttackPlanEvent.DECIDE",
    "runSpellAttackPlan",
    "PhysicalSkillScoringEvent.SCORE_CANDIDATES",
    "runPhysicalSkillScoring",
    "PhysicalSkillRankingEvent.PICK_BY_UTILITY",
    "runPhysicalSkillRanking",
  ]) {
    if (!attackPlanText.includes(required)) {
      violations.push(`${rel(attackPlanFile)} must lock attack plan step ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!AttackPlanDecisionEvent\b|runAttackPlanDecision\b)/.test(
      attackPlanText
    )
  ) {
    violations.push(`${rel(attackPlanFile)} may export only its event entry`);
  }
  const attackPlanEntryBody =
    attackPlanText.match(/export function runAttackPlanDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(attackPlanText)) {
    violations.push(`${rel(attackPlanFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(attackPlanEntryBody)) {
    violations.push(`${rel(attackPlanFile)} entry must dispatch by handler table`);
  }
  if (!attackPlanText.includes("attackPlanDecisionEventHandlers[event?.type]")) {
    violations.push(`${rel(attackPlanFile)} must reject null attack plan events as noop plans`);
  }
  if (
    !/const ATTACK_PLAN_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "focus"[\s\S]*capability: "spiritToggle"[\s\S]*capability: "spell"[\s\S]*capability: "mercifulSingle"[\s\S]*capability: "physicalUtility"[\s\S]*capability: "defaultAttack"[\s\S]*\]\)/.test(
      attackPlanText
    )
  ) {
    violations.push(`${rel(attackPlanFile)} must own frozen attack plan step order`);
  }
  if (!/for\s*\(\s*const\s+step\s+of\s+ATTACK_PLAN_STEPS\s*\)/.test(attackPlanText)) {
    violations.push(`${rel(attackPlanFile)} must choose attack plans through ATTACK_PLAN_STEPS`);
  }
  const spellAttackPlanText = fs.readFileSync(spellAttackPlanFile, "utf8");
  for (const required of [
    "SpellAttackPlanEvent",
    "spellAttackPlanEventHandlers",
    "DECIDE",
    "runSpellAttackPlan",
    "decideSpellAttackPlan",
    "AutoElementSelectionEvent.SELECT",
    "runAutoElementSelection",
    "selectSpellTier",
    "highSkillCondition",
    "event.skillReady",
    "event.attackStatus",
  ]) {
    if (!spellAttackPlanText.includes(required)) {
      violations.push(`${rel(spellAttackPlanFile)} must own attack spell-tier decision ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!SpellAttackPlanEvent\b|runSpellAttackPlan\b)/.test(
      spellAttackPlanText
    )
  ) {
    violations.push(`${rel(spellAttackPlanFile)} may export only its event entry`);
  }
  const spellAttackEntryBody =
    spellAttackPlanText.match(/export function runSpellAttackPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(spellAttackPlanText)) {
    violations.push(`${rel(spellAttackPlanFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(spellAttackEntryBody)) {
    violations.push(`${rel(spellAttackPlanFile)} entry must dispatch by handler table`);
  }
  if (!spellAttackPlanText.includes("spellAttackPlanEventHandlers[event?.type]")) {
    violations.push(`${rel(spellAttackPlanFile)} must reject null spell attack plan events`);
  }
  if (/decideAttack\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideAttackFile)} must not expose opt/snap attack input`);
  }
  const attackDecisionEntryBody =
    ownerText.match(/export function runAttackDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (
    /\bexport\s+(?:function|const)\s+(?!AttackDecisionEvent\b|runAttackDecision\b)/.test(ownerText)
  ) {
    violations.push(`${rel(decideAttackFile)} may export only its event decision entry`);
  }
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE_PLAN\]/.test(ownerText)) {
    violations.push(`${rel(decideAttackFile)} must route events through a frozen handler table`);
  }
  for (const required of ["ATTACK_PLAN_CLEAR_PREDICATES", "attackPlanWillClearWithBigSkill"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAttackFile)} must route attack clear queries through ${required}`);
    }
  }
  const willClearBody =
    ownerText.match(/function willClearWithBigSkill\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/plan\.type\s*===/.test(willClearBody)) {
    violations.push(`${rel(decideAttackFile)} must not re-interpret plan type inside willClearWithBigSkill`);
  }
  if (/event\.type\s*===/.test(attackDecisionEntryBody)) {
    violations.push(`${rel(decideAttackFile)} entry must dispatch by handler table`);
  }
  if (!ownerText.includes("const decisionEvent = event ?? {}")) {
    violations.push(`${rel(decideAttackFile)} must route null attack decision events through the default attack-plan path`);
  }
  if (/\|\|\s*attackDecisionEventHandlers\[EVENT_DECIDE_PLAN\]/.test(ownerText)) {
    violations.push(`${rel(decideAttackFile)} must reject unknown attack decision events instead of falling back to DECIDE_PLAN`);
  }
  for (const required of ["unknownAttackDecisionEvent", "kind: \"noop\"", "eventType: decisionEvent.type"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAttackFile)} must preserve typed evidence for unknown attack decision events`);
    }
  }
  const attackDecisionTestText = fs.readFileSync(
    path.join(root, "src/battle/attack/decide-attack.test.js"),
    "utf8"
  );
  if (
    attackDecisionTestText.includes("unknown attack decision events use the attack-plan default path")
  ) {
    violations.push(`${rel(decideAttackFile)} tests must not lock unknown attack decision fallback to DECIDE_PLAN`);
  }
  if (
    !attackDecisionTestText.includes("rejects unknown attack decision events without choosing an attack plan") ||
    !attackDecisionTestText.includes("unknownAttackDecisionEvent")
  ) {
    violations.push(`${rel(decideAttackFile)} tests must cover rejected unknown attack decision events`);
  }
  if (
    !attackDecisionTestText.includes("null attack decision events use the attack-plan default path")
  ) {
    violations.push(`${rel(decideAttackFile)} tests must cover null attack decision events`);
  }
  if (!attackDecisionTestText.includes("rejects unknown attack plan events as noop plans")) {
    violations.push(`${rel(attackPlanFile)} tests must cover unknown attack plan events`);
  }
  if (!attackDecisionTestText.includes("runAttackPlanDecision(null)")) {
    violations.push(`${rel(attackPlanFile)} tests must cover null attack plan events`);
  }
  if (!attackDecisionTestText.includes("rejects unknown spell attack plan events as empty spell plans")) {
    violations.push(`${rel(spellAttackPlanFile)} tests must cover unknown spell attack plan events`);
  }
  if (!attackDecisionTestText.includes("runSpellAttackPlan(null)")) {
    violations.push(`${rel(spellAttackPlanFile)} tests must cover null spell attack plan events`);
  }
  if (!attackDecisionTestText.includes("rejects unknown auto-element events as no selected element")) {
    violations.push(`${rel(autoElementSelectionFile)} tests must cover unknown auto-element events`);
  }
  if (!attackDecisionTestText.includes("runAutoElementSelection(null)")) {
    violations.push(`${rel(autoElementSelectionFile)} tests must cover null auto-element events`);
  }
  if (!attackPlanText.includes("dynamicHealLog")) {
    violations.push(`${rel(attackPlanFile)} must pass ranking debug option into attack ranking`);
  }
  const attackActionText = fs.readFileSync(decideAttackActionFile, "utf8");
  for (const required of [
    "BattleAttackActionEvent",
    "DECIDE",
    "WILL_CLEAR_WITH_BIG_SKILL",
    "AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL",
    "runBattleAttackAction",
    "BattleAttackFactsEvent.READ_ACTION",
    "runBattleAttackFacts",
    "runAttackDecision",
  ]) {
    if (!attackActionText.includes(required)) {
      violations.push(`${rel(decideAttackActionFile)} must own attack action ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleAttackActionEvent\b|runBattleAttackAction\b)/.test(
      attackActionText
    )
  ) {
    violations.push(`${rel(decideAttackActionFile)} may export only its event entry`);
  }
  const scoringText = fs.readFileSync(physicalSkillScoringFile, "utf8");
  for (const required of [
    "PhysicalSkillScoringEvent",
    "physicalSkillScoringEventHandlers",
    "SCORE_CANDIDATES",
    "runPhysicalSkillScoring",
    "scorePhysicalSkillCandidates",
    "PhysicalSkillRankingEvent.AOE_SCORE",
    "runPhysicalSkillRanking",
    "event.skillReady",
    "skillBaseScore",
    "PHYSICAL_SKILL_SCORERS",
    "OFC: scoreOfcSkill",
    "FRD: scoreFrdSkill",
    "T3: scoreT3Skill",
    "T2: scoreT2Skill",
    "T1: scoreT1Skill",
    "PHYSICAL_SKILL_BLOCKERS",
    "PHYSICAL_SKILL_EXPLAINERS",
    "physicalSkillBlockReason",
    "explainPhysicalSkillScore",
  ]) {
    if (!scoringText.includes(required)) {
      violations.push(
        `${rel(physicalSkillScoringFile)} must own physical skill scoring ${required}`
      );
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!PhysicalSkillScoringEvent\b|runPhysicalSkillScoring\b)/.test(
      scoringText
    )
  ) {
    violations.push(`${rel(physicalSkillScoringFile)} may export only its event entry`);
  }
  const scoringEntryBody =
    scoringText.match(/export function runPhysicalSkillScoring\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_SCORE_CANDIDATES\]/.test(scoringText)) {
    violations.push(`${rel(physicalSkillScoringFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(scoringEntryBody)) {
    violations.push(`${rel(physicalSkillScoringFile)} entry must dispatch by handler table`);
  }
  if (!scoringText.includes("physicalSkillScoringEventHandlers[event?.type]")) {
    violations.push(`${rel(physicalSkillScoringFile)} must reject null physical skill scoring events`);
  }
  const scoringTestText = fs.readFileSync(
    path.join(root, "src/battle/attack/physical-skill-scoring.test.js"),
    "utf8"
  );
  if (!scoringTestText.includes("runPhysicalSkillScoring(null)")) {
    violations.push(`${rel(physicalSkillScoringFile)} tests must cover null physical skill scoring events`);
  }
  const rankingText = fs.readFileSync(physicalSkillRankingFile, "utf8");
  for (const required of [
    "PhysicalSkillRankingEvent",
    "physicalSkillRankingEventHandlers",
    "PICK_BY_UTILITY",
    "AOE_SCORE",
    "runPhysicalSkillRanking",
    "pickByUtility",
    "aoeScore",
  ]) {
    if (!rankingText.includes(required)) {
      violations.push(`${rel(physicalSkillRankingFile)} must own physical skill ranking ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!PhysicalSkillRankingEvent\b|runPhysicalSkillRanking\b)/.test(
      rankingText
    )
  ) {
    violations.push(`${rel(physicalSkillRankingFile)} may export only its event entry`);
  }
  const rankingEntryBody =
    rankingText.match(/export function runPhysicalSkillRanking\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (
    !/Object\.freeze\(\{[\s\S]*\[EVENT_PICK_BY_UTILITY\][\s\S]*\[EVENT_AOE_SCORE\]/.test(
      rankingText
    )
  ) {
    violations.push(`${rel(physicalSkillRankingFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(rankingEntryBody)) {
    violations.push(`${rel(physicalSkillRankingFile)} entry must dispatch by handler table`);
  }
  if (!rankingText.includes("physicalSkillRankingEventHandlers[event?.type]")) {
    violations.push(`${rel(physicalSkillRankingFile)} must reject null physical skill ranking events`);
  }
  const rankingTestText = fs.readFileSync(
    path.join(root, "src/battle/attack/physical-skill-ranking.test.js"),
    "utf8"
  );
  if (!rankingTestText.includes("runPhysicalSkillRanking(null)")) {
    violations.push(`${rel(physicalSkillRankingFile)} tests must cover null physical skill ranking events`);
  }
  const scoreContextBody =
    scoringText.match(/function scoreSkillContextual\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/switch\s*\(\s*skill\s*\)/.test(scoreContextBody)) {
    violations.push(`${rel(physicalSkillScoringFile)} must dispatch physical skill scoring through PHYSICAL_SKILL_SCORERS`);
  }
  if (/skill\s*===/.test(scoringText)) {
    violations.push(`${rel(physicalSkillScoringFile)} must route physical skill-specific rulings through tables`);
  }
  if (
    !scoringText.includes("BigSkillCatalogEvent.READ_SPEC") ||
    !scoringText.includes("runBigSkillCatalog")
  ) {
    violations.push(`${rel(physicalSkillScoringFile)} must read OFC/FRD specs through catalog`);
  }
  if (/["']1111["']|["']1101["']/.test(scoringText)) {
    violations.push(`${rel(physicalSkillScoringFile)} must not hard-code OFC/FRD skill ids`);
  }
  const autoElementText = fs.readFileSync(autoElementSelectionFile, "utf8");
  for (const required of [
    "AutoElementSelectionEvent",
    "autoElementSelectionEventHandlers",
    "SELECT",
    "runAutoElementSelection",
    "selectAutoElement",
    "autoElementPool",
    "target.resists",
    "ELEMENT_TO_STATUS",
    "DEFAULT_POOL",
  ]) {
    if (!autoElementText.includes(required)) {
      violations.push(
        `${rel(autoElementSelectionFile)} must own auto element selection ${required}`
      );
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!AutoElementSelectionEvent\b|runAutoElementSelection\b)/.test(
      autoElementText
    )
  ) {
    violations.push(`${rel(autoElementSelectionFile)} may export only its event entry`);
  }
  const autoElementEntryBody =
    autoElementText.match(/export function runAutoElementSelection\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_SELECT\]/.test(autoElementText)) {
    violations.push(`${rel(autoElementSelectionFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(autoElementEntryBody)) {
    violations.push(`${rel(autoElementSelectionFile)} entry must dispatch by handler table`);
  }
  if (!autoElementText.includes("autoElementSelectionEventHandlers[event?.type]")) {
    violations.push(`${rel(autoElementSelectionFile)} must reject null auto-element events`);
  }
  if (
    !/const ELEMENT_TO_STATUS = Object\.freeze\(\{/.test(autoElementText) ||
    !/const DEFAULT_POOL = Object\.freeze\(\[/.test(autoElementText)
  ) {
    violations.push(`${rel(autoElementSelectionFile)} must own frozen auto-element decision tables`);
  }
  const rulesText = readBattleActionRulesText();
  const attackRule =
    rulesText.match(/name:\s*["']attack["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (
    !rulesText.includes("BattleAttackActionEvent.DECIDE") ||
    !rulesText.includes("runBattleAttackAction")
  ) {
    violations.push(`${rel(battleRulesFile)} must route attack through runBattleAttackAction`);
  }
  if (/decideAttackAction\(\s*snap\s*,\s*actionOptions\s*\)/.test(rulesText)) {
    violations.push(`${rel(battleRulesFile)} must not call attack action through old two-arg path`);
  }
  if (/decideAttack\(\s*opt\s*,\s*snap\s*\)/.test(attackRule)) {
    violations.push(`${rel(battleRulesFile)} must pass attack facts, not snap`);
  }
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const file = path.join(entry.parentPath, entry.name);
      if (file.endsWith(".test.js")) continue;
      const text = fs.readFileSync(file, "utf8");
      if (/from\s+["'][^"']*decide-tier\.js["']/.test(text)) {
        violations.push(`${rel(file)} must not import legacy decide-tier.js`);
      }
      if (/from\s+["'][^"']*decide-skill\.js["']/.test(text)) {
        violations.push(`${rel(file)} must not import legacy decide-skill.js`);
      }
      if (/from\s+["'][^"']*pick-element\.js["']/.test(text)) {
        violations.push(`${rel(file)} must not import legacy pick-element.js`);
      }
      if (
        file !== attackPlanFile &&
        /from\s+["'][^"']*physical-skill-scoring\.js["']/.test(text)
      ) {
        violations.push(`${rel(file)} must not bypass runAttackDecision for physical skill scoring`);
      }
      if (
        file !== attackPlanFile &&
        file !== physicalSkillScoringFile &&
        /from\s+["'][^"']*physical-skill-ranking\.js["']/.test(text)
      ) {
        violations.push(`${rel(file)} must not bypass runAttackDecision for physical skill ranking`);
      }
      if (
        file !== spellAttackPlanFile &&
        /from\s+["'][^"']*auto-element-selection\.js["']/.test(text)
      ) {
        violations.push(`${rel(file)} must not bypass runAttackDecision for auto element selection`);
      }
    }
  }
}

function checkBattleRuleFactMappers() {
  if (fs.existsSync(ruleFactsFile)) {
    violations.push(`${rel(ruleFactsFile)} generic rule fact mapper must stay retired`);
  }
  if (fs.existsSync(legacyAttackFactsFile)) {
    violations.push(
      `${rel(legacyAttackFactsFile)} must stay retired; attack facts belong in attack`
    );
  }
  const ruleFactsText = fs.existsSync(ruleFactsFile) ? fs.readFileSync(ruleFactsFile, "utf8") : "";
  const attackFactsText = fs.readFileSync(attackFactsFile, "utf8");
  const itemFactsText = fs.readFileSync(itemFactsFile, "utf8");
  const buffFactsText = fs.readFileSync(buffFactsFile, "utf8");
  const debuffFactsText = fs.readFileSync(debuffFactsFile, "utf8");
  const criticalBuffFactsText = fs.readFileSync(criticalBuffFactsFile, "utf8");
  const fleeFactsText = fs.readFileSync(fleeFactsFile, "utf8");
  const autoPauseFactsText = fs.readFileSync(autoPauseFactsFile, "utf8");
  const defendFactsText = fs.readFileSync(defendFactsFile, "utf8");
  for (const retired of ["gemFacts", "potionFacts", "stallTopupFacts", "scrollFacts"]) {
    if (new RegExp(`export\\s+function\\s+${retired}\\s*\\(`).test(ruleFactsText)) {
      violations.push(`${rel(ruleFactsFile)} item fact mapper ${retired} belongs in item facts`);
    }
  }
  for (const retired of ["buffFacts", "channelFacts", "infusionFacts"]) {
    if (new RegExp(`export\\s+function\\s+${retired}\\s*\\(`).test(ruleFactsText)) {
      violations.push(`${rel(ruleFactsFile)} buff fact mapper ${retired} belongs in buff facts`);
    }
  }
  for (const retired of ["allDebuffFacts", "singleDebuffFacts", "burstControlFacts"]) {
    if (new RegExp(`export\\s+function\\s+${retired}\\s*\\(`).test(ruleFactsText)) {
      violations.push(
        `${rel(ruleFactsFile)} debuff fact mapper ${retired} belongs in debuff facts`
      );
    }
  }
  if (/export\s+function\s+criticalBuffFacts\s*\(/.test(ruleFactsText)) {
    violations.push(
      `${rel(ruleFactsFile)} critical buff fact mapper belongs in critical buff guard facts`
    );
  }
  for (const retired of ["fleeFacts", "autoPauseFacts", "defendFacts", "conditionFacts"]) {
    if (new RegExp(`export\\s+(?:function|const)\\s+${retired}\\b`).test(ruleFactsText)) {
      violations.push(
        `${rel(ruleFactsFile)} condition action fact mapper ${retired} belongs in its capability facts`
      );
    }
  }
  for (const required of [
    "BattleItemFactsEvent",
    "battleItemFactsEventHandlers",
    "runBattleItemFacts",
    "READ_GEM",
    "READ_POTION",
    "READ_STALL_TOPUP",
    "READ_SCROLL",
    "gemFacts",
    "potionFacts",
    "stallTopupFacts",
    "scrollFacts",
  ]) {
    if (!itemFactsText.includes(required)) {
      violations.push(`${rel(itemFactsFile)} must own item fact query ${required}`);
    }
  }
  for (const legacy of ["gemFacts", "potionFacts", "stallTopupFacts", "scrollFacts"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(itemFactsText)) {
      violations.push(`${rel(itemFactsFile)} must not export legacy item fact mapper ${legacy}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleItemFactsEvent\b|runBattleItemFacts\b)/.test(
      itemFactsText
    )
  ) {
    violations.push(`${rel(itemFactsFile)} may export only its event entry`);
  }
  const itemFactsTestFile = path.join(root, "src/battle/item/item-facts.test.js");
  const itemFactsTestText = fs.existsSync(itemFactsTestFile)
    ? fs.readFileSync(itemFactsTestFile, "utf8")
    : "";
  if (/battleItemFactsEventHandlers\[event\.type\]/.test(itemFactsText)) {
    violations.push(`${rel(itemFactsFile)} entry must fail closed for invalid item facts events`);
  }
  if (!/battleItemFactsEventHandlers\[event\?\.type\]/.test(itemFactsText)) {
    violations.push(`${rel(itemFactsFile)} entry must dispatch invalid item facts events through optional type`);
  }
  if (!itemFactsTestText.includes("rejects unknown item facts events")) {
    violations.push(`${rel(itemFactsTestFile)} must cover unknown item facts events`);
  }
  if (!/runBattleItemFacts\(null\)/.test(itemFactsTestText)) {
    violations.push(`${rel(itemFactsTestFile)} must cover null item facts events`);
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(itemFactsText)) {
    violations.push(`${rel(itemFactsFile)} must not depend on generic rule fact mappers`);
  }
  for (const required of [
    "BattleBuffFactsEvent",
    "battleBuffFactsEventHandlers",
    "runBattleBuffFacts",
    "READ_PREPARATION",
    "buffPreparationFacts",
  ]) {
    if (!buffFactsText.includes(required)) {
      violations.push(`${rel(buffFactsFile)} must own buff fact query ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleBuffFactsEvent\b|runBattleBuffFacts\b)/.test(
      buffFactsText
    )
  ) {
    violations.push(`${rel(buffFactsFile)} may export only its event query entry`);
  }
  const buffFactsEntryBody =
    buffFactsText.match(/export function runBattleBuffFacts\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_PREPARATION\]/.test(buffFactsText)) {
    violations.push(`${rel(buffFactsFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(buffFactsEntryBody)) {
    violations.push(`${rel(buffFactsFile)} entry must dispatch by handler table`);
  }
  const buffFactsTestFile = path.join(root, "src/battle/buff/buff-facts.test.js");
  const buffFactsTestText = fs.existsSync(buffFactsTestFile)
    ? fs.readFileSync(buffFactsTestFile, "utf8")
    : "";
  if (/battleBuffFactsEventHandlers\[event\.type\]/.test(buffFactsText)) {
    violations.push(`${rel(buffFactsFile)} entry must fail closed for invalid buff facts events`);
  }
  if (!/battleBuffFactsEventHandlers\[event\?\.type\]/.test(buffFactsText)) {
    violations.push(`${rel(buffFactsFile)} entry must dispatch invalid buff facts events through optional type`);
  }
  if (!buffFactsTestText.includes("rejects unknown buff facts events")) {
    violations.push(`${rel(buffFactsTestFile)} must cover unknown buff facts events`);
  }
  if (!/runBattleBuffFacts\(null\)/.test(buffFactsTestText)) {
    violations.push(`${rel(buffFactsTestFile)} must cover null buff facts events`);
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(buffFactsText)) {
    violations.push(`${rel(buffFactsFile)} must not depend on generic rule fact mappers`);
  }
  for (const retired of ["buffFacts", "channelFacts", "infusionFacts"]) {
    if (new RegExp(`export\\s+function\\s+${retired}\\s*\\(`).test(buffFactsText)) {
      violations.push(`${rel(buffFactsFile)} must use one buffPreparationFacts mapper`);
    }
  }
  for (const required of [
    "BattleDebuffFactsEvent",
    "battleDebuffFactsEventHandlers",
    "runBattleDebuffFacts",
    "READ_BURST_CONTROL",
    "READ_BOSS_IMPERIL",
    "READ_DEBUFF_ACTION",
    "debuffActionFacts",
    "burstControlFacts",
    "bossImperilFacts",
  ]) {
    if (!debuffFactsText.includes(required)) {
      violations.push(`${rel(debuffFactsFile)} must own debuff fact query ${required}`);
    }
  }
  for (const legacy of ["debuffActionFacts", "burstControlFacts", "bossImperilFacts"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(debuffFactsText)) {
      violations.push(`${rel(debuffFactsFile)} must not export legacy debuff fact mapper ${legacy}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleDebuffFactsEvent\b|runBattleDebuffFacts\b)/.test(
      debuffFactsText
    )
  ) {
    violations.push(`${rel(debuffFactsFile)} may export only its event entry`);
  }
  const debuffFactsTestFile = path.join(root, "src/battle/debuff/debuff-facts.test.js");
  const debuffFactsTestText = fs.existsSync(debuffFactsTestFile)
    ? fs.readFileSync(debuffFactsTestFile, "utf8")
    : "";
  if (/battleDebuffFactsEventHandlers\[event\.type\]/.test(debuffFactsText)) {
    violations.push(`${rel(debuffFactsFile)} entry must fail closed for invalid debuff facts events`);
  }
  if (!/battleDebuffFactsEventHandlers\[event\?\.type\]/.test(debuffFactsText)) {
    violations.push(`${rel(debuffFactsFile)} entry must dispatch invalid debuff facts events through optional type`);
  }
  if (!debuffFactsTestText.includes("rejects unknown debuff facts events")) {
    violations.push(`${rel(debuffFactsTestFile)} must cover unknown debuff facts events`);
  }
  if (!/runBattleDebuffFacts\(null\)/.test(debuffFactsTestText)) {
    violations.push(`${rel(debuffFactsTestFile)} must cover null debuff facts events`);
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(debuffFactsText)) {
    violations.push(`${rel(debuffFactsFile)} must not depend on generic rule fact mappers`);
  }
  for (const retired of ["allDebuffFacts", "singleDebuffFacts"]) {
    if (new RegExp(`export\\s+function\\s+${retired}\\s*\\(`).test(debuffFactsText)) {
      violations.push(`${rel(debuffFactsFile)} must use one debuffActionFacts mapper`);
    }
  }
  for (const spec of [
    {
      file: criticalBuffFactsFile,
      text: criticalBuffFactsText,
      eventName: "CriticalBuffFactsEvent",
      handlerName: "criticalBuffFactsEventHandlers",
      runName: "runCriticalBuffFacts",
      mapperName: "criticalBuffFacts",
      testFile: path.join(root, "src/battle/critical-buff-guard/critical-buff-facts.test.js"),
      unknownEventText: "rejects unknown critical buff facts events",
      required: ["manaPercent", "playerEffects"],
    },
    {
      file: fleeFactsFile,
      text: fleeFactsText,
      eventName: "BattleFleeFactsEvent",
      handlerName: "battleFleeFactsEventHandlers",
      runName: "runBattleFleeFacts",
      mapperName: "fleeFacts",
      testFile: path.join(root, "src/battle/escape/flee-facts.test.js"),
      unknownEventText: "rejects unknown flee facts events",
      required: ["conditionFacts"],
    },
    {
      file: autoPauseFactsFile,
      text: autoPauseFactsText,
      eventName: "BattleAutoPauseFactsEvent",
      handlerName: "battleAutoPauseFactsEventHandlers",
      runName: "runBattleAutoPauseFacts",
      mapperName: "autoPauseFacts",
      testFile: path.join(root, "src/battle/pause/auto-pause-facts.test.js"),
      unknownEventText: "rejects unknown auto-pause facts events",
      required: ["conditionFacts"],
    },
    {
      file: defendFactsFile,
      text: defendFactsText,
      eventName: "BattleDefendFactsEvent",
      handlerName: "battleDefendFactsEventHandlers",
      runName: "runBattleDefendFacts",
      mapperName: "defendFacts",
      testFile: path.join(root, "src/battle/defense/defend-facts.test.js"),
      unknownEventText: "rejects unknown defend facts events",
      required: ["conditionFacts"],
    },
  ]) {
    for (const required of [
      spec.eventName,
      spec.handlerName,
      spec.runName,
      "READ_DECISION",
      spec.mapperName,
      ...spec.required,
    ]) {
      if (!spec.text.includes(required)) {
        violations.push(`${rel(spec.file)} must own facts query ${required}`);
      }
    }
    const exportOnly = new RegExp(
      `\\bexport\\s+(?:function|const)\\s+(?!${spec.eventName}\\b|${spec.runName}\\b)`
    );
    if (exportOnly.test(spec.text)) {
      violations.push(`${rel(spec.file)} may export only its event query entry`);
    }
    const entryBody =
      spec.text.match(
        new RegExp(`export function ${spec.runName}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`)
      )?.[0] ||
      "";
    if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_DECISION\]/.test(spec.text)) {
      violations.push(`${rel(spec.file)} must route events through a frozen handler table`);
    }
    if (/event\.type\s*===/.test(entryBody)) {
      violations.push(`${rel(spec.file)} entry must dispatch by handler table`);
    }
    if (new RegExp(`${spec.handlerName}\\[event\\.type\\]`).test(entryBody)) {
      violations.push(`${rel(spec.file)} entry must fail closed for invalid facts events`);
    }
    if (!new RegExp(`${spec.handlerName}\\[event\\?\\.type\\]`).test(entryBody)) {
      violations.push(`${rel(spec.file)} entry must dispatch invalid facts events through optional type`);
    }
    const testText = fs.existsSync(spec.testFile)
      ? fs.readFileSync(spec.testFile, "utf8")
      : "";
    if (!testText.includes(spec.unknownEventText)) {
      violations.push(`${rel(spec.testFile)} must cover unknown facts events`);
    }
    if (!new RegExp(`${spec.runName}\\(null\\)`).test(testText)) {
      violations.push(`${rel(spec.testFile)} must cover null facts events`);
    }
    if (/from\s+["'][^"']*rule-facts\.js["']/.test(spec.text)) {
      violations.push(`${rel(spec.file)} must not depend on generic rule fact mappers`);
    }
  }
  const rulesText = readBattleActionRulesText();
  if (/conditionFacts\s*:\s*conditionFacts\s*\(\s*snap\s*\)/.test(rulesText)) {
    violations.push(
      `${rel(battleRulesFile)} must use named fact mappers, not assemble condition facts`
    );
  }
  for (const required of [
    "BattleAttackFactsEvent",
    "battleAttackFactsEventHandlers",
    "runBattleAttackFacts",
    "READ_ACTION",
    "attackFacts",
    "conditionFacts",
    "monsterFacts",
  ]) {
    if (!attackFactsText.includes(required)) {
      violations.push(`${rel(attackFactsFile)} must own attack fact mapper ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleAttackFactsEvent\b|runBattleAttackFacts\b)/.test(
      attackFactsText
    )
  ) {
    violations.push(`${rel(attackFactsFile)} may export only its event entry`);
  }
  const attackFactsEntryBody =
    attackFactsText.match(/export function runBattleAttackFacts\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_ACTION\]/.test(attackFactsText)) {
    violations.push(`${rel(attackFactsFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(attackFactsEntryBody)) {
    violations.push(`${rel(attackFactsFile)} entry must dispatch by handler table`);
  }
  if (!attackFactsText.includes("battleAttackFactsEventHandlers[event?.type]")) {
    violations.push(`${rel(attackFactsFile)} must reject null attack facts events as empty facts`);
  }
  const attackActionTestText = fs.readFileSync(
    path.join(root, "src/battle/attack/decide-attack-action.test.js"),
    "utf8"
  );
  if (!attackActionTestText.includes("rejects unknown attack facts events as empty facts")) {
    violations.push(`${rel(attackFactsFile)} tests must cover unknown attack facts events`);
  }
  if (!attackActionTestText.includes("runBattleAttackFacts(null)")) {
    violations.push(`${rel(attackFactsFile)} tests must cover null attack facts events`);
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(attackFactsText)) {
    violations.push(`${rel(attackFactsFile)} must not depend on generic rule fact mappers`);
  }
  const debuffFactsOwnerText = fs.readFileSync(debuffFactsFile, "utf8");
  const burstFacts =
    debuffFactsOwnerText.match(/function burstControlFacts\(snap\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  for (const retired of [
    "conditionFacts",
    "attackStatus",
    "channeling",
    "aliveCount",
    "fightingStyle",
    "overcharge",
    "spellAoe",
    "skillOTOS",
  ]) {
    if (burstFacts.includes(retired)) {
      violations.push(
        `${rel(debuffFactsFile)} burstControlFacts must not rebuild attack ${retired}`
      );
    }
  }

  const allowedAttackFactsImporters = new Set([decideAttackActionFile]);
  const allowedItemFactsImporters = new Set([decideItemFile]);
  const allowedBuffFactsImporters = new Set([decideBuffPreparationFile]);
  const allowedDebuffFactsImporters = new Set([decideOffensiveDebuffFile]);
  const allowedCriticalBuffFactsImporters = new Set([decideCriticalBuffFile]);
  const allowedFleeFactsImporters = new Set([decideFleeFile]);
  const allowedAutoPauseFactsImporters = new Set([decideAutoPauseFile]);
  const allowedDefendFactsImporters = new Set([decideDefendFile]);
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const file = path.join(entry.parentPath, entry.name);
      if (file.endsWith(".test.js")) continue;
      const text = fs.readFileSync(file, "utf8");
      if (/from\s+["'][^"']*rule-facts\.js["']/.test(text)) {
        violations.push(`${rel(file)} must not import retired generic rule fact mapping`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)attack-facts\.js["']/.test(text) &&
        !allowedAttackFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass attack action entry for attack fact mapping`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)item-facts\.js["']/.test(text) &&
        !allowedItemFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass item decision entry for item fact mapping`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)buff-facts\.js["']/.test(text) &&
        !allowedBuffFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass buff preparation entry for buff facts`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)debuff-facts\.js["']/.test(text) &&
        !allowedDebuffFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass offensive debuff entry for debuff facts`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)critical-buff-facts\.js["']/.test(text) &&
        !allowedCriticalBuffFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass critical buff entry for fact mapping`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)flee-facts\.js["']/.test(text) &&
        !allowedFleeFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass flee entry for fact mapping`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)auto-pause-facts\.js["']/.test(text) &&
        !allowedAutoPauseFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass auto-pause entry for fact mapping`);
      }
      if (
        /from\s+["'][^"']*(?:^|\/)defend-facts\.js["']/.test(text) &&
        !allowedDefendFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass defend entry for fact mapping`);
      }
    }
  }
}

function checkBattleStallMode() {
  const ownerText = fs.readFileSync(stallModeFile, "utf8");
  for (const required of [
    "BattleStallModeEvent",
    "battleStallModeEventHandlers",
    "runBattleStallModeAutomation",
    "READ_ACTIVE",
    "READ_TOPUP_CANDIDATES",
    "event?.monsterFacts",
    "event?.overcharge",
    "event?.manaPercent",
    "event?.spiritPercent",
    "BattlePlayerBuffStateEvent.READ_ACTIVE",
    "runBattlePlayerBuffState",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(stallModeFile)} must own ${required}`);
    }
  }
  const activeBody = ownerText.match(/function isStallActive\(event\) \{[\s\S]*?\n\}/)?.[0];
  if (/\bevent\.snap\b|\bsnap\?\.view\b|\bsnap\.view\b/.test(activeBody || "")) {
    violations.push(`${rel(stallModeFile)} active query must consume narrow facts, not snap`);
  }
  if (/\bevent\.snap\b/.test(ownerText)) {
    violations.push(`${rel(stallModeFile)} must not consume snap-shaped event input`);
  }
  const entryBody =
    ownerText.match(/export function runBattleStallModeAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_ACTIVE\][\s\S]*\[EVENT_READ_TOPUP_CANDIDATES\]/.test(ownerText)) {
    violations.push(`${rel(stallModeFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(stallModeFile)} entry must dispatch by handler table`);
  }
  if (/battleStallModeEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(`${rel(stallModeFile)} entry must fail closed for invalid stall mode events`);
  }
  if (!/battleStallModeEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(`${rel(stallModeFile)} entry must dispatch invalid stall mode events through optional type`);
  }
  const stallModeTest = path.join(root, "src/battle/battle-stall-mode.test.js");
  const stallModeTestText = fs.readFileSync(stallModeTest, "utf8");
  if (!stallModeTestText.includes("rejects invalid stall mode events without reading player buff state")) {
    violations.push(`${rel(stallModeTest)} must cover invalid stall mode events`);
  }
  if (!/runBattleStallModeAutomation\(null\)/.test(stallModeTestText)) {
    violations.push(`${rel(stallModeTest)} must cover null stall mode events`);
  }
  const allowedAliveHpFiles = new Set([
    itemFactsFile,
    decideGemFile,
    dynamicThresholdFile,
  ]);
  const battleDir = path.join(root, "src/battle");
  for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const source = fs.readFileSync(file, "utf8");
    if (/\bstallActiveFacts\b/.test(source)) {
      violations.push(`${rel(file)} must ask battle-stall-mode for stall-active facts`);
    }
    if (/\baliveMonsterHpPercents\b/.test(source) && !allowedAliveHpFiles.has(file)) {
      violations.push(`${rel(file)} must not assemble stall alive HP facts directly`);
    }
  }
  const economyText = fs.readFileSync(potionEconomyFile, "utf8");
  for (const required of [
    "BattlePotionEconomyEvent",
    "battlePotionEconomyEventHandlers",
    "runBattlePotionEconomy",
    "IS_WASTEFUL",
    "isPotionWasteful",
  ]) {
    if (!economyText.includes(required)) {
      violations.push(`${rel(potionEconomyFile)} must own potion economy query ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattlePotionEconomyEvent\b|runBattlePotionEconomy\b)/.test(
      economyText
    )
  ) {
    violations.push(`${rel(potionEconomyFile)} may export only its event query entry`);
  }
  for (const legacy of ["isStallMode", "stallTopupCandidates"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(economyText)) {
      violations.push(`${rel(potionEconomyFile)} legacy ${legacy} belongs in battle stall entry`);
    }
  }
  const dynamicThresholdText = fs.readFileSync(dynamicThresholdFile, "utf8");
  for (const required of [
    "BattleDynamicThresholdEvent",
    "battleDynamicThresholdEventHandlers",
    "runBattleDynamicThreshold",
    "READ_HP_THRESHOLD",
    "estimateRemainingTurns",
    "dynamicHpThreshold",
  ]) {
    if (!dynamicThresholdText.includes(required)) {
      violations.push(`${rel(dynamicThresholdFile)} must own dynamic threshold query ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleDynamicThresholdEvent\b|runBattleDynamicThreshold\b)/.test(
      dynamicThresholdText
    )
  ) {
    violations.push(`${rel(dynamicThresholdFile)} may export only its event query entry`);
  }
  const dynamicThresholdEntry =
    dynamicThresholdText.match(/export function runBattleDynamicThreshold\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/battleDynamicThresholdEventHandlers\[event\.type\]/.test(dynamicThresholdEntry)) {
    violations.push(`${rel(dynamicThresholdFile)} must fail closed for invalid threshold events`);
  }
  if (!/battleDynamicThresholdEventHandlers\[event\?\.type\]/.test(dynamicThresholdEntry)) {
    violations.push(`${rel(dynamicThresholdFile)} must dispatch invalid threshold events through optional type`);
  }
  const dynamicThresholdTestText = fs.readFileSync(
    path.join(root, "src/battle/dynamic-threshold.test.js"),
    "utf8"
  );
  if (!dynamicThresholdTestText.includes("rejects invalid dynamic threshold events without reading auto-tune")) {
    violations.push("src/battle/dynamic-threshold.test.js must cover invalid threshold events");
  }
  if (!/runBattleDynamicThreshold\(null\)/.test(dynamicThresholdTestText)) {
    violations.push("src/battle/dynamic-threshold.test.js must cover null threshold events");
  }
  const itemDecisionText = fs.readFileSync(decideItemFile, "utf8");
  for (const required of [
    "BattleDynamicThresholdEvent.READ_HP_THRESHOLD",
    "runBattleDynamicThreshold",
    "BattlePotionEconomyEvent.IS_WASTEFUL",
    "runBattlePotionEconomy",
  ]) {
    if (!itemDecisionText.includes(required)) {
      violations.push(`${rel(decideItemFile)} must consume item recovery query ${required}`);
    }
  }
  if (
    /import\s*\{[^}]*\b(?:dynamicHpThreshold|estimateRemainingTurns|isPotionWasteful)\b/.test(
      itemDecisionText
    )
  ) {
    violations.push(`${rel(decideItemFile)} must not import raw recovery decision helpers`);
  }
  for (const file of [
    decideOffensiveDebuffFile,
    attackPlanFile,
    path.join(root, "src/battle/item/decide-item.js"),
  ]) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("runBattleStallModeAutomation")) {
      violations.push(`${rel(file)} must read stall decisions through battle stall entry`);
    }
    if (/\b(?:isStallMode|stallTopupCandidates)\b/.test(text)) {
      violations.push(`${rel(file)} must not call legacy stall helper paths`);
    }
    for (const call of text.matchAll(/runBattleStallModeAutomation\(\s*\{[\s\S]*?\}\s*\)/g)) {
      if (call[0].includes("BattleStallModeEvent.READ_ACTIVE") && /\bsnap\s*:/.test(call[0])) {
        violations.push(`${rel(file)} must pass narrow facts, not snap, to stall active query`);
      }
      if (
        call[0].includes("BattleStallModeEvent.READ_TOPUP_CANDIDATES") &&
        /\bsnap\s*:/.test(call[0])
      ) {
        violations.push(`${rel(file)} must pass narrow facts, not snap, to stall top-up query`);
      }
    }
  }
  for (const file of [decideCastAllFile, decideDeSkillFile, bossImperilFile]) {
    const text = fs.readFileSync(file, "utf8");
    if (/runBattleStallModeAutomation|BattleStallModeEvent/.test(text)) {
      violations.push(`${rel(file)} must consume offensive debuff stall ruling`);
    }
  }
}

function checkBattleTestFixtures() {
  const text = fs.readFileSync(dispatchTestFile, "utf8");
  if (/\bg\(\s*["']option["']/.test(text)) {
    violations.push(
      `${rel(dispatchTestFile)} must seed options through runOptionAutomation(event)`
    );
  }
}

function checkBattleOptionVocabulary() {
  for (const file of [decideBuffFile, decideChannelFile, potionEconomyFile]) {
    const text = fs.readFileSync(file, "utf8");
    if (/g\(\s*["']option["']/.test(text)) {
      violations.push(`${rel(file)} must not describe pure battle decisions as raw option reads`);
    }
  }
}

checkInit();
checkBattleEntry();
checkBattleLifecycleEntry();
checkRoundStartCallers();
checkRoundStartEntry();
checkTurnEntry();
checkActionEventBridgeEntry();
checkActionDelayEntry();
checkApiBridgeEntry();
checkActionSpeedEntry();
checkActionLifecycleEntry();
checkPauseControlsEntry();
checkStartRuntimeEntry();
checkPhysicalSkillRanking();
checkPhysicalSkillBookkeeping();
checkActivateSpirit();
checkExecuteItem();
checkSnapshot();
checkBattleRulesRuntimeContext();
checkBattleDebuffCoverage();
checkBossImperilEntry();
checkBigSkillDebuffEntry();
checkBurstControlEntry();
checkOffensiveDebuffEntry();
checkCriticalBuffEntry();
checkSurvivalActionEntry();
checkBuffPreparationEntry();
checkInfusionEntry();
checkChannelEntry();
checkBuffEntry();
checkPlayerBuffStateQuery();
checkSingleDebuffEntry();
checkAllDebuffEntry();
checkBattleItemDecisionEntry();
checkItemGemEntry();
checkItemStallTopupEntry();
checkItemScrollEntry();
checkItemScrollCoverageQuery();
checkPotionEntry();
checkDefendEntry();
checkAutoPauseEntry();
checkFleeEntry();
checkAttackEntry();
checkBattleRuleFactMappers();
checkBattleStallMode();
checkBattleTestFixtures();
checkBattleOptionVocabulary();

if (violations.length) {
  console.error("[verify-battle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-boundary] OK — battle workflow is behind one entry");
