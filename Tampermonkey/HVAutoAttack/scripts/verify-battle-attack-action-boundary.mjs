import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/attack/decide-attack-action.js");
const ownerTest = path.normalize("src/battle/attack/decide-attack-action.test.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const offensiveDebuff = path.normalize("src/battle/debuff/decide-offensive-debuff.js");
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
  "BattleAttackActionEvent",
  "battleAttackActionEventHandlers",
  "DECIDE",
  "WILL_CLEAR_WITH_BIG_SKILL",
  "AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL",
  "runBattleAttackAction",
  "attackFacts",
  "decideAttack",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleAttackActionEvent\b|runBattleAttackAction\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleAttackAction\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\][\s\S]*\[EVENT_WILL_CLEAR_WITH_BIG_SKILL\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover attack action contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown attack action events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown attack action events`);
  }
}

if (
  !actionDecisionText.includes("BattleAttackActionEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleAttackAction")
) {
  violations.push(`${rel(actionDecision)} must route attack through its entry`);
}
if (/decideAttackAction\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call attack action through old two-arg path`);
}

for (const relative of ["src/battle", "src/core"]) {
  const dir = path.join(root, relative);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const normalized = path.normalize(path.relative(root, file));
    if (normalized === owner || normalized === actionDecision || normalized === offensiveDebuff) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*attack\/decide-attack-action\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideAttackAction\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired attack action two-arg path`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-attack-action-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-attack-action-boundary] OK - attack action is behind one entry");
