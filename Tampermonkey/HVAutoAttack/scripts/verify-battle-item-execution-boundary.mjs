import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/item/execute-item.js");
const ownerTest = path.normalize("src/battle/item/execute-item.test.js");
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
  "BattleItemExecutionEvent",
  "battleItemExecutionEventHandlers",
  "APPLY_PLAN",
  "runBattleItemExecution",
  "AutoTuneEvent.RECORD_POTION_USE",
  "BattleItemCommandEvent.CLICK_GEM",
  "BattleItemCommandEvent.CLICK_ITEM",
  "RecoveryLearningEvent.RECORD_PRE_DRINK",
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "BattleFocusCommandEvent.CLICK",
  "recoveryAbs",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleItemExecutionEvent\b|runBattleItemExecution\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleItemExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_PLAN\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover item execution contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown item execution events")) {
    violations.push(`${rel(ownerTest)} must cover unknown item execution events`);
  }
}

if (
  !actionEffectText.includes("BattleItemExecutionEvent.APPLY_PLAN") ||
  !actionEffectText.includes("runBattleItemExecution")
) {
  violations.push(`${rel(actionEffect)} must execute item plans through the item entry`);
}
if (/\bexecuteItem\s*\(/.test(actionEffectText)) {
  violations.push(`${rel(actionEffect)} must not call the retired executeItem path`);
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
