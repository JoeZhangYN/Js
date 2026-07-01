import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-action-speed.js");
const ownerTest = path.normalize("src/battle/battle-action-speed.test.js");
const srcDir = path.join(root, "src", "battle");
const violations = [];
const runtimeKeys = ["timeNow", "runSpeed"];

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
  for (const key of runtimeKeys) {
    if (text.includes(`"${key}"`) || text.includes(`'${key}'`)) {
      violations.push(`${rel(file)} action speed runtime key ${key} belongs in ${owner}`);
    }
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
  "BattleActionSpeedEvent",
  "runBattleActionSpeedAutomation",
  "battleActionSpeedEventHandlers",
  "ACTION_TIMESTAMP_RUNTIME_KEY",
  "ACTION_SPEED_RUNTIME_KEY",
  "normalizeTimestamp",
  "formatRunSpeed",
  "DEFAULT_RUN_SPEED",
  "TimeEvent.EPOCH_MS",
]);
requireText(ownerTest, [
  "runSpeed",
  "timeNow",
  "normalizes invalid action speed runtime values",
  "rejects unknown events",
  "rejects null events without reading or writing runtime state",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleActionSpeedEvent\b|runBattleActionSpeedAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
if (!/const battleActionSpeedEventHandlers\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through one table`);
}
if (!ownerText.includes("battleActionSpeedEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null events without touching runtime state`);
}
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not route events through an if ladder`);
}
for (const key of runtimeKeys) {
  if (!new RegExp(`const\\s+[A-Z_]+_RUNTIME_KEY\\s*=\\s*"${key}"`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} must define runtime key constant for ${key}`);
  }
}
for (const direct of [
  /deps\.read\(["'](?:timeNow|runSpeed)["']\)/,
  /deps\.write\(["'](?:timeNow|runSpeed)["']/,
]) {
  if (direct.test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must use runtime key constants for reads/writes`
    );
  }
}

walk(srcDir);

if (violations.length) {
  console.error("[verify-battle-action-speed-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-action-speed-contract] OK - action speed runtime keys are locked");
