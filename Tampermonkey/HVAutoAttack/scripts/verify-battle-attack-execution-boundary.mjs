import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/attack/execute-attack.js");
const ownerTest = path.normalize("src/battle/attack/execute-attack.test.js");
const actionEffect = path.normalize("src/battle/battle-action-effect-dispatch.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const actionEffectText = read(actionEffect);

for (const required of [
  "BattleAttackExecutionEvent",
  "battleAttackExecutionEventHandlers",
  "APPLY_PLAN",
  "runBattleAttackExecution",
  "ATTACK_PLAN_EXECUTORS",
  "executeFocusPlan",
  "executeToggleSpiritPlan",
  "executeSpellPlan",
  "executeMercifulSinglePlan",
  "executePhysicalPlan",
  "executeDefaultPlan",
  "BattleFocusCommandEvent.CLICK",
  "return !!runBattleFocusCommand",
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET",
  "BattleTargetCommandEvent.CLICK_TARGET",
  "PhysicalSkillBookkeepingEvent.RECORD_FIRE",
  "observedBigSkillBosses",
  "return !!runBattleTargetCommand",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleAttackExecutionEvent\b|runBattleAttackExecution\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleAttackExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_PLAN\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
for (const required of [
  "noop: executeNoopPlan",
  "focus: executeFocusPlan",
  '"toggle-spirit": executeToggleSpiritPlan',
  "spell: executeSpellPlan",
  '"merciful-single": executeMercifulSinglePlan',
  "physical: executePhysicalPlan",
  "default: executeDefaultPlan",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must lock attack plan executor ${required}`);
  }
}
const applyPlanBody = ownerText.match(/function applyAttackPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/switch\s*\(\s*plan\.type\s*\)/.test(applyPlanBody)) {
  violations.push(`${rel(owner)} must dispatch attack plan execution by ATTACK_PLAN_EXECUTORS`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover attack execution contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown attack execution events")) {
    violations.push(`${rel(ownerTest)} must cover unknown attack execution events`);
  }
  if (!ownerTestText.includes("does not claim spell, physical, or default attack plans")) {
    violations.push(`${rel(ownerTest)} must cover failed target commands as not acted`);
  }
  if (!ownerTestText.includes("returns the Focus command result instead of claiming a missing click acted")) {
    violations.push(`${rel(ownerTest)} must cover failed Focus commands as not acted`);
  }
}

if (
  !actionEffectText.includes("BattleAttackExecutionEvent.APPLY_PLAN") ||
  !actionEffectText.includes("runBattleAttackExecution")
) {
  violations.push(`${rel(actionEffect)} must execute attack plans through the attack entry`);
}
if (/\bexecuteAttack\s*\(/.test(actionEffectText)) {
  violations.push(`${rel(actionEffect)} must not call the retired executeAttack path`);
}

for (const relative of ["src/battle", "src/core"]) {
  const dir = path.join(root, relative);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const normalized = path.normalize(path.relative(root, file));
    if (normalized === owner || normalized === actionEffect) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*attack\/execute-attack\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass action effect dispatch for attack plans`);
    }
    if (/\bexecuteAttack\s*\(/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired executeAttack directly`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-attack-execution-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-attack-execution-boundary] OK - attack execution is behind one entry");
