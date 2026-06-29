import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-api-bridge.js");
const ownerTest = path.normalize("src/battle/battle-api-bridge.test.js");
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
  "ACTION_START_EVENT_NODE_ID",
  "ACTION_END_EVENT_NODE_ID",
  "MAGIC_DELAY_SESSION_KEY",
  "ACTION_DELAY_SESSION_KEY",
  "__HVAA_ACTION_START_EVENT_NODE_ID__",
  "__HVAA_ACTION_END_EVENT_NODE_ID__",
  "__HVAA_MAGIC_DELAY_SESSION_KEY__",
  "__HVAA_ACTION_DELAY_SESSION_KEY__",
  "BattleApiBridgeEvent",
  "runBattleApiBridgeAutomation",
  "OptionEvent.READ_FIELD",
]);
requireText(ownerTest, [
  'document.getElementById("eventStart").click()',
  'document.getElementById("eventEnd").click()',
  "window.sessionStorage.delay * 1",
  "window.sessionStorage.delay2 * 1",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleApiBridgeEvent\b|runBattleApiBridgeAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
if (/document\.getElementById\(["']event(Start|End)["']\)/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must generate event node ids through protocol constants`
  );
}
if (/window\.sessionStorage\.(delay|delay2)\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must generate delay keys through protocol constants`
  );
}

if (violations.length) {
  console.error("[verify-battle-api-bridge-protocol] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-api-bridge-protocol] OK - battle API bridge protocol is locked");
