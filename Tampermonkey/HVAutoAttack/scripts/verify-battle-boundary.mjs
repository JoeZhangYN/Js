import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const battleFile = path.join(root, "src/battle/battle-automation.js");
const actionEventBridgeFile = path.join(root, "src/battle/battle-action-event-bridge.js");
const legacyReloaderFile = path.join(root, "src/battle/reloader.js");
const actionDelayFile = path.join(root, "src/battle/battle-action-delay.js");
const actionDelayTest = path.join(root, "src/battle/battle-action-delay.test.js");
const apiBridgeFile = path.join(root, "src/battle/battle-api-bridge.js");
const apiBridgeTest = path.join(root, "src/battle/battle-api-bridge.test.js");
const actionSpeedFile = path.join(root, "src/battle/battle-action-speed.js");
const actionSpeedTest = path.join(root, "src/battle/battle-action-speed.test.js");
const actionEndFile = path.join(root, "src/battle/battle-action-end.js");
const actionEndTest = path.join(root, "src/battle/battle-action-end.test.js");
const actionStartFile = path.join(root, "src/battle/battle-action-start.js");
const actionStartTest = path.join(root, "src/battle/battle-action-start.test.js");
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
const decideItemFile = path.join(root, "src/battle/item/decide-item.js");
const decideScrollFile = path.join(root, "src/battle/item/decide-scroll.js");
const executeItemFile = path.join(root, "src/battle/item/execute-item.js");
const potionEconomyFile = path.join(root, "src/battle/potion-economy.js");
const stallModeFile = path.join(root, "src/battle/battle-stall-mode.js");
const snapshotFile = path.join(root, "src/battle/snapshot.js");
const mainLoopFile = path.join(root, "src/battle/main-loop.js");
const stepRunnerFile = path.join(root, "src/battle/step-runner.js");
const legacyAttackFile = path.join(root, "src/battle/attack.js");
const roundStartFile = path.join(root, "src/battle/new-round.js");
const battleRulesFile = path.join(root, "src/battle/rules/index.js");
const bigSkillFile = path.join(root, "src/battle/rules/big-skill.js");
const bossImperilFile = path.join(root, "src/battle/rules/decide-boss-imperil.js");
const burstControlFile = path.join(root, "src/battle/debuff/decide-burst-control.js");
const decideDeSkillFile = path.join(root, "src/battle/debuff/decide-de-skill.js");
const decideCastAllFile = path.join(root, "src/battle/debuff/decide-cast-all.js");
const decideDefendFile = path.join(root, "src/battle/defense/decide-defend.js");
const decideAutoPauseFile = path.join(root, "src/battle/pause/decide-auto-pause.js");
const decideFleeFile = path.join(root, "src/battle/escape/decide-flee.js");
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
  for (const required of ["startBattleMonsterKnowledge", "startBattleMonitoring"]) {
    if (!text.includes(required)) {
      violations.push(
        `${rel(battleFile)} must make ${required} visible in runBattleAutomation(event)`
      );
    }
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
  if (!text.includes("BattleStartRuntimeEvent.BATTLE_STARTED")) {
    violations.push(`${rel(battleFile)} must initialize battle runtime through its entry`);
  }
  if (/\battackStatus\b|BattleActionSpeedEvent\.BATTLE_STARTED/.test(text)) {
    violations.push(
      `${rel(battleFile)} battle start runtime belongs in runBattleStartRuntimeAutomation(event)`
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
}

function checkTurnEntry() {
  const text = fs.readFileSync(mainLoopFile, "utf8");
  if (!/export function runBattleTurnAutomation\(/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must expose runBattleTurnAutomation()`);
  }
  if (/\b(?:export\s+)?function\s+main\s*\(/.test(text)) {
    violations.push(
      `${rel(mainLoopFile)} legacy main() bridge must stay deleted; use runBattleTurnAutomation()`
    );
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
      `${rel(actionEventBridgeFile)} battle action-end workflow belongs in runBattleActionEndAutomation(event)`
    );
  }
  if (!text.includes("BattleActionEndEvent.ACTION_ENDED")) {
    violations.push(
      `${rel(actionEventBridgeFile)} must report battle action end through its entry`
    );
  }
  if (/BattleMonitorEvent\.ACTION_STARTED|runBattleMonitorAutomation/.test(text)) {
    violations.push(
      `${rel(actionEventBridgeFile)} battle action-start workflow belongs in runBattleActionStartAutomation(event)`
    );
  }
  if (!text.includes("BattleActionStartEvent.ACTION_STARTED")) {
    violations.push(
      `${rel(actionEventBridgeFile)} must report battle action start through its entry`
    );
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

function checkActionEndEntry() {
  const text = fs.readFileSync(actionEndFile, "utf8");
  if (!/export const BattleActionEndEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(actionEndFile)} must expose BattleActionEndEvent`);
  }
  if (!/export function runBattleActionEndAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(actionEndFile)} must expose runBattleActionEndAutomation(event)`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleActionEndEvent\b|runBattleActionEndAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(actionEndFile)} may export only its event entry`);
  }
  for (const required of [
    "BattleActionSpeedEvent.ACTION_ENDED",
    "BattleActionDelayEvent.ACTION_ENDED",
    "MonsterStatusEvent.REFRESH_COMBATANT_COUNTS",
    "BattleMonitorEvent.ACTION_ENDED",
    "BattleMonitorEvent.COMPLETION_REACHED",
    "BattleCompletionEvent.COMPLETION_REACHED",
    "BattleCompletionOutcome.NEXT_ROUND",
    "RiddleEvent.BATTLE_POST_RESULT",
    "BattleRoundStartEvent.ROUND_STARTED",
    "runBattleTurnAutomation",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(actionEndFile)} must make ${required} visible in action-end entry`);
    }
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    actionEndFile,
    actionEndTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== actionEventBridgeFile &&
      file !== actionEndFile &&
      file !== actionEndTest &&
      /from\s+["']\.\/battle-action-end\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle action end workflow`);
    }
  }
}

