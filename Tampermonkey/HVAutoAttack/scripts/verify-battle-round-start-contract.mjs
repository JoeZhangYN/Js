import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/new-round.js");
const ownerTest = path.normalize("src/battle/new-round.test.js");
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
]);
const roundLifecycleText = requireText(path.normalize("src/battle/round-lifecycle.js"), [
  "BattleRoundLifecycleEvent",
  "runBattleRoundLifecycle",
  "battleRoundLifecycleEventHandlers",
  "BattleSkillUsageEvent.RESET_ROUND",
  "MonsterKnowledgeEvent.ROUND_STARTED",
]);
requireText(ownerTest, ["recordStartContext", "recordStartCount", 'roundType: "ba"']);

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

if (violations.length) {
  console.error("[verify-battle-round-start-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-round-start-contract] OK - round start uses battle-round entry");
