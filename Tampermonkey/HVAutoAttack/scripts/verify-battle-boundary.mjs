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
const legacyActionEndFile = path.join(root, "src/battle/battle-action-end.js");
const legacyActionStartFile = path.join(root, "src/battle/battle-action-start.js");
const pauseControlsFile = path.join(root, "src/battle/battle-pause-controls.js");
const pauseControlsTest = path.join(root, "src/battle/battle-pause-controls.test.js");
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
const decideInfusionFile = path.join(root, "src/battle/buff/decide-infusion.js");
const decideBuffFile = path.join(root, "src/battle/buff/decide-buff.js");
const decideChannelFile = path.join(root, "src/battle/buff/decide-channel.js");
const buffFactsFile = path.join(root, "src/battle/buff/buff-facts.js");
const decideCriticalBuffFile = path.join(
  root,
  "src/battle/critical-buff-guard/decide-critical-buff.js"
);
const decideItemFile = path.join(root, "src/battle/item/decide-item.js");
const decideGemFile = path.join(root, "src/battle/item/decide-gem.js");
const decideScrollFile = path.join(root, "src/battle/item/decide-scroll.js");
const itemFactsFile = path.join(root, "src/battle/item/item-facts.js");
const executeItemFile = path.join(root, "src/battle/item/execute-item.js");
const potionEconomyFile = path.join(root, "src/battle/potion-economy.js");
const stallModeFile = path.join(root, "src/battle/battle-stall-mode.js");
const snapshotFile = path.join(root, "src/battle/snapshot.js");
const turnContextFile = path.join(root, "src/battle/turn-context.js");
const mainLoopFile = path.join(root, "src/battle/main-loop.js");
const actionDecisionFile = path.join(root, "src/battle/battle-action-decision.js");
const legacyStepRunnerFile = path.join(root, "src/battle/step-runner.js");
const legacyAttackFile = path.join(root, "src/battle/attack.js");
const roundStartFile = path.join(root, "src/battle/battle-round-start.js");
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
const decideAttackFile = path.join(root, "src/battle/attack/decide-attack.js");
const decideTierFile = path.join(root, "src/battle/attack/decide-tier.js");
const decideSkillFile = path.join(root, "src/battle/attack/decide-skill.js");
const physicalSkillScoringFile = path.join(root, "src/battle/attack/physical-skill-scoring.js");
const pickElementFile = path.join(root, "src/battle/attack/pick-element.js");
const autoElementSelectionFile = path.join(root, "src/battle/attack/auto-element-selection.js");
const dispatchTestFile = path.join(root, "src/battle/dispatch.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
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
}

