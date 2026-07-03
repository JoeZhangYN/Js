import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/attack/execute-attack.js");
const ownerTest = path.normalize("src/battle/attack/execute-attack.test.js");
const commandFailureTest = path.normalize(
  "src/battle/attack/execute-attack-command-failure.test.js"
);
const typedFailureTest = path.normalize(
  "src/battle/attack/execute-attack-typed-failure.test.js"
);
const mercifulSideEffectTest = path.normalize(
  "src/battle/attack/execute-attack-merciful-side-effect.test.js"
);
const mercifulFallback = path.normalize("src/battle/attack/execute-merciful-fallback.js");
const bookkeeping = path.normalize("src/battle/attack/physical-skill-bookkeeping.js");
const bookkeepingTest = path.normalize("src/battle/attack/physical-skill-bookkeeping.test.js");
const actionEffect = path.normalize("src/battle/battle-action-effect-dispatch.js");
const actionEffectExecution = path.normalize("src/battle/battle-action-effect-execution.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const mercifulFallbackText = read(mercifulFallback);
const bookkeepingText = read(bookkeeping);
const actionEffectText = read(actionEffect);
const actionEffectExecutionText = read(actionEffectExecution);

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
  "attackExecutionActed",
  'result?.kind === "failed"',
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET",
  "BattleTargetCommandEvent.CLICK_TARGET",
  "PhysicalSkillBookkeepingEvent.RECORD_FIRE",
  "observedBigSkillBosses",
  "recordAttackExecutionFailure",
  "clickMercifulFallbackTarget",
  "attackSubCommandThrew",
  "recordActionEffectEvidence",
  "unknownAttackExecutionEvent",
  "rejectUnknownAttackExecutionEvent(event)",
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
  ownerText.match(/export function runBattleAttackExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
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
const applyPlanBody =
  ownerText.match(/function applyAttackPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/switch\s*\(\s*plan\.type\s*\)/.test(applyPlanBody)) {
  violations.push(`${rel(owner)} must dispatch attack plan execution by ATTACK_PLAN_EXECUTORS`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover attack execution contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (
    !ownerTestText.includes(
      "rejects unknown and null attack execution events as not acted with evidence"
    )
  ) {
    violations.push(`${rel(ownerTest)} must cover unknown and null attack execution events`);
  }
  for (const required of [
    "runBattleActionEffectEvidence",
    "unknown-attack-execution-event",
    "unknownAttackExecutionEvent",
    '[{ type: "unknown" }, "unknown"]',
    "[null, null]",
    "eventType,",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${rel(ownerTest)} must cover ${required}`);
    }
  }
  if (!ownerTestText.includes("does not claim spell, physical, or default attack plans")) {
    violations.push(`${rel(ownerTest)} must cover failed target commands as not acted`);
  }
  if (
    !ownerTestText.includes(
      "returns the Focus command result instead of claiming a missing click acted"
    )
  ) {
    violations.push(`${rel(ownerTest)} must cover failed Focus commands as not acted`);
  }
}
if (!fs.existsSync(path.join(root, typedFailureTest))) {
  violations.push(`${rel(typedFailureTest)} must cover typed failed attack commands`);
} else {
  const typedFailureTestText = read(typedFailureTest);
  for (const required of [
    "does not claim typed failed attack commands as acted",
    "does not click the merciful fallback target after a typed failed skill-target command",
    'kind: "failed"',
  ]) {
    if (!typedFailureTestText.includes(required)) {
      violations.push(`${rel(typedFailureTest)} must cover ${required}`);
    }
  }
}
if (/return !!runBattle/.test(ownerText)) {
  violations.push(`${rel(owner)} must not booleanize attack command entry results before typed failure normalization`);
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
  for (const required of [
    "keeps acted merciful physical plans acted when the fallback target command throws",
    "keeps acted merciful physical plans acted when the fallback target command rejects",
    "keeps acted merciful physical plans acted when fallback target returns typed failure",
    "mercifulFallbackTargetThrew",
    "mercifulFallbackTargetRejected",
    'kind: "failed"',
    "acted: true",
  ]) {
    if (!mercifulSideEffectTestText.includes(required)) {
      violations.push(`${rel(mercifulSideEffectTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, commandFailureTest))) {
  violations.push(`${rel(commandFailureTest)} must cover attack execution sub-command exceptions`);
} else {
  const commandFailureTestText = read(commandFailureTest);
  for (const required of [
    "records Focus command exceptions as not acted attack execution evidence",
    "records Spirit command exceptions as not acted attack execution evidence",
    "records target command exceptions as not acted attack execution evidence",
    "attackSubCommandThrew",
  ]) {
    if (!commandFailureTestText.includes(required)) {
      violations.push(`${rel(commandFailureTest)} must cover ${required}`);
    }
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
if (!physicalPlanBody.includes("clickMercifulFallbackTarget(plan)")) {
  violations.push(`${rel(owner)} merciful fallback click must be isolated from acted result`);
}
const mercifulFallbackBody =
  mercifulFallbackText.match(/export function clickMercifulFallbackTarget\(plan\) \{[\s\S]*?\n\}/)
    ?.[0] || "";
if (
  !mercifulFallbackBody.includes("try {") ||
  !mercifulFallbackBody.includes("recordMercifulFallbackTargetFailure") ||
  !mercifulFallbackBody.includes("catch (error)")
) {
  violations.push(`${rel(mercifulFallback)} merciful fallback click must record rejected/thrown effects`);
}
for (const required of [
  "recordMercifulFallbackTargetFailure",
  "mercifulFallbackTargetClicked",
  'result?.kind === "failed"',
  "mercifulFallbackTargetThrew",
  "mercifulFallbackTargetRejected",
  "acted: true",
]) {
  if (!mercifulFallbackText.includes(required)) {
    violations.push(`${rel(mercifulFallback)} must preserve ${required}`);
  }
}

if (
  !actionEffectExecutionText.includes("BattleAttackExecutionEvent.APPLY_PLAN") ||
  !actionEffectExecutionText.includes("runBattleAttackExecution")
) {
  violations.push(
    `${rel(actionEffectExecution)} must execute attack plans through the attack entry`
  );
}
if (
  /\bexecuteAttack\s*\(/.test(actionEffectText) ||
  /\bexecuteAttack\s*\(/.test(actionEffectExecutionText)
) {
  violations.push(`${rel(actionEffectExecution)} must not call the retired executeAttack path`);
}

for (const relative of ["src/battle", "src/core"]) {
  const dir = path.join(root, relative);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const normalized = path.normalize(path.relative(root, file));
    if (normalized === owner || normalized === actionEffect || normalized === actionEffectExecution)
      continue;
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
