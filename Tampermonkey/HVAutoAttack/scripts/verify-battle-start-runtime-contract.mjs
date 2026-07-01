import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-start-runtime.js");
const ownerTest = path.normalize("src/battle/battle-start-runtime.test.js");
const srcDir = path.join(root, "src", "battle");
const violations = [];

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
  if (/\b(?:deps\.)?g\(\s*["']attackStatus["']/.test(text)) {
    violations.push(`${rel(file)} must read attackStatus through ${owner}`);
  }
  if (/readOptionField\(\s*["']attackStatus["']/.test(text)) {
    violations.push(`${rel(file)} attackStatus option key belongs in ${owner}`);
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
  "BattleStartRuntimeEvent",
  "runBattleStartRuntimeAutomation",
  "battleStartRuntimeEventHandlers",
  "ATTACK_STATUS_RUNTIME_KEY",
  "ATTACK_STATUS_OPTION_KEY",
  "DEFAULT_ATTACK_STATUS",
  "normalizeAttackStatus",
  "OptionEvent.READ_FIELD",
  "BattleActionSpeedEvent.BATTLE_STARTED",
]);
requireText(ownerTest, [
  "attackStatus",
  "normalizes numeric attack status",
  "rejects unknown events without touching start runtime state",
  "rejects null events without touching start runtime state",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleStartRuntimeEvent\b|runBattleStartRuntimeAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
if (!/const battleStartRuntimeEventHandlers\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through one table`);
}
if (!ownerText.includes("battleStartRuntimeEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null events without runtime side effects`);
}
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not route events through an if ladder`);
}
for (const [constant, key] of [
  ["ATTACK_STATUS_RUNTIME_KEY", "attackStatus"],
  ["ATTACK_STATUS_OPTION_KEY", "attackStatus"],
]) {
  if (!new RegExp(`const\\s+${constant}\\s*=\\s*"${key}"`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} must define ${constant}`);
  }
}
for (const direct of [
  /deps\.read\(["']attackStatus["']\)/,
  /deps\.write\(["']attackStatus["']/,
  /readOptionField\(["']attackStatus["']/,
]) {
  if (direct.test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} must use attackStatus key constants`);
  }
}

walk(srcDir);

if (violations.length) {
  console.error("[verify-battle-start-runtime-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-start-runtime-contract] OK - start runtime attackStatus contract is locked"
);
