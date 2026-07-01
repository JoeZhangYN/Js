import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-api-bridge.js");
const ownerTest = path.normalize("src/battle/battle-api-bridge.test.js");
const recovery = path.normalize("src/battle/battle-api-response-recovery.js");
const recoveryTest = path.normalize("src/battle/battle-api-response-recovery.test.js");
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
  "BattleApiResponseRecoveryEvent.INSTALL_BRIDGE",
  "runBattleApiResponseRecovery",
  "BATTLE_API_BASE_URL",
  "isIsekai ? ISEKAI_URL : MAIN_URL",
]);
requireText(ownerTest, [
  'document.getElementById("eventStart").click()',
  'document.getElementById("eventEnd").click()',
  "return d.apply(window.battle || this, arguments)",
  "binds native process_action callbacks to the active battle instance",
  "does not navigate directly from generated API response handling",
  "blocks native process_action for API reload and error responses",
  "window.HVAA_battleApiRecovery",
  "recovery.handleRejectedResponse",
  "a.error || a.reload",
  "records API response reload evidence for diagnostics",
  "installApiResponseRecovery",
  "responseKind",
  "actionDetail",
  "uses the current battle world API endpoint on the default path",
  "https://hentaiverse.org/isekai/json",
  "window.sessionStorage.delay * 1",
  "window.sessionStorage.delay2 * 1",
]);
const recoveryText = requireText(recovery, [
  "BattleApiResponseRecoveryEvent",
  "battleApiResponseRecoveryEventHandlers",
  "runBattleApiResponseRecovery",
  "NavigationReloadReason.BATTLE_API_RESPONSE",
  "BattlePauseEvent.PAUSE",
  "API_RECOVERY_SESSION_KEY",
  "API_RECOVERY_BRIDGE_NAME",
  "REPEAT_PAUSE_THRESHOLD",
  "handleRejectedApiResponse",
  "deps.pause()",
  "deps.reload(detail)",
  "repeatCount >= REPEAT_PAUSE_THRESHOLD",
]);
requireText(recoveryTest, [
  "installs one page bridge that routes rejected responses through the recovery entry",
  "reloads once for a rejected API response with preserved evidence",
  "pauses instead of reloading repeated same-cause API rejection loops",
  "does not treat different rejected response evidence as the same loop",
  "HVAA:battleApiRecovery",
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
if (!ownerText.includes("return d.apply(window.battle || this, arguments)")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must bind native process_action callbacks to window.battle`
  );
}
if (!ownerText.includes("mainUrl: BATTLE_API_BASE_URL")) {
  violations.push(`${owner.replaceAll("\\", "/")} must use the current battle world API endpoint`);
}
if (!ownerText.includes("deps.installApiResponseRecovery()")) {
  violations.push(`${owner.replaceAll("\\", "/")} must install API recovery before scripts`);
}
if (/NavigationReloadReason|BattlePauseEvent|runNavigationAutomation|runBattlePauseAutomation/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not choose recovery effects directly`);
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
if (!ownerText.includes("function reloadFromApiResponse(detail)")) {
  violations.push(`${owner.replaceAll("\\", "/")} must classify API response reloads explicitly`);
}
if (!ownerText.includes("window.HVAA_battleApiRecovery")) {
  violations.push(`${owner.replaceAll("\\", "/")} page API response must call recovery bridge`);
}
if (!ownerText.includes("a.error || a.reload")) {
  violations.push(`${owner.replaceAll("\\", "/")} must intercept API error/reload responses`);
}
if (!/a\.error \|\| a\.reload[\s\S]*reloadFromApiResponse\(\{[\s\S]*return false;/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must block native process_action after API error/reload responses`
  );
}
if (!ownerText.includes("action: actionDetail()")) {
  violations.push(`${owner.replaceAll("\\", "/")} must audit the rejected API action shape`);
}
if (!ownerText.includes('responseKind: "httpStatus"')) {
  violations.push(`${owner.replaceAll("\\", "/")} must classify non-200 API responses`);
}
if (!/export\s+function\s+runBattleApiResponseRecovery/.test(recoveryText)) {
  violations.push(`${recovery.replaceAll("\\", "/")} must expose one recovery entry`);
}
if (!recoveryText.includes("repeatCount >= REPEAT_PAUSE_THRESHOLD")) {
  violations.push(`${recovery.replaceAll("\\", "/")} must stop repeated API reload loops`);
}
if (!recoveryText.includes("deps.pause()") || !recoveryText.includes("deps.reload(detail)")) {
  violations.push(`${recovery.replaceAll("\\", "/")} must choose between pause and reload centrally`);
}
if (/window\.location|location\.href|window\.location\.search/.test(recoveryText)) {
  violations.push(`${recovery.replaceAll("\\", "/")} must route reload through navigation entry`);
}

if (violations.length) {
  console.error("[verify-battle-api-bridge-protocol] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-api-bridge-protocol] OK - battle API bridge protocol is locked");
