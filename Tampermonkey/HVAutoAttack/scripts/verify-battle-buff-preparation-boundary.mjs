import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/buff/decide-buff-preparation.js");
const ownerTest = path.normalize("src/battle/buff/decide-buff-preparation.test.js");
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
  "BattleBuffPreparationEvent",
  "battleBuffPreparationEventHandlers",
  "DECIDE",
  "runBattleBuffPreparation",
  "BUFF_PREPARATION_STEPS",
  'capability: "infusion"',
  'capability: "channel"',
  'capability: "buff"',
  "buffPreparationFacts",
  "decideInfusion",
  "decideChannel",
  "decideBuff",
  "isEmptyDecision",
  "EMPTY_DECISION_PREDICATES",
  "EMPTY_CHANNEL_PLAN_PREDICATES",
  "isEmptyChannelPlanDecision",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  !/const BUFF_PREPARATION_STEPS = \[\s*\{[\s\S]*capability: "infusion"[\s\S]*capability: "channel"[\s\S]*capability: "buff"[\s\S]*\]/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} must own explicit buff preparation priority order`);
}

if (/for \(const decide of \[/.test(ownerText)) {
  violations.push(`${rel(owner)} must not hide buff preparation priority in an anonymous array`);
}
for (const required of [
  "noop: () => true",
  '"channel-plan": isEmptyChannelPlanDecision',
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must lock empty buff preparation decision ${required}`);
  }
}
const emptyDecisionBody =
  ownerText.match(/function isEmptyDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/result\.kind\s*===|plan\.type\s*===/.test(emptyDecisionBody)) {
  violations.push(`${rel(owner)} must route empty buff preparation decisions through predicate tables`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleBuffPreparationEvent\b|runBattleBuffPreparation\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleBuffPreparation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover buff preparation contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown buff preparation events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown buff preparation events`);
  }
}

if (
  !actionDecisionText.includes("BattleBuffPreparationEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleBuffPreparation")
) {
  violations.push(`${rel(actionDecision)} must route buff preparation through its entry`);
}
if (/decideBuffPreparation\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call buff preparation through old two-arg path`);
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
    if (/from\s+["'][^"']*buff\/decide-buff-preparation\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideBuffPreparation\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired buff preparation two-arg path`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-buff-preparation-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-buff-preparation-boundary] OK - buff preparation is behind one entry");
