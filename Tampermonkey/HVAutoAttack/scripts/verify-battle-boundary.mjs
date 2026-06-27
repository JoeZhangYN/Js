import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const battleFile = path.join(root, "src/battle/battle-automation.js");
const reloaderFile = path.join(root, "src/battle/reloader.js");
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
const utilityEngineFile = path.join(root, "src/battle/utility-engine.js");
const activateSpiritFile = path.join(root, "src/battle/buff/activate-spirit.js");
const executeItemFile = path.join(root, "src/battle/item/execute-item.js");
const snapshotFile = path.join(root, "src/battle/snapshot.js");
const mainLoopFile = path.join(root, "src/battle/main-loop.js");
const roundStartFile = path.join(root, "src/battle/new-round.js");
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
  if (!text.includes("installBattleActionEventBridge")) {
    violations.push(
      `${rel(battleFile)} must install action events through installBattleActionEventBridge()`
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
  for (const file of [battleFile, reloaderFile]) {
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
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(roundStartFile)} must read round-start options through option entry`);
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
  for (const file of [battleFile, reloaderFile]) {
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
  const text = fs.readFileSync(reloaderFile, "utf8");
  if (!/export function installBattleActionEventBridge\(/.test(text)) {
    violations.push(`${rel(reloaderFile)} must expose installBattleActionEventBridge()`);
  }
  if (/\b(?:export\s+)?function\s+reloader\s*\(/.test(text)) {
    violations.push(
      `${rel(reloaderFile)} legacy reloader() bridge must stay deleted; use installBattleActionEventBridge()`
    );
  }
  const battleText = fs.readFileSync(battleFile, "utf8");
  if (/\breloader\s*\(/.test(battleText)) {
    violations.push(
      `${rel(battleFile)} legacy reloader() call is forbidden; use installBattleActionEventBridge()`
    );
  }
  if (
    /\bdelayAlert\b|\bdelayReload\b|BattleActionDelayEvent|AlarmEvent\.TRIGGER|NavigationEvent\.SCHEDULE_RELOAD/.test(
      text
    ) ||
    /\bclearTimeout\b/.test(text)
  ) {
    violations.push(
      `${rel(reloaderFile)} battle action delay timers belong in runBattleActionDelayAutomation(event)`
    );
  }
  if (
    /\bapi_call\b|\bapi_response\b|\bfakeApiCall\b|\bfakeApiResponse\b|sessionStorage\.delay\b|sessionStorage\.delay2\b|\.textContent\s*=/.test(
      text
    )
  ) {
    violations.push(
      `${rel(reloaderFile)} battle api script injection belongs in runBattleApiBridgeAutomation(event)`
    );
  }
  if (!text.includes("BattleApiBridgeEvent.INSTALL")) {
    violations.push(`${rel(reloaderFile)} must install battle api bridge through its entry`);
  }
  if (/\brunSpeed\b|\btimeNow\b|TimeEvent\.EPOCH_MS/.test(text)) {
    violations.push(
      `${rel(reloaderFile)} battle action speed belongs in runBattleActionSpeedAutomation(event)`
    );
  }
  if (
    /BattleCompletionEvent|BattleCompletionOutcome|BattleMonitorEvent\.COMPLETION_REACHED|RiddleEvent\.BATTLE_POST_RESULT|runBattleTurnAutomation|runBattleRoundStartAutomation|runMonsterStatusAutomation|unsafeWindow\.battle|#pane_completion|#btcp|#battle_right|#battle_left|window\.location\.href|post\(/.test(
      text
    )
  ) {
    violations.push(
      `${rel(reloaderFile)} battle action-end workflow belongs in runBattleActionEndAutomation(event)`
    );
  }
  if (!text.includes("BattleActionEndEvent.ACTION_ENDED")) {
    violations.push(`${rel(reloaderFile)} must report battle action end through its entry`);
  }
  if (/BattleMonitorEvent\.ACTION_STARTED|runBattleMonitorAutomation/.test(text)) {
    violations.push(
      `${rel(reloaderFile)} battle action-start workflow belongs in runBattleActionStartAutomation(event)`
    );
  }
  if (!text.includes("BattleActionStartEvent.ACTION_STARTED")) {
    violations.push(`${rel(reloaderFile)} must report battle action start through its entry`);
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
    reloaderFile,
    mainLoopFile,
    roundStartFile,
    actionDelayFile,
    actionDelayTest,
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== reloaderFile &&
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
    reloaderFile,
    mainLoopFile,
    roundStartFile,
    apiBridgeFile,
    apiBridgeTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== reloaderFile &&
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
  for (const file of [
    battleFile,
    reloaderFile,
    mainLoopFile,
    roundStartFile,
    actionSpeedFile,
    actionSpeedTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== battleFile &&
      file !== reloaderFile &&
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
    reloaderFile,
    mainLoopFile,
    roundStartFile,
    actionEndFile,
    actionEndTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== reloaderFile &&
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
    reloaderFile,
    mainLoopFile,
    roundStartFile,
    actionStartFile,
    actionStartTest,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    if (
      file !== reloaderFile &&
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
  if (!text.includes("OptionEvent.READ")) {
    violations.push(
      `${rel(pauseControlsFile)} must read pause control options through option entry`
    );
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
    "pauseButton",
    "pauseHotkey",
    "pauseHotkeyKey",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(pauseControlsFile)} must own ${required}`);
    }
  }
  for (const file of [
    battleFile,
    reloaderFile,
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
    reloaderFile,
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

function checkUtilityEngine() {
  const text = fs.readFileSync(utilityEngineFile, "utf8");
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(utilityEngineFile)} must read utility debug options through option entry`
    );
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(utilityEngineFile)} must not read utility debug options directly`);
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
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(
      `${rel(executeItemFile)} must read item execution options through option entry`
    );
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(executeItemFile)} must not read item execution options directly`);
  }
}

function checkSnapshot() {
  const text = fs.readFileSync(snapshotFile, "utf8");
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(snapshotFile)} must read snapshot option facts through option entry`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(snapshotFile)} must not read snapshot option facts directly`);
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
checkUtilityEngine();
checkActivateSpirit();
checkExecuteItem();
checkSnapshot();

if (violations.length) {
  console.error("[verify-battle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-boundary] OK — battle workflow is behind one entry");
