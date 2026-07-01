import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/attack/execute-attack.js");
const ownerTest = path.normalize("src/battle/attack/execute-attack.test.js");
const mercifulSideEffectTest = path.normalize(
  "src/battle/attack/execute-attack-merciful-side-effect.test.js"
);
const bookkeeping = path.normalize("src/battle/attack/physical-skill-bookkeeping.js");
const bookkeepingTest = path.normalize("src/battle/attack/physical-skill-bookkeeping.test.js");
const actionEffect = path.normalize("src/battle/battle-action-effect-dispatch.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const bookkeepingText = read(bookkeeping);
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
if (!ownerText.includes("battleAttackExecutionEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null execution events as not acted`);
}
if (!bookkeepingText.includes("physicalSkillBookkeepingEventHandlers[event?.type]")) {
  violations.push(`${rel(bookkeeping)} must reject null physical fire bookkeeping events`);
}
if (!bookkeepingText.includes("return true;") || !bookkeepingText.includes("?? false")) {
  violations.push(`${rel(bookkeeping)} must report whether physical fire bookkeeping was recorded`);
}
if (!fs.existsSync(path.join(root, bookkeepingTest))) {
  violations.push(`${rel(bookkeepingTest)} must cover physical fire bookkeeping contract`);
} else {
  const bookkeepingTestText = read(bookkeepingTest);
  if (
    !bookkeepingTestText.includes(
      "rejects unknown physical skill bookkeeping events without side effects"
    )
  ) {
    violations.push(`${rel(bookkeepingTest)} must cover unknown physical bookkeeping events`);
  }
  if (!bookkeepingTestText.includes("runPhysicalSkillBookkeeping(null)")) {
    violations.push(`${rel(bookkeepingTest)} must cover null physical bookkeeping events`);
  }
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
  if (!ownerTestText.includes("rejects null attack execution events as not acted")) {
    violations.push(`${rel(ownerTest)} must cover null attack execution events`);
  }
  if (!ownerTestText.includes("does not claim spell, physical, or default attack plans")) {
    violations.push(`${rel(ownerTest)} must cover failed target commands as not acted`);
  }
  if (!ownerTestText.includes("returns the Focus command result instead of claiming a missing click acted")) {
    violations.push(`${rel(ownerTest)} must cover failed Focus commands as not acted`);
  }
}
if (!fs.existsSync(path.join(root, mercifulSideEffectTest))) {
  violations.push(`${rel(mercifulSideEffectTest)} must cover failed merciful physical plans`);
} else {
  const mercifulSideEffectTestText = read(mercifulSideEffectTest);
  if (
    !mercifulSideEffectTestText.includes(
      "does not click the default target when the merciful skill-target command fails"
    )
  ) {
    violations.push(
      `${rel(mercifulSideEffectTest)} must cover failed merciful physical plans without side effects`
    );
  }
}

const physicalPlanBody =
  ownerText.match(/function executePhysicalPlan\(plan, snap\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!physicalPlanBody.includes("if (acted && plan.mercifulTargetId != null)")) {
  violations.push(`${rel(owner)} merciful default target click must be gated by acted`);
}
if (physicalPlanBody.includes("if (plan.mercifulTargetId != null) {\n    runBattleTargetCommand")) {
  violations.push(`${rel(owner)} must not click default target after a failed merciful command`);
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
