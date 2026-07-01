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
  "battleApiBridgeEventHandlers",
  "runBattleApiBridgeAutomation",
  "OptionEvent.READ_FIELD",
]);
requireText(ownerTest, [
  'document.getElementById("eventStart").click()',
  'document.getElementById("eventEnd").click()',
  "const nativeBattleContinue = battle.battle_continue",
  "battle.battle_continue = function ()",
  "return false",
  "return d.apply(battle, arguments)",
  "battle.battle_continue = nativeBattleContinue",
  "binds native process_action callbacks to the active battle instance without native continuation",
  "does not navigate directly from generated API response handling",
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
const entryBody =
  ownerText.match(/export function runBattleApiBridgeAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_INSTALL\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
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
if (!ownerText.includes("const battle = window.battle || this")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must bind native process_action callbacks to window.battle`
  );
}
if (!ownerText.includes("const nativeBattleContinue = battle.battle_continue")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must capture native battle_continue before process_action`
  );
}
if (!/battle\.battle_continue\s*=\s*function\s*\(\)\s*\{\s*return false;\s*\};/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must suppress native battle_continue during process_action`
  );
}
if (!ownerText.includes("return d.apply(battle, arguments)")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must bind native process_action callbacks to window.battle`
  );
}
if (!ownerText.includes("battle.battle_continue = nativeBattleContinue")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must restore native battle_continue after process_action`
  );
}
if (/b\.onreadystatechange\s*=\s*d\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not install bare process_action callbacks`
  );
}
if (/window\.location|location\.href|window\.location\.search/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not navigate directly from API response handling`
  );
}

if (violations.length) {
  console.error("[verify-battle-api-bridge-protocol] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-api-bridge-protocol] OK - battle API bridge protocol is locked");
