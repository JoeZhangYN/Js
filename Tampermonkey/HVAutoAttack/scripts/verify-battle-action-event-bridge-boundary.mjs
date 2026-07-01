import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-action-event-bridge.js");
const ownerTest = path.normalize("src/battle/battle-action-event-bridge.test.js");
const apiBridge = path.normalize("src/battle/battle-api-bridge.js");
const apiBridgeTest = path.normalize("src/battle/battle-api-bridge.test.js");
const apiBridgeRejectionTest = path.normalize("src/battle/battle-api-bridge-rejection.test.js");
const apiBridgeRuntimeTest = path.normalize("src/battle/battle-api-bridge-runtime.test.js");
const legacyReloader = path.normalize("src/battle/reloader.js");
const legacyActionStart = path.normalize("src/battle/battle-action-start.js");
const legacyActionEnd = path.normalize("src/battle/battle-action-end.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  if (
    relative !== owner &&
    relative !== ownerTest &&
    relative !== apiBridge &&
    relative !== apiBridgeTest &&
    relative !== apiBridgeRejectionTest &&
    relative !== apiBridgeRuntimeTest &&
    /eventStart|eventEnd/.test(text)
  ) {
    violations.push(`${rel(file)} eventStart/eventEnd bridge nodes belong behind ${owner}`);
  }
  if (
    relative !== owner &&
    relative !== apiBridge &&
    relative !== apiBridgeTest &&
    relative !== apiBridgeRejectionTest &&
    relative !== apiBridgeRuntimeTest &&
    /from\s+["']\.\/battle-api-bridge\.js["']/.test(text)
  ) {
    violations.push(`${rel(file)} must not import battle API bridge directly`);
  }
  if (/from\s+["']\.\/reloader\.js["']/.test(text)) {
    violations.push(`${rel(file)} must not import legacy reloader.js`);
  }
  if (/from\s+["']\.\/battle-action-(?:start|end)\.js["']/.test(text)) {
    violations.push(`${rel(file)} must report action events through battle-action-lifecycle`);
  }
}

function requireText(relative, required) {
  const text = fs.readFileSync(path.join(root, relative), "utf8");
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
}

if (fs.existsSync(path.join(root, legacyReloader))) {
  violations.push(`${legacyReloader.replaceAll("\\", "/")} legacy bridge file must stay deleted`);
}
for (const legacy of [legacyActionStart, legacyActionEnd]) {
  if (fs.existsSync(path.join(root, legacy))) {
    violations.push(
      `${legacy.replaceAll("\\", "/")} legacy action lifecycle split must stay deleted`
    );
  }
}

walk(srcDir);

requireText(owner, [
  "BattleActionEventBridgeEvent",
  "battleActionEventBridgeEventHandlers",
  "runBattleActionEventBridgeAutomation",
  "BattleActionLifecycleEvent.ACTION_STARTED",
  "BattleActionLifecycleEvent.ACTION_ENDED",
  "runBattleActionLifecycleAutomation",
  "runBattleActionLifecycleEvidence",
  "rejectUnknownActionEventBridgeEvent",
  "unknownActionEventBridgeEvent",
  "BattleApiBridgeEvent.INSTALL",
  "eventStart",
  "eventEnd",
]);
requireText("src/battle/battle-automation.js", [
  "BattleActionEventBridgeEvent.INSTALL",
  "runBattleActionEventBridgeAutomation",
]);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (
  /\bexport\s+(?:function|const)\s+(?!BattleActionEventBridgeEvent\b|runBattleActionEventBridgeAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleActionEventBridgeAutomation\([^)]*\) \{[\s\S]*?\n\}/)
    ?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_INSTALL\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (
  !ownerText.includes(
    "battleActionEventBridgeEventHandlers[event?.type]?.(event) ?? rejectUnknownActionEventBridgeEvent(event)"
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} must route unknown events through bridge evidence`);
}
const rejectionBody =
  ownerText.match(/function rejectUnknownActionEventBridgeEvent\(event\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
for (const required of [
  "phase: EVENT_UNKNOWN_ACTION_EVENT_BRIDGE",
  "reason: EVENT_UNKNOWN_ACTION_EVENT_BRIDGE",
  "eventType: event?.type ?? null",
  "runBattleActionLifecycleEvidence",
]) {
  if (!rejectionBody.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} bridge rejection must include ${required}`);
  }
}
if (rejectionBody.includes("runBattleActionLifecycleAutomation(event ?? null)")) {
  violations.push(`${owner.replaceAll("\\", "/")} must not misclassify bridge rejection as lifecycle rejection`);
}
const ownerTestText = fs.existsSync(path.join(root, ownerTest)) ? fs.readFileSync(path.join(root, ownerTest), "utf8") : "";
for (const required of [
  "rejects unknown events",
  "rejects null events through bridge evidence instead of throwing",
  "unknownActionEventBridgeEvent",
  "runBattleActionLifecycleAutomation).not.toHaveBeenCalled",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (/\bapi_call\b|\bapi_response\b|sessionStorage\.delay\b|\.textContent\s*=/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not own API bridge script injection`);
}

if (violations.length) {
  console.error("[verify-battle-action-event-bridge-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-action-event-bridge-boundary] OK - battle action event bridge has one entry"
);
