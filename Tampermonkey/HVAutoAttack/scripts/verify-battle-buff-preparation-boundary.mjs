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
  "DECIDE",
  "runBattleBuffPreparation",
  "buffPreparationFacts",
  "decideInfusion",
  "decideChannel",
  "decideBuff",
  "isEmptyDecision",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleBuffPreparationEvent\b|runBattleBuffPreparation\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover buff preparation contract`);
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
