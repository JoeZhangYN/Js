import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-action-effect-dispatch.js");
const ownerTest = path.normalize("src/battle/battle-action-effect-dispatch.test.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const legacyOwner = path.normalize("src/battle/dispatch.js");
const legacyOwnerTest = path.normalize("src/battle/dispatch.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

if (
  fs.existsSync(path.join(root, legacyOwner)) ||
  fs.existsSync(path.join(root, legacyOwnerTest))
) {
  violations.push(`${rel(legacyOwner)} legacy action effect path must stay retired`);
}

const ownerText = read(owner);
const actionDecisionText = read(actionDecision);

for (const required of [
  "BattleActionEffectDispatchEvent",
  "APPLY_ACTION_RESULT",
  "runBattleActionEffectDispatch",
  "BattleItemCommandEvent.CLICK_ITEM",
  "BattleSkillCommandEvent.CLICK_READY",
  "BattleDefendCommandEvent.CLICK",
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET",
  "BattleFleeCommandEvent.CLICK_AND_RELOAD",
  "BattlePauseEvent.PAUSE",
  "executeCriticalPause",
  "executeAttack",
  "executeItem",
  "executeChannel",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleActionEffectDispatchEvent\b|runBattleActionEffectDispatch\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover action effect dispatch contract`);
}

if (
  !actionDecisionText.includes("BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT") ||
  !actionDecisionText.includes("runBattleActionEffectDispatch")
) {
  violations.push(`${rel(actionDecision)} must apply decisions through the action effect entry`);
}
if (/from\s+["']\.\/dispatch\.js["']|(?<!Effect)dispatch\(/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call the retired dispatch path`);
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
    if (/from\s+["'][^"']*battle-action-effect-dispatch\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/from\s+["'][^"']*dispatch\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not import retired dispatch path`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-action-effect-dispatch-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-action-effect-dispatch-boundary] OK - action effects are behind one entry"
);
