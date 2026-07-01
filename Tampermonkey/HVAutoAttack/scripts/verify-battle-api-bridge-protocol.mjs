import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-api-bridge.js");
const ownerTest = path.normalize("src/battle/battle-api-bridge.test.js");
const responseScript = path.normalize("src/battle/battle-api-response-script.js");
const recovery = path.normalize("src/battle/battle-api-response-recovery.js");
const recoveryTest = path.normalize("src/battle/battle-api-response-recovery.test.js");
const worldContext = path.normalize("src/battle/battle-api-world-context.js");
const worldContextTest = path.normalize("src/battle/battle-api-world-context.test.js");
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
  "buildApiResponseScript",
  "BattleApiWorldContextEvent.READ_CURRENT",
  "runBattleApiWorldContext",
  "readBattleApiWorldContext",
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
  "readBattleApiWorldContext",
  "runBattleApiWorldContext",
  '"world":"persistent"',
  "responseKind",
  "actionDetail",
  "uses the current battle world API endpoint on the default path",
  "https://hentaiverse.org/isekai/json",
  "window.sessionStorage.delay * 1",
  "window.sessionStorage.delay2 * 1",
]);
const responseScriptText = requireText(responseScript, [
  "buildApiResponseScript",
  "window.HVAA_battleApiRecovery",
  "recovery.handleRejectedResponse",
  "a.error || a.reload",
  "responseKind",
  "actionDetail",
  "worldContext",
  "world: worldContext",
  'responseKind: "httpStatus"',
]);
const worldContextText = requireText(worldContext, [
  "BattleApiWorldContextEvent",
  "battleApiWorldContextEventHandlers",
  "runBattleApiWorldContext",
  "WORLD_ISEKAI",
  "WORLD_PERSISTENT",
  "apiJsonUrl",
  "isIsekai",
  "ISEKAI_URL",
  "MAIN_URL",
]);
requireText(worldContextTest, [
  "classifies persistent battle API authority",
  "classifies isekai battle API authority",
  "rejects unknown world context events",
  "https://hentaiverse.org/json",
  "https://hentaiverse.org/isekai/json",
]);
const recoveryText = requireText(recovery, [
  "BattleApiResponseRecoveryEvent",
  "battleApiResponseRecoveryEventHandlers",
  "runBattleApiResponseRecovery",
  "NavigationReloadReason.BATTLE_API_RESPONSE",
  "BattlePauseEvent.PAUSE",
  "readRecentDiagnosticEvidence",
  "API_RECOVERY_SESSION_KEY",
  "API_RECOVERY_BRIDGE_NAME",
  "REPEAT_PAUSE_THRESHOLD",
  "handleRejectedApiResponse",
  "world: detail?.world",
  "deps.pause()",
  "diagnosticEvidence",
  'reason: "battleApiResponseRepeated"',
  "deps.reload(detail)",
  "repeatCount >= REPEAT_PAUSE_THRESHOLD",
]);
requireText(recoveryTest, [
  "installs one page bridge that routes rejected responses through the recovery entry",
  "reloads once for a rejected API response with preserved evidence",
  "pauses instead of reloading repeated same-cause API rejection loops",
  "carries recent battle diagnostic evidence into repeated API pause state",
  "does not treat different rejected response evidence as the same loop",
  "does not treat different battle worlds as the same recovery loop",
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
if (/from\s+["']\.\.\/env\.js["']|isIsekai|ISEKAI_URL|MAIN_URL|BATTLE_API_BASE_URL/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must consume typed battle API world context`);
}
if (!ownerText.includes("worldContext.apiJsonUrl")) {
  violations.push(`${owner.replaceAll("\\", "/")} must use typed API JSON URL from world context`);
}
if (!responseScriptText.includes("world: worldContext")) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must audit rejected API world identity`);
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
if (/window\.location|location\.href|window\.location\.search/.test(ownerText + responseScriptText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not navigate directly from API response handling`
  );
}
if (!responseScriptText.includes("function reloadFromApiResponse(detail)")) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must classify API response reloads explicitly`);
}
if (!responseScriptText.includes("window.HVAA_battleApiRecovery")) {
  violations.push(`${responseScript.replaceAll("\\", "/")} page API response must call recovery bridge`);
}
if (!responseScriptText.includes("a.error || a.reload")) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must intercept API error/reload responses`);
}
if (!/a\.error \|\| a\.reload[\s\S]*reloadFromApiResponse\(\{[\s\S]*return false;/.test(responseScriptText)) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must block native process_action after API error/reload responses`
  );
}
if (!responseScriptText.includes("action: actionDetail()")) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must audit the rejected API action shape`);
}
if (!responseScriptText.includes('responseKind: "httpStatus"')) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must classify non-200 API responses`);
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
if (!recoveryText.includes("world: detail?.world")) {
  violations.push(`${recovery.replaceAll("\\", "/")} repeat key must include battle world identity`);
}
if (/window\.location|location\.href|window\.location\.search/.test(recoveryText)) {
  violations.push(`${recovery.replaceAll("\\", "/")} must route reload through navigation entry`);
}
if (!/export\s+function\s+runBattleApiWorldContext/.test(worldContextText)) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must expose one world context entry`);
}
if (!worldContextText.includes("deps.isIsekai ? deps.isekaiUrl : deps.mainUrl")) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must own battle API authority selection`);
}
if (!worldContextText.includes("world,") || !worldContextText.includes("WORLD_ISEKAI")) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must preserve typed world identity`);
}

if (violations.length) {
  console.error("[verify-battle-api-bridge-protocol] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-api-bridge-protocol] OK - battle API bridge protocol is locked");
