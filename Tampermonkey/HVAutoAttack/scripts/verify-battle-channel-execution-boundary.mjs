import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/buff/execute-channel.js");
const ownerTest = path.normalize("src/battle/buff/execute-channel.test.js");
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
  "BattleChannelExecutionEvent",
  "battleChannelExecutionEventHandlers",
  "APPLY_PLAN",
  "runBattleChannelExecution",
  "CHANNEL_PLAN_EXECUTORS",
  "click: executeClickPlan",
  "BattleSkillCommandEvent.CLICK_READY",
  "runBattleSkillCommand",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleChannelExecutionEvent\b|runBattleChannelExecution\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleChannelExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_PLAN\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
const applyPlanBody =
  ownerText.match(/function applyChannelPlan\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/plan\.type\s*===/.test(applyPlanBody)) {
  violations.push(`${rel(owner)} must dispatch channel plans by CHANNEL_PLAN_EXECUTORS`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover channel execution contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown channel execution events")) {
    violations.push(`${rel(ownerTest)} must cover unknown channel execution events`);
  }
}

if (
  !actionEffectText.includes("BattleChannelExecutionEvent.APPLY_PLAN") ||
  !actionEffectText.includes("runBattleChannelExecution")
) {
  violations.push(`${rel(actionEffect)} must execute channel plans through the channel entry`);
}
if (/\bexecuteChannel\s*\(/.test(actionEffectText)) {
  violations.push(`${rel(actionEffect)} must not call the retired executeChannel path`);
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
    if (/from\s+["'][^"']*buff\/execute-channel\.js["']/.test(text)) {
      violations.push(
        `${rel(normalized)} must not bypass action effect dispatch for channel plans`
      );
    }
    if (/\bexecuteChannel\s*\(/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired executeChannel directly`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-channel-execution-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-channel-execution-boundary] OK - channel execution is behind one entry"
);