function checkActionStartEntry() {
  const text = fs.readFileSync(actionStartFile, "utf8");
  if (!/export const BattleActionStartEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(actionStartFile)} must expose BattleActionStartEvent`);
  }
  if (!/export function runBattleActionStartAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(actionStartFile)} must expose runBattleActionStartAutomation(event)`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleActionStartEvent\b|runBattleActionStartAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(actionStartFile)} may export only its event entry`);
  }
  for (const required of [
    "BattleActionDelayEvent.ACTION_STARTED",
    "BattleMonitorEvent.ACTION_STARTED",
  ]) {
    if (!text.includes(required)) {
      violations.push(
        `${rel(actionStartFile)} must make ${required} visible in action-start entry`
      );
    }
  }
  for (const file of [
    battleFile,
    actionEventBridgeFile,
    mainLoopFile,
    roundStartFile,
    actionStartFile,
    actionStartTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== actionEventBridgeFile &&
      file !== actionStartFile &&
      file !== actionStartTest &&
      /from\s+["']\.\/battle-action-start\.js["']/.test(source)
    ) {
      violations.push(`${rel(file)} must not import internal battle action start workflow`);
    }
  }
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
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(physicalSkillRankingFile)} must read ranking debug options through option entry`
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
  if (!text.includes("learnIncomingBurst")) {
    violations.push(`${rel(snapshotFile)} must receive burst learning decision from turn context`);
  }
  if (/OptionEvent|runOptionAutomation|burstControlSwitch/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read battle rule options directly`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read snapshot option facts directly`);
  }
  if (!text.includes("BattleStartRuntimeEvent.READ_ATTACK_STATUS")) {
    violations.push(`${rel(snapshotFile)} must read attackStatus through battle start runtime`);
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
  const runnerText = fs.readFileSync(stepRunnerFile, "utf8");
  if (/\brule\.when\b|\bwhen 门控\b/.test(runnerText)) {
    violations.push(
      `${rel(stepRunnerFile)} must not support legacy rule.when gates; decide returns noop instead`
    );
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
  const ownerText = fs.readFileSync(bossImperilFile, "utf8");
  for (const required of ["BossImperilEvent", "runBossImperilAutomation", "CAN_CAST", "DECIDE"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(bossImperilFile)} must own ${required}`);
    }
  }
  if (/export\s+function\s+decideBossImperil\s*\(/.test(ownerText)) {
    violations.push(`${rel(bossImperilFile)} legacy decideBossImperil export must stay private`);
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  if (!rulesText.includes("runBossImperilAutomation")) {
    violations.push(`${rel(battleRulesFile)} must read boss Imperil decisions through their entry`);
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
  const ownerText = fs.readFileSync(bigSkillFile, "utf8");
  for (const required of [
    "BigSkillDebuffEvent",
    "runBigSkillDebuffAutomation",
    "READ_CLEAR_READY",
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
  for (const file of [decideCastAllFile, burstControlFile]) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("runBigSkillDebuffAutomation")) {
      violations.push(`${rel(file)} must read big-skill debuff decisions through their entry`);
    }
    if (/\b(?:clearSkillReadyNow|shouldSkipForBigSkill)\b/.test(text)) {
      violations.push(`${rel(file)} must not call legacy big-skill debuff helpers`);
    }
  }
}

function checkBurstControlEntry() {
  const ownerText = fs.readFileSync(burstControlFile, "utf8");
  for (const required of ["decideBurstControl", "burstControlSwitch", "debuffSkillSwitch"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(burstControlFile)} must own burst-control gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  if (rulesText.includes("burstControlSwitch")) {
    violations.push(`${rel(battleRulesFile)} must not assemble burst-control gates directly`);
  }
}

function checkInfusionEntry() {
  const ownerText = fs.readFileSync(decideInfusionFile, "utf8");
  for (const required of ["decideInfusion", "infusionSwitch", "infusionCondition"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideInfusionFile)} must own infusion gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  for (const legacy of ["infusionSwitch", "infusionCondition"]) {
    if (rulesText.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble infusion rule gates directly`);
    }
  }
}