function checkTurnEntry() {
  const text = fs.readFileSync(mainLoopFile, "utf8");
  const actionDecisionText = fs.readFileSync(actionDecisionFile, "utf8");
  if (!/export function runBattleTurnAutomation\(/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must expose runBattleTurnAutomation()`);
  }
  if (/\b(?:export\s+)?function\s+main\s*\(/.test(text)) {
    violations.push(
      `${rel(mainLoopFile)} legacy main() bridge must stay deleted; use runBattleTurnAutomation()`
    );
  }
  if (!text.includes("runBattleActionDecision")) {
    violations.push(`${rel(mainLoopFile)} must delegate action decisions to one entry`);
  }
  if (/\bBATTLE_RULES\b|\brunRules\b/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must not assemble battle action rule chains directly`);
  }
  if (!/export function runBattleActionDecision\(/.test(actionDecisionText)) {
    violations.push(`${rel(actionDecisionFile)} must expose runBattleActionDecision()`);
  }
  if (fs.existsSync(legacyBattleRulesFile)) {
    violations.push(
      `${rel(legacyBattleRulesFile)} must stay retired; action rules belong inside runBattleActionDecision`
    );
  }
  for (const required of ["BATTLE_RULES", "dispatch", "for (const rule of BATTLE_RULES)"]) {
    if (!actionDecisionText.includes(required)) {
      violations.push(`${rel(actionDecisionFile)} must own action decision ${required}`);
    }
  }
  if (fs.existsSync(legacyStepRunnerFile)) {
    violations.push("src/battle/step-runner.js legacy action runner must stay deleted");
  }
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const file = path.join(entry.parentPath, entry.name);
      const source = fs.readFileSync(file, "utf8");
      if (file !== actionDecisionFile && /from\s+["'][^"']*rules\/index\.js["']/.test(source)) {
        violations.push(`${rel(file)} must use runBattleActionDecision(), not rules/index.js`);
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
  if (!/const actionSpeedEventHandlers\s*=\s*Object\.freeze\(/.test(text)) {
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
    "BattleActionDelayEvent.ACTION_STARTED",
    "BattleMonitorEvent.ACTION_STARTED",
    "BattleActionSpeedEvent.ACTION_ENDED",
    "BattleActionDelayEvent.ACTION_ENDED",
    "MonsterStatusEvent.REFRESH_COMBATANT_COUNTS",
    "BattleMonitorEvent.ACTION_ENDED",
    "BattleCompletionEvent.COMPLETION_REACHED",
    "BattleCompletionOutcome.NEXT_ROUND",
    "RiddleEvent.BATTLE_POST_RESULT",
    "BattleRoundStartEvent.ROUND_STARTED",
    "runBattleTurnAutomation",
  ]) {
    if (!text.includes(required)) {
      violations.push(
        `${rel(actionLifecycleFile)} must make ${required} visible in action lifecycle entry`
      );
    }
  }
  if (/BattleMonitorEvent\.COMPLETION_REACHED/.test(text)) {
    violations.push(
      `${rel(actionLifecycleFile)} completion recording belongs in runBattleCompletionAutomation(event)`
    );
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
  if (!/const startRuntimeEventHandlers\s*=\s*Object\.freeze\(/.test(text)) {
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
        ![decideAttackFile, physicalSkillScoringFile, physicalSkillRankingTest].includes(file) &&
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
  if (/\bevent\.snap\b/.test(text)) {
    violations.push(
      `${rel(physicalSkillBookkeepingFile)} must consume observedBosses, not snap, for physical fire bookkeeping`
    );
  }
  const executeText = fs.readFileSync(
    path.join(root, "src/battle/attack/execute-attack.js"),
    "utf8"
  );
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
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(activateSpiritFile)} must read pre-cast Spirit options through option entry`
    );
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(activateSpiritFile)} must not read pre-cast Spirit options directly`);
  }
}

function checkExecuteItem() {
  const text = fs.readFileSync(executeItemFile, "utf8");
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
  if (/OptionEvent|runOptionAutomation|burstControlSwitch/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read battle rule options directly`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read snapshot option facts directly`);
  }
  if (/BattleStartRuntimeEvent\.READ_ATTACK_STATUS|runBattleStartRuntimeAutomation/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not attach turn runtime facts`);
  }
  if (!turnContextText.includes("BattleStartRuntimeEvent.READ_ATTACK_STATUS")) {
    violations.push(
      `${rel(turnContextFile)} must attach attackStatus through battle start runtime`
    );
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
  if (/\bmonsterStatus\b/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not pass full monsterStatus downstream`);
  }
  if (/\bg\(\s*["']monsterStatus["']/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read monsterStatus directly`);
  }
}

function checkBattleRulesRuntimeContext() {
  const text = fs.readFileSync(battleRulesFile, "utf8");
  if (/\bwhen\s*:/.test(text)) {
    violations.push(
      `${rel(battleRulesFile)} must not define rule.when; business gates belong in decide entries`
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
  const rulesBody = text.split("/** @type")[1] || "";
  if (/\bg\(\s*["'](?:roundNow|roundAll|roundType|monsterAlive)["']/.test(rulesBody)) {
    violations.push(
      `${rel(battleRulesFile)} rule definitions must read runtime fields through rule runtime context`
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
    "event?.skillCooldowns",
    "event?.overcharge",
    "event?.roundNow",
    "event?.roundAll",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bossImperilFile)} must consume ${required}`);
    }
  }
  if (!ownerText.includes("runBigSkillDebuffAutomation")) {
    violations.push(`${rel(bossImperilFile)} must ask big-skill debuff entry for F4 skips`);
  }
  if (
    /runBigSkillKillLearningAutomation|BigSkillKillLearningEvent|WILL_KILL_BOSS/.test(ownerText)
  ) {
    violations.push(`${rel(bossImperilFile)} must not call big-skill kill learner directly`);
  }
  if (/\bevent\.snap\b/.test(ownerText)) {
    violations.push(`${rel(bossImperilFile)} must not consume snap-shaped event input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  if (!rulesText.includes("runBossImperilAutomation")) {
    violations.push(`${rel(battleRulesFile)} must read boss Imperil decisions through their entry`);
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
  for (const required of ["bigSkillCodes", "readBigSkillSpec", "isBigSkillEnabled"]) {
    if (!catalogText.includes(required)) {
      violations.push(`${rel(bigSkillCatalogFile)} must own ${required}`);
    }
  }
  for (const required of ["bigSkillCodes", "readBigSkillSpec", "isBigSkillEnabled"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bigSkillFile)} must read clear-skill specs through catalog`);
    }
  }
  if (/["']OFC["']\s*,\s*["']FRD["']|skill\s*===\s*["']OFC["']\s*\?\s*205/.test(ownerText)) {
    violations.push(`${rel(bigSkillFile)} must not hard-code OFC/FRD clear-skill specs`);
  }
  for (const required of [
    "BigSkillDebuffEvent",
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
  for (const file of [decideCastAllFile, bossImperilFile]) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("runBigSkillDebuffAutomation")) {
      violations.push(`${rel(file)} must read big-skill debuff decisions through their entry`);
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
  if (/READ_CLEAR_READY|readClearReady/.test(ownerText)) {
    violations.push(`${rel(bigSkillFile)} legacy clear-ready name must stay retired`);
  }
}

function checkBurstControlEntry() {
  const ownerText = fs.readFileSync(burstControlFile, "utf8");
  for (const required of [
    "decideBurstControl",
    "burstControlSwitch",
    "debuffSkillSwitch",
    "decideAttack",
    "AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL",
    "event.healthAbs",
    "event.skillReady",
    "event.learnedBurstByMid",
    "event.monsterFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(burstControlFile)} must own burst-control gate ${required}`);
    }
  }
  if (/decideBurstControl\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(burstControlFile)} must not expose opt/snap decision input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const burstRule =
    rulesText.match(/name:\s*["']burstControl["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideBurstControl\(\s*opt\s*,\s*snap\s*\)/.test(burstRule)) {
    violations.push(`${rel(battleRulesFile)} must pass narrow facts, not snap, to burst control`);
  }
  if (rulesText.includes("burstControlSwitch")) {
    violations.push(`${rel(battleRulesFile)} must not assemble burst-control gates directly`);
  }
}

function checkCriticalBuffEntry() {
  const ownerText = fs.readFileSync(decideCriticalBuffFile, "utf8");
  for (const required of [
    "decideCriticalBuff",
    "event.manaPercent",
    "event.playerEffects",
    "critical-pause",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideCriticalBuffFile)} must own critical buff fact ${required}`);
    }
  }
  if (/decideCriticalBuff\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideCriticalBuffFile)} must not expose opt/snap decision input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const criticalRule =
    rulesText.match(/name:\s*["']criticalBuffGuard["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideCriticalBuff\(\s*opt\s*,\s*snap\s*\)/.test(criticalRule)) {
    violations.push(
      `${rel(battleRulesFile)} must pass narrow facts, not snap, to critical buff guard`
    );
  }
}

function checkInfusionEntry() {
  const ownerText = fs.readFileSync(decideInfusionFile, "utf8");
  for (const required of [
    "decideInfusion",
    "infusionSwitch",
    "infusionCondition",
    "conditionFacts",
    "event.attackStatus",
    "event.playerBuffs",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideInfusionFile)} must own infusion gate ${required}`);
    }
  }
  if (/decideInfusion\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideInfusionFile)} must not expose opt/snap infusion input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
    "decideChannel",
    "channelSkillSwitch",
    "channelSkill",
    "event.channeling",
    "event.skillReady",
    "event.playerEffects",
    "event.playerBuffs",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideChannelFile)} must own channel gate ${required}`);
    }
  }
  if (/decideChannel\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideChannelFile)} must not expose opt/snap decision input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
}

function checkBuffEntry() {
  const ownerText = fs.readFileSync(decideBuffFile, "utf8");
  for (const required of [
    "decideBuff",
    "buffSkillSwitch",
    "buffSkill",
    "buffSkillCondition",
    "conditionFacts",
    "event.skillReady",
    "event.playerBuffs",
    "event.playerEffectTurns",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideBuffFile)} must own buff gate ${required}`);
    }
  }
  if (/decideBuff\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideBuffFile)} must not expose opt/snap buff input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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

