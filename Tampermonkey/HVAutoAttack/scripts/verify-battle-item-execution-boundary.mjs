import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/item/execute-item.js");
const consumptionLearning = path.normalize("src/battle/item/item-consumption-learning.js");
const ownerTest = path.normalize("src/battle/item/execute-item.test.js");
const autoTuneFailureTest = path.normalize("src/battle/item/execute-item-autotune-failure.test.js");
const commandFailureTest = path.normalize("src/battle/item/execute-item-command-failure.test.js");
const typedFailureTest = path.normalize("src/battle/item/execute-item-typed-failure.test.js");
const rejectionTest = path.normalize("src/battle/item/execute-item-rejection.test.js");
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
const consumptionLearningText = read(consumptionLearning);
const actionEffectText = read(actionEffect);
const actionEffectExecutionText = read(actionEffectExecution);

for (const required of [
  "BattleItemExecutionEvent",
  "battleItemExecutionEventHandlers",
  "APPLY_PLAN",
  "runBattleItemExecution",
  "ITEM_PLAN_EXECUTORS",
  "STALL_ATTEMPT_EXECUTORS",
  "executeGemPlan",
  "executePotionPlan",
  "executeStallPlan",
  "executeScrollPlan",
  "recordConsumedRecoveryItem",
  "BattleItemCommandEvent.CLICK_GEM",
  "BattleItemCommandEvent.CLICK_ITEM",
  "RecoveryLearningEvent.RECORD_PRE_DRINK",
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "BattleFocusCommandEvent.CLICK",
  "itemExecutionActed",
  'result?.kind === "failed"',
  "recordItemExecutionFailure",
  "itemSubCommandThrew",
  "recoveryAbs",
  "recordActionEffectEvidence",
  "unknownItemExecutionEvent",
  "rejectUnknownItemExecutionEvent(event)",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}
for (const required of [
  "AutoTuneEvent.RECORD_POTION_USE",
  "UtilityWeightLearningEvent.RECORD_POTION_USE",
  "recordConsumedRecoveryItem",
  "result.autoTune = false",
  "result.utilityWeight = false",
]) {
  if (!consumptionLearningText.includes(required)) {
    violations.push(
      `${rel(consumptionLearning)} must isolate item-consumption learning failures from acted semantics`
    );
  }
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleItemExecutionEvent\b|runBattleItemExecution\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleItemExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_PLAN\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleItemExecutionEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null execution events as not acted`);
}
for (const required of [
  "noop: executeNoopPlan",
  "gem: executeGemPlan",
  "potion: executePotionPlan",
  "stall: executeStallPlan",
  "scroll: executeScrollPlan",
  '"spirit-off": executeStallSpiritOffAttempt',
  "focus: executeStallFocusAttempt",
  "draught: executeStallDraughtAttempt",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must lock item execution step ${required}`);
  }
}
const applyPlanBody = ownerText.match(/function applyItemPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/switch\s*\(\s*plan\.type\s*\)/.test(applyPlanBody)) {
  violations.push(`${rel(owner)} must dispatch item plans by ITEM_PLAN_EXECUTORS`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover item execution contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("does not claim gem use when the gem command cannot click")) {
    violations.push(`${rel(ownerTest)} must cover failed gem commands as not acted`);
  }
}
if (!fs.existsSync(path.join(root, commandFailureTest))) {
  violations.push(`${rel(commandFailureTest)} must cover item execution sub-command exceptions`);
} else {
  const commandFailureTestText = read(commandFailureTest);
  for (const required of [
    "records item command exceptions as not acted item execution evidence",
    "records stall focus command exceptions as not acted item execution evidence",
    "records stall spirit command exceptions as not acted item execution evidence",
    "itemSubCommandThrew",
  ]) {
    if (!commandFailureTestText.includes(required)) {
      violations.push(`${rel(commandFailureTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, typedFailureTest))) {
  violations.push(`${rel(typedFailureTest)} must cover typed failed item commands`);
} else {
  const typedFailureTestText = read(typedFailureTest);
  for (const required of [
    "does not claim typed failed gem commands as acted",
    "continues stall attempts after a typed failed focus command",
    "continues scroll candidates after a typed failed item command",
    'kind: "failed"',
  ]) {
    if (!typedFailureTestText.includes(required)) {
      violations.push(`${rel(typedFailureTest)} must cover ${required}`);
    }
  }
}
if (/return !!runBattle/.test(ownerText)) {
  violations.push(
    `${rel(owner)} must not booleanize item command entry results before typed failure normalization`
  );
}
if (!fs.existsSync(path.join(root, autoTuneFailureTest))) {
  violations.push(`${rel(autoTuneFailureTest)} must cover auto-tune record failures`);
} else {
  const autoTuneFailureTestText = read(autoTuneFailureTest);
  for (const required of [
    "keeps clicked gems acted when auto-tune recording fails",
    "keeps clicked potions acted when auto-tune recording fails",
    "keeps clicked gems acted when utility recording fails",
    "auto tune failed",
  ]) {
    if (!autoTuneFailureTestText.includes(required)) {
      violations.push(`${rel(autoTuneFailureTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, rejectionTest))) {
  violations.push(`${rel(rejectionTest)} must cover item execution rejection evidence`);
} else {
  const rejectionTestText = read(rejectionTest);
  if (
    !rejectionTestText.includes(
      "rejects unknown and null item execution events as not acted with evidence"
    )
  ) {
    violations.push(`${rel(rejectionTest)} must cover unknown and null item execution events`);
  }
  for (const required of [
    "runBattleActionEffectEvidence",
    "unknown-item-execution-event",
    "unknownItemExecutionEvent",
    '[{ type: "unknown" }, "unknown"]',
    "[null, null]",
    "eventType,",
  ]) {
    if (!rejectionTestText.includes(required)) {
      violations.push(`${rel(rejectionTest)} must cover ${required}`);
    }
  }
}

if (
  !actionEffectExecutionText.includes("BattleItemExecutionEvent.APPLY_PLAN") ||
  !actionEffectExecutionText.includes("runBattleItemExecution")
) {
  violations.push(`${rel(actionEffectExecution)} must execute item plans through the item entry`);
}
if (
  /\bexecuteItem\s*\(/.test(actionEffectText) ||
  /\bexecuteItem\s*\(/.test(actionEffectExecutionText)
) {
  violations.push(`${rel(actionEffectExecution)} must not call the retired executeItem path`);
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
    if (/from\s+["'][^"']*item\/execute-item\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass action effect dispatch for item plans`);
    }
    if (/\bexecuteItem\s*\(/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired executeItem directly`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-item-execution-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-item-execution-boundary] OK - item execution is behind one entry");
