import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-action-delay.js");
const ownerTest = path.normalize("src/battle/battle-action-delay.test.js");
const ownerRejectionTest = path.normalize("src/battle/battle-action-delay-rejection.test.js");
const watchdogDetailTest = path.normalize("src/battle/battle-action-delay-watchdog-detail.test.js");
const srcDir = path.join(root, "src", "battle");
const violations = [];
const delayOptionKeys = ["delayAlert", "delayAlertTime", "delayReload", "delayReloadTime"];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
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
  if (relative === owner || relative === ownerTest || relative.endsWith(".test.js")) return;
  const text = fs.readFileSync(file, "utf8");
  for (const key of delayOptionKeys) {
    if (text.includes(`"${key}"`) || text.includes(`'${key}'`)) {
      violations.push(`${rel(file)} action delay option key ${key} belongs in ${owner}`);
    }
  }
  if (/activeDelayTimers|trackDelayTimer/.test(text)) {
    violations.push(`${rel(file)} action delay timer lifecycle belongs in ${owner}`);
  }
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
  "BattleActionDelayEvent",
  "battleActionDelayEventHandlers",
  "runBattleActionDelayAutomation",
  "DELAY_ALERT_OPTION_KEY",
  "DELAY_ALERT_TIME_OPTION_KEY",
  "DELAY_RELOAD_OPTION_KEY",
  "DELAY_RELOAD_TIME_OPTION_KEY",
  "trackDelayTimer",
  "activeDelayTimers",
  "OptionEvent.READ_FIELD",
  "NavigationEvent.SCHEDULE_RELOAD",
  "detail: { source: \"battleActionDelay\", seconds, option }",
  "AlarmEvent.TRIGGER",
]);
requireText(ownerTest, [
  "does not track missing timer handles",
  "delayAlert",
  "delayReload",
]);
requireText(ownerRejectionTest, [
  "rejects unknown events without reading delay options",
  "rejects null events without reading delay options or touching timers",
]);
requireText(watchdogDetailTest, [
  "passes action watchdog evidence into the navigation reload event",
  "delayReloadTime: 11",
  "delayAlertTime: 0",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleActionDelayEvent\b|runBattleActionDelayAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleActionDelayAutomation\([^)]*\) \{[\s\S]*?\n\}/)
    ?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_ACTION_STARTED\][\s\S]*\[EVENT_ACTION_ENDED\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleActionDelayEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null events without touching timers`);
}
for (const key of delayOptionKeys) {
  if (!new RegExp(`const\\s+[A-Z_]+_OPTION_KEY\\s*=\\s*"${key}"`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} must define option key constant for ${key}`);
  }
}
if (/activeDelayTimers\.add\(deps\./.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must track timer handles through trackDelayTimer`
  );
}

walk(srcDir);

if (violations.length) {
  console.error("[verify-battle-action-delay-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-action-delay-contract] OK - action delay contract is locked");
