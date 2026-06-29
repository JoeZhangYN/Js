import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-stamina.js");
const ownerTest = path.normalize("src/battle/battle-stamina.test.js");
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
  "BattleStaminaEvent",
  "runBattleStaminaAutomation",
  "STAMINA_LOSS_THRESHOLD_OPTION_KEY",
  "DEFAULT_STAMINA_LOSS_THRESHOLD",
  "OptionEvent.READ_FIELD",
  "StaminaLossLogEvent.RECORD",
  "BattlePauseEvent.PAUSE",
  "parseLostStamina",
  "shouldPauseForLoss",
]);
requireText(ownerTest, ["staminaLose", "keeps missing or invalid thresholds"]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleStaminaEvent\b|runBattleStaminaAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
if (!/const\s+STAMINA_LOSS_THRESHOLD_OPTION_KEY\s*=\s*"staminaLose"/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must define stamina threshold option key`);
}
if (!/const\s+DEFAULT_STAMINA_LOSS_THRESHOLD\s*=\s*Number\.POSITIVE_INFINITY/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must define stamina threshold fallback`);
}
if (/key:\s*["']staminaLose["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use stamina threshold option key constant`);
}
if (/fallback:\s*Number\.POSITIVE_INFINITY/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use stamina threshold fallback constant`);
}

if (violations.length) {
  console.error("[verify-battle-stamina-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-stamina-contract] OK - stamina loss threshold contract is locked");