function checkChannelEntry() {
  const ownerText = fs.readFileSync(decideChannelFile, "utf8");
  for (const required of ["decideChannel", "channelSkillSwitch", "channelSkill", "channeling"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideChannelFile)} must own channel gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  for (const legacy of ["channelSkillSwitch", "channelSkill"]) {
    if (rulesText.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble channel rule gates directly`);
    }
  }
}

function checkBuffEntry() {
  const ownerText = fs.readFileSync(decideBuffFile, "utf8");
  for (const required of ["decideBuff", "buffSkillSwitch", "buffSkill", "buffSkillCondition"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideBuffFile)} must own buff gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
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
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideDeSkillFile)} must own single-debuff gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const useDeSkillRule =
    rulesText.match(/name:\s*["']useDeSkill["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
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
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideCastAllFile)} must own all-debuff gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  for (const ruleName of ["castWeakenAll", "castImperilAll"]) {
    const rule =
      rulesText.match(
        new RegExp(`name:\\s*["']${ruleName}["'][\\s\\S]*?decide:[\\s\\S]*?\\n\\s*\\}`)
      )?.[0] || "";
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
  for (const required of ["decideScroll", "scrollSwitch", "scrollCondition", "scrollRoundType"]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideScrollFile)} must own scroll gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  for (const legacy of ["scrollSwitch", "scrollCondition", "scrollRoundType"]) {
    if (rulesText.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble scroll rule gates directly`);
    }
  }
}

function checkPotionEntry() {
  const itemText = fs.readFileSync(decideItemFile, "utf8");
  for (const required of ["decidePotion", "itemOrderName", "itemOrderValue", "item"]) {
    if (!itemText.includes(required)) {
      violations.push(`${rel(decideItemFile)} must own potion gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const deadSoonRule =
    rulesText.match(/name:\s*["']deadSoon["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  for (const legacy of ["itemOrderName", "itemOrderValue", "item"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(deadSoonRule)) {
      violations.push(`${rel(battleRulesFile)} must not assemble potion rule gates directly`);
    }
  }
}

function checkDefendEntry() {
  const ownerText = fs.readFileSync(decideDefendFile, "utf8");
  for (const required of ["decideDefend", "defendCondition", "defend-command"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideDefendFile)} must own defend gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const defendRule =
    rulesText.match(/name:\s*["']defend["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  for (const legacy of ["defendCondition", "#ckey_defend"]) {
    if (defendRule.includes(legacy)) {
      violations.push(`${rel(battleRulesFile)} must not assemble defend rule gates directly`);
    }
  }
}

function checkAutoPauseEntry() {
  const ownerText = fs.readFileSync(decideAutoPauseFile, "utf8");
  for (const required of ["decideAutoPause", "autoPause", "pauseCondition"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAutoPauseFile)} must own auto-pause gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const pauseRule =
    rulesText.match(/name:\s*["']autoPause["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
  for (const legacy of ["canAutoPause", "pauseCondition"]) {
    if (new RegExp(`\\b${legacy}\\b`).test(pauseRule)) {
      violations.push(`${rel(battleRulesFile)} must not assemble auto-pause rule gates directly`);
    }
  }
}

function checkFleeEntry() {
  const ownerText = fs.readFileSync(decideFleeFile, "utf8");
  for (const required of ["decideFlee", "autoFlee", "fleeCondition", "flee-command"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideFleeFile)} must own flee gate ${required}`);
    }
  }
  const rulesText = fs.readFileSync(battleRulesFile, "utf8");
  const fleeRule = rulesText.match(/name:\s*["']flee["'][\s\S]*?decide:[\s\S]*?\n\s*\}/)?.[0] || "";
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
  for (const required of ["decideAttack", "selectSpellTier", "highSkillCondition"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(decideAttackFile)} must own attack spell-tier decision ${required}`);
    }
  }
  const scoringText = fs.readFileSync(physicalSkillScoringFile, "utf8");
  for (const required of ["scorePhysicalSkillCandidates", "snap.skillReady", "skillBaseScore"]) {
    if (!scoringText.includes(required)) {
      violations.push(
        `${rel(physicalSkillScoringFile)} must own physical skill scoring ${required}`
      );
    }
  }
  const autoElementText = fs.readFileSync(autoElementSelectionFile, "utf8");
  for (const required of ["selectAutoElement", "autoElementPool", "target.resists"]) {
    if (!autoElementText.includes(required)) {
      violations.push(
        `${rel(autoElementSelectionFile)} must own auto element selection ${required}`
      );
    }
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

function checkBattleStallMode() {
  const ownerText = fs.readFileSync(stallModeFile, "utf8");
  for (const required of [
    "BattleStallModeEvent",
    "runBattleStallModeAutomation",
    "READ_ACTIVE",
    "READ_TOPUP_CANDIDATES",
    "event?.aliveMonsterHpPercents",
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
checkRoundStartCallers();
checkRoundStartEntry();
checkTurnEntry();
checkActionEventBridgeEntry();
checkActionDelayEntry();
checkApiBridgeEntry();
checkActionSpeedEntry();
checkActionEndEntry();
checkActionStartEntry();
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
checkInfusionEntry();
checkChannelEntry();
checkBuffEntry();
checkSingleDebuffEntry();
checkAllDebuffEntry();
checkItemScrollEntry();
checkPotionEntry();
checkDefendEntry();
checkAutoPauseEntry();
checkFleeEntry();
checkAttackEntry();
checkBattleStallMode();
checkBattleTestFixtures();
checkBattleOptionVocabulary();

if (violations.length) {
  console.error("[verify-battle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-boundary] OK — battle workflow is behind one entry");
