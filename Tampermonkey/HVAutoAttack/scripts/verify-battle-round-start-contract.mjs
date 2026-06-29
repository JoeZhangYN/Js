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
  "determineRoundType",
  "BattleRoundEvent.READ_TYPE",
  "BattleRoundEvent.CLASSIFY_TYPE",
  "BattleRoundEvent.RECORD_TYPE",
  "BattleRoundEvent.RECORD_COUNT_FROM_INITIALIZATION",
  "EncounterEvent.RANDOM_ENCOUNTER_STARTED",
]);
requireText(ownerTest, ["recordCountFromInitialization", 'roundType: "ba"']);

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

if (violations.length) {
  console.error("[verify-battle-round-start-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-round-start-contract] OK - round start uses battle-round entry");
