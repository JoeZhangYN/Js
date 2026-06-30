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
  "battleSurvivalActionEventHandlers",
  "DECIDE",
  "runBattleSurvivalAction",
  "SURVIVAL_ACTION_STEPS",
  'capability: "criticalBuffGuard"',
  'capability: "flee"',
  'capability: "autoPause"',
  'capability: "gem"',
  'capability: "potion"',
  'capability: "stallTopup"',
  'capability: "defend"',
  'capability: "scroll"',
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
  !/const SURVIVAL_ACTION_STEPS = \[\s*\{[\s\S]*capability: "criticalBuffGuard"[\s\S]*capability: "flee"[\s\S]*capability: "autoPause"[\s\S]*capability: "gem"[\s\S]*capability: "potion"[\s\S]*capability: "stallTopup"[\s\S]*capability: "defend"[\s\S]*capability: "scroll"[\s\S]*\]/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} must own explicit survival action priority order`);
}

if (/for \(const decide of \[/.test(ownerText)) {
  violations.push(`${rel(owner)} must not hide survival priority in an anonymous function array`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleSurvivalActionEvent\b|runBattleSurvivalAction\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleSurvivalAction\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover survival action contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown survival action events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown survival action events`);
  }
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
