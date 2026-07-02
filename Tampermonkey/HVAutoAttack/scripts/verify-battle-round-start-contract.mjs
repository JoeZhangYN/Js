import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-round-start.js");
const ownerTest = path.normalize("src/battle/battle-round-start.test.js");
const rejectionTest = path.normalize("src/battle/battle-round-start-rejection.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function requireText(relative, required) {
  const text = read(relative);
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
  return text;
}

const ownerText = requireText(owner, [
  "BattleRoundStartEvent",
  "runBattleRoundStartAutomation",
  "battleRoundStartEventHandlers",
  "BattleRoundStartEvidenceEvent.RECORD_ROUND_START",
  "runBattleRoundStartEvidence",
  "unknownRoundStartEvent",
  "battleRoundStartEventHandlers[event?.type]",
  "recordRoundStart(EVENT_ROUND_STARTED, ready, steps)",
  "recordRoundStartContext",
  "BattleRoundLifecycleEvent.ROUND_STARTED",
  "BattleRoundLifecycleEvent.ROUND_READY",
  "runBattleRoundLifecycle",
  "BattleRoundStartLogEvent.READ_CURRENT",
  "runBattleRoundStartLog",
  "BattleRoundEvent.RECORD_START_CONTEXT",
  "BattleRoundEvent.RECORD_START_COUNT",
  "MonsterStatusEvent.PREPARE_ROUND_START",
  "EncounterEvent.RANDOM_ENCOUNTER_STARTED",
  "cleanupBattleHash",
  'source: "battleRoundStart"',
  "hash: window.location.hash",
]);
if (fs.existsSync(path.join(root, "src/battle/new-round.js"))) {
  violations.push("src/battle/new-round.js legacy round start path must stay deleted");
}
if (fs.existsSync(path.join(root, "src/battle/new-round.test.js"))) {
  violations.push("src/battle/new-round.test.js legacy round start test path must stay deleted");
}
const roundLifecycleText = requireText(path.normalize("src/battle/round-lifecycle.js"), [
  "BattleRoundLifecycleEvent",
  "runBattleRoundLifecycle",
  "battleRoundLifecycleEventHandlers",
  "BattleSkillUsageEvent.RESET_ROUND",
  "MonsterKnowledgeEvent.ROUND_STARTED",
]);
const roundLifecycleTestText = read(path.normalize("src/battle/round-lifecycle.test.js"));
const roundStartLogText = requireText(path.normalize("src/battle/round-start-log.js"), [
  "BattleRoundStartLogEvent",
  "runBattleRoundStartLog",
  "battleRoundStartLogEventHandlers",
  "BATTLE_LOG_SELECTOR",
  "emptyRoundStartLog",
]);
const roundStartLogTestText = read(path.normalize("src/battle/round-start-log.test.js"));
const ownerTestText = requireText(ownerTest, [
  "recordStartContext",
  "recordStartCount",
  'roundType: "ba"',
  "HVAA:lastBattleRoundStart",
]);
const rejectionTestText = requireText(rejectionTest, [
  "rejects unknown events with round-start evidence",
  "rejects null events with round-start evidence instead of throwing",
  "returns false when monster status repair schedules recovery before round ready",
  "HVAA:lastBattleRoundStart",
]);
requireText(path.normalize("src/battle/battle-round-start-evidence.js"), [
  "BattleRoundStartEvidenceEvent",
  "runBattleRoundStartEvidence",
  "DiagnosticEvidenceKey.BATTLE_ROUND_START",
  "battleRoundStartEvidenceEventHandlers[event?.type]",
  "[HVAA] battle round start",
  "storageWriteOk",
  "storageWriteError",
]);
requireText(path.normalize("src/battle/battle-round-start-evidence.test.js"), [
  "records battle round-start evidence",
  "rejects null round-start evidence events without writing diagnostics",
  "HVAA:lastBattleRoundStart",
]);
const diagnosticKeysText = read(path.normalize("src/core/diagnostic-evidence-keys.js"));
for (const required of [
  'BATTLE_ROUND_START: "HVAA:lastBattleRoundStart"',
  'source("battleRoundStart", DiagnosticEvidenceKey.BATTLE_ROUND_START)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`src/core/diagnostic-evidence-keys.js must include ${required}`);
  }
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleRoundStartEvent\b|runBattleRoundStartAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
if (/from\s+["']\.\.\/state\/store\.js["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not import raw battle runtime store`);
}
if (/\bg\(\s*["']roundType["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read or write roundType directly`);
}
if (/OptionEvent|runOptionAutomation|["']encounter["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not decide encounter option gates directly`);
}
if (
  /BattleRoundEvent\.(?:READ_TYPE|CLASSIFY_TYPE|RECORD_TYPE|RECORD_COUNT_FROM_INITIALIZATION|RECORD_SINGLE_ROUND)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} must use the battle-round start context`);
}
if (/MonsterStatusEvent\.(?:RECORD_SPAWN_ROSTER|ENSURE_READY)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use monster-status round start prepare`);
}
if (/AutoTuneEvent|BattleTurnEvent|BattleSkillUsageEvent|MonsterKnowledgeEvent/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use the round lifecycle entry`);
}
if (/gE\(|#textlog|textContent|battleLog\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use the round-start log entry`);
}
if (/\.match\(\s*["']Initializing["']\s*\)|\/Initializing/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not decide initialization text directly`);
}
if (/if\s*\(\s*event\.type\s*(?:={2,3}|!==?)\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(roundLifecycleText)) {
  violations.push("src/battle/round-lifecycle.js must dispatch events through handler table");
}
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(roundStartLogText)) {
  violations.push("src/battle/round-start-log.js must dispatch events through handler table");
}
if (/battleRoundLifecycleEventHandlers\[event\.type\]/.test(roundLifecycleText)) {
  violations.push("src/battle/round-lifecycle.js must fail closed before handler dispatch");
}
if (!/battleRoundLifecycleEventHandlers\[event\?\.type\]/.test(roundLifecycleText)) {
  violations.push("src/battle/round-lifecycle.js must dispatch with optional event type");
}
if (/battleRoundStartLogEventHandlers\[event\.type\]/.test(roundStartLogText)) {
  violations.push("src/battle/round-start-log.js must fail closed before handler dispatch");
}
if (!/battleRoundStartLogEventHandlers\[event\?\.type\]/.test(roundStartLogText)) {
  violations.push("src/battle/round-start-log.js must dispatch with optional event type");
}
if (!/runBattleRoundLifecycle\(null\)/.test(roundLifecycleTestText)) {
  violations.push("src/battle/round-lifecycle.test.js must lock invalid lifecycle events");
}
if (!/runBattleRoundStartLog\(null\)/.test(roundStartLogTestText)) {
  violations.push("src/battle/round-start-log.test.js must lock invalid round-start log events");
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
  violations.push("src/battle/round-lifecycle.js must start auto-tune before battle-turn round runtime");
}
if (
  readyRoundLifecycleBody.indexOf("BattleSkillUsageEvent.RESET_ROUND") === -1 ||
  readyRoundLifecycleBody.indexOf("MonsterKnowledgeEvent.ROUND_STARTED") === -1 ||
  readyRoundLifecycleBody.indexOf("BattleSkillUsageEvent.RESET_ROUND") >
    readyRoundLifecycleBody.indexOf("MonsterKnowledgeEvent.ROUND_STARTED")
) {
  violations.push("src/battle/round-lifecycle.js must reset skill usage before monster knowledge round start");
}
if (!/const BATTLE_LOG_SELECTOR = ["']#textlog>tbody>tr>td["']/.test(roundStartLogText)) {
  violations.push("src/battle/round-start-log.js must own the battle log selector constant");
}
const pauseGateIndex = ownerText.indexOf("if (staminaOutcome.paused)");
const prepareIndex = ownerText.indexOf("MonsterStatusEvent.PREPARE_ROUND_START");
const recordCountIndex = ownerText.indexOf("BattleRoundEvent.RECORD_START_COUNT");
const roundReadyIndex = ownerText.indexOf("BattleRoundLifecycleEvent.ROUND_READY");
if (
  pauseGateIndex === -1 ||
  prepareIndex === -1 ||
  recordCountIndex === -1 ||
  roundReadyIndex === -1 ||
  pauseGateIndex > prepareIndex ||
  pauseGateIndex > recordCountIndex ||
  pauseGateIndex > roundReadyIndex
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must stop round preparation at stamina pause gate`
  );
}
if (!ownerTestText.includes("stops round preparation when stamina gate pauses the round")) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must lock stamina pause round-start gate`);
}
if (!ownerTestText.includes("toBe(false)") || !rejectionTestText.includes("toBe(false)")) {
  violations.push("round-start tests must assert non-ready round-start returns false");
}
if (!ownerTestText.includes("routes battle hash cleanup reload with the original hash evidence")) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover battle hash cleanup detail`);
}

if (violations.length) {
  console.error("[verify-battle-round-start-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-round-start-contract] OK - round start uses battle-round entry");