function checkSingleDebuffEntry() {
  const ownerText = fs.readFileSync(decideDeSkillFile, "utf8");
  for (const required of [
    "decideDeSkill",
    "debuffSkillSwitch",
    "debuffSkill",
    "debuffSkillCondition",
    "runBattleStallModeAutomation",
    "conditionFacts",
    "event.monsterFacts",
    "event.skillReady",
    "event.spellAoe",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideDeSkillFile)} must own single-debuff gate ${required}`);
    }
  }
  if (/decideDeSkill\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideDeSkillFile)} must not expose opt/snap single-debuff input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
    "decideCastDebuffOnAll",
    "debuffSkillSwitch",
    "debuffSkillAllWk",
    "debuffSkillAllIm",
    "debuffSkillWkCondition",
    "debuffSkillImpCondition",
    "runBattleDebuffCoverageAutomation",
    "runBigSkillDebuffAutomation",
    "runBattleStallModeAutomation",
    "conditionFacts",
    "event.monsterFacts",
    "event.skillReady",
    "event.spellAoe",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideCastAllFile)} must own all-debuff gate ${required}`);
    }
  }
  if (/decideCastDebuffOnAll\s*\(\s*opt\s*,\s*snap\s*,/.test(ownerText)) {
    violations.push(`${rel(decideCastAllFile)} must not expose opt/snap all-debuff input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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

function checkItemScrollEntry() {
  const itemText = fs.readFileSync(decideScrollFile, "utf8");
  for (const required of [
    "decideScroll",
    "scrollSwitch",
    "scrollCondition",
    "scrollRoundType",
    "conditionFacts",
    "event.roundType",
    "event.playerBuffs",
  ]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideScrollFile)} must own scroll gate ${required}`);
    }
  }
  if (/decideScroll\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideScrollFile)} must not expose opt/snap scroll input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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

