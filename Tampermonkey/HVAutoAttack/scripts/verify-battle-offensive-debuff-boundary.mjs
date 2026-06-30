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
  "battleOffensiveDebuffEventHandlers",
  "DECIDE",
  "runBattleOffensiveDebuff",
  "BattleAttackActionEvent.WILL_CLEAR_WITH_BIG_SKILL",
  "runBattleAttackAction",
  "willClearWithBigSkill",
  "BigSkillDebuffEvent.SHOULD_SKIP_DEBUFF",
  "runBigSkillDebuffAutomation",
  "BattleStallModeEvent.READ_ACTIVE",
  "runBattleStallModeAutomation",
  "stallActive",
  "skipWeakenForBigSkill",
  "skipImperilForBigSkill",
  "burstControlFacts",
  "bossImperilFacts",
  "debuffActionFacts",
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

const entryBody =
  ownerText.match(/export function runBattleOffensiveDebuff\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover offensive debuff contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown offensive debuff events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown offensive debuff events`);
  }
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
