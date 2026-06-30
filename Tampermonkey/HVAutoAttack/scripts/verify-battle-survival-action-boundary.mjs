import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/decide-survival-action.js");
const ownerTest = path.normalize("src/battle/decide-survival-action.test.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const actionDecisionText = read(actionDecision);

for (const required of [
  "BattleSurvivalActionEvent",
  "DECIDE",
  "runBattleSurvivalAction",
  "decideCriticalBuff",
  "decideFlee",
  "decideAutoPause",
  "runBattleItemDecision",
  "decideDefend",
  "BattleItemDecisionEvent.DECIDE_GEM",
  "BattleItemDecisionEvent.DECIDE_POTION",
  "BattleItemDecisionEvent.DECIDE_STALL_TOPUP",
  "BattleItemDecisionEvent.DECIDE_SCROLL",
  "isEmptyDecision",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleSurvivalActionEvent\b|runBattleSurvivalAction\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover survival action contract`);
}

if (
  !actionDecisionText.includes("BattleSurvivalActionEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleSurvivalAction")
) {
  violations.push(`${rel(actionDecision)} must route survival through the survival action entry`);
}
if (/decideSurvivalAction\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call survival through old two-arg path`);
}

for (const relative of ["src/battle", "src/core"]) {
  const dir = path.join(root, relative);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const normalized = path.normalize(path.relative(root, file));
    if (normalized === owner || normalized === actionDecision) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*decide-survival-action\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideSurvivalAction\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired survival two-arg path`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-survival-action-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-survival-action-boundary] OK - survival action is behind one entry");
