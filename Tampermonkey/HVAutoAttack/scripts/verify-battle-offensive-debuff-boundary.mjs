import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/debuff/decide-offensive-debuff.js");
const ownerTest = path.normalize("src/battle/debuff/decide-offensive-debuff.test.js");
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
  "BattleOffensiveDebuffEvent",
  "DECIDE",
  "runBattleOffensiveDebuff",
  "BattleAttackActionEvent.WILL_CLEAR_WITH_BIG_SKILL",
  "runBattleAttackAction",
  "willClearWithBigSkill",
  "burstControlFacts",
  "bossImperilFacts",
  "allDebuffFacts",
  "singleDebuffFacts",
  "decideBurstControl",
  "runBossImperilAutomation",
  "decideCastDebuffOnAll",
  "decideDeSkill",
  'debuffKey: "We"',
  'debuffKey: "Im"',
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleOffensiveDebuffEvent\b|runBattleOffensiveDebuff\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover offensive debuff contract`);
}

if (
  !actionDecisionText.includes("BattleOffensiveDebuffEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleOffensiveDebuff")
) {
  violations.push(`${rel(actionDecision)} must route offensive debuffs through their entry`);
}
if (/decideOffensiveDebuff\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call offensive debuff through old two-arg path`);
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
    if (/from\s+["'][^"']*debuff\/decide-offensive-debuff\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideOffensiveDebuff\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired offensive debuff two-arg path`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-offensive-debuff-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-offensive-debuff-boundary] OK - offensive debuffs are behind one entry"
);