function checkItemGemEntry() {
  const itemText = fs.readFileSync(decideItemFile, "utf8");
  const gemText = fs.readFileSync(decideGemFile, "utf8");
  for (const required of [
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
  if (/decideGemUse\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must not expose opt/snap gem decision input`);
  }
  if (/decideGem\s*\(\s*opt\s*,\s*snap\s*,\s*gemName\s*\)/.test(gemText)) {
    violations.push(`${rel(decideGemFile)} must not expose opt/snap gem helper input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
    "event.playerBuffs",
  ]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} stall top-up must own fact ${required}`);
    }
  }
  if (/decideStallTopup\s*\(\s*opt\s*,\s*snap\s*\)/.test(itemText)) {
    violations.push(`${rel(decideItemFile)} must not expose opt/snap stall top-up input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
  for (const required of ["decideDefend", "defendCondition", "defend-command", "conditionFacts"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideDefendFile)} must own defend gate ${required}`);
    }
  }
  if (/decideDefend\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideDefendFile)} must not expose opt/snap defend input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
  for (const required of ["decideAutoPause", "autoPause", "pauseCondition", "conditionFacts"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAutoPauseFile)} must own auto-pause gate ${required}`);
    }
  }
  if (/decideAutoPause\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideAutoPauseFile)} must not expose opt/snap auto-pause input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
    "decideFlee",
    "autoFlee",
    "fleeCondition",
    "flee-command",
    "conditionFacts",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideFleeFile)} must own flee gate ${required}`);
    }
  }
  if (/decideFlee\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideFleeFile)} must not expose opt/snap flee input`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
      `${rel(decideTierFile)} legacy spell-tier helper must stay deleted; tier decisions belong in decideAttack`
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
    "decideAttack",
    "AttackDecisionEvent",
    "WILL_CLEAR_WITH_BIG_SKILL",
    "selectSpellTier",
    "highSkillCondition",
    "conditionFacts",
    "event.monsterFacts",
    "event.skillReady",
    "event.attackStatus",
    "event.overcharge",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAttackFile)} must own attack spell-tier decision ${required}`);
    }
  }
  if (/decideAttack\s*\(\s*opt\s*,\s*snap\s*\)/.test(ownerText)) {
    violations.push(`${rel(decideAttackFile)} must not expose opt/snap attack input`);
  }
  if (!ownerText.includes("dynamicHealLog")) {
    violations.push(`${rel(decideAttackFile)} must pass ranking debug option into attack ranking`);
  }
  const scoringText = fs.readFileSync(physicalSkillScoringFile, "utf8");
  for (const required of ["scorePhysicalSkillCandidates", "event.skillReady", "skillBaseScore"]) {
    if (!scoringText.includes(required)) {
      violations.push(
        `${rel(physicalSkillScoringFile)} must own physical skill scoring ${required}`
      );
    }
  }
  if (!scoringText.includes("readBigSkillSpec")) {
    violations.push(`${rel(physicalSkillScoringFile)} must read OFC/FRD specs through catalog`);
  }
  if (/["']1111["']|["']1101["']/.test(scoringText)) {
    violations.push(`${rel(physicalSkillScoringFile)} must not hard-code OFC/FRD skill ids`);
  }
  const autoElementText = fs.readFileSync(autoElementSelectionFile, "utf8");
  for (const required of ["selectAutoElement", "autoElementPool", "target.resists"]) {
    if (!autoElementText.includes(required)) {
      violations.push(
        `${rel(autoElementSelectionFile)} must own auto element selection ${required}`
      );
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const attackRule =
    rulesText.match(/name:\s*["']attack["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  if (/decideAttack\(\s*opt\s*,\s*snap\s*\)/.test(attackRule)) {
    violations.push(`${rel(battleRulesFile)} must pass attack facts, not snap`);
  }
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const file = path.join(entry.parentPath, entry.name);
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
        file !== decideAttackFile &&
        /from\s+["'][^"']*physical-skill-scoring\.js["']/.test(text)
      ) {
        violations.push(`${rel(file)} must not bypass decideAttack for physical skill scoring`);
      }
      if (
        file !== decideAttackFile &&
        /from\s+["'][^"']*auto-element-selection\.js["']/.test(text)
      ) {
        violations.push(`${rel(file)} must not bypass decideAttack for auto element selection`);
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
  for (const required of ["gemFacts", "potionFacts", "stallTopupFacts", "scrollFacts"]) {
    if (!itemFactsText.includes(required)) {
      violations.push(`${rel(itemFactsFile)} must own item fact mapper ${required}`);
    }
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(itemFactsText)) {
    violations.push(`${rel(itemFactsFile)} must not depend on generic rule fact mappers`);
  }
  for (const required of ["buffFacts", "channelFacts", "infusionFacts"]) {
    if (!buffFactsText.includes(required)) {
      violations.push(`${rel(buffFactsFile)} must own buff fact mapper ${required}`);
    }
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(buffFactsText)) {
    violations.push(`${rel(buffFactsFile)} must not depend on generic rule fact mappers`);
  }
  for (const required of [
    "allDebuffFacts",
    "singleDebuffFacts",
    "burstControlFacts",
    "bossImperilFacts",
  ]) {
    if (!debuffFactsText.includes(required)) {
      violations.push(`${rel(debuffFactsFile)} must own debuff fact mapper ${required}`);
    }
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(debuffFactsText)) {
    violations.push(`${rel(debuffFactsFile)} must not depend on generic rule fact mappers`);
  }
  if (!criticalBuffFactsText.includes("criticalBuffFacts")) {
    violations.push(`${rel(criticalBuffFactsFile)} must own critical buff fact mapper`);
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(criticalBuffFactsText)) {
    violations.push(`${rel(criticalBuffFactsFile)} must not depend on generic rule fact mappers`);
  }
  for (const [file, text, required] of [
    [fleeFactsFile, fleeFactsText, "fleeFacts"],
    [autoPauseFactsFile, autoPauseFactsText, "autoPauseFacts"],
    [defendFactsFile, defendFactsText, "defendFacts"],
  ]) {
    if (!text.includes(required) || !text.includes("conditionFacts")) {
      violations.push(`${rel(file)} must own ${required} condition fact mapper`);
    }
    if (/from\s+["'][^"']*rule-facts\.js["']/.test(text)) {
      violations.push(`${rel(file)} must not depend on generic rule fact mappers`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  if (/conditionFacts\s*:\s*conditionFacts\s*\(\s*snap\s*\)/.test(rulesText)) {
    violations.push(
      `${rel(battleRulesFile)} must use named fact mappers, not assemble condition facts`
    );
  }
  for (const required of ["attackFacts", "conditionFacts", "monsterFacts"]) {
    if (!attackFactsText.includes(required)) {
      violations.push(`${rel(attackFactsFile)} must own attack fact mapper ${required}`);
    }
  }
  if (/from\s+["'][^"']*rule-facts\.js["']/.test(attackFactsText)) {
    violations.push(`${rel(attackFactsFile)} must not depend on generic rule fact mappers`);
  }

  const allowedAttackFactsImporters = new Set([battleRulesFile]);
  for (const relative of ["src/battle", "src/core"]) {
    const dir = path.join(root, relative);
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const file = path.join(entry.parentPath, entry.name);
      const text = fs.readFileSync(file, "utf8");
      if (/from\s+["'][^"']*rule-facts\.js["']/.test(text)) {
        violations.push(`${rel(file)} must not import retired generic rule fact mapping`);
      }
      if (
        /from\s+["'][^"']*attack-facts\.js["']/.test(text) &&
        !allowedAttackFactsImporters.has(file)
      ) {
        violations.push(`${rel(file)} must not bypass battle rules for attack fact mapping`);
      }
    }
  }
}

function checkBattleStallMode() {
  const ownerText = fs.readFileSync(stallModeFile, "utf8");
  for (const required of [
    "BattleStallModeEvent",
    "runBattleStallModeAutomation",
    "READ_ACTIVE",
    "READ_TOPUP_CANDIDATES",
    "event?.monsterFacts",
    "event?.overcharge",
    "event?.manaPercent",
    "event?.spiritPercent",
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
  const allowedAliveHpFiles = new Set([
    itemFactsFile,
    decideGemFile,
    path.join(root, "src/battle/dynamic-threshold.js"),
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
  for (const legacy of ["isStallMode", "stallTopupCandidates"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(economyText)) {
      violations.push(`${rel(potionEconomyFile)} legacy ${legacy} belongs in battle stall entry`);
    }
  }
  for (const file of [
    decideCastAllFile,
    decideDeSkillFile,
    bossImperilFile,
    path.join(root, "src/battle/attack/decide-attack.js"),
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
checkCriticalBuffEntry();
checkInfusionEntry();
checkChannelEntry();
checkBuffEntry();
checkSingleDebuffEntry();
checkAllDebuffEntry();
checkItemGemEntry();
checkItemStallTopupEntry();
checkItemScrollEntry();
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
