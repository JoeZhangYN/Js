import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/buff/execute-channel.js");
const ownerTest = path.normalize("src/battle/buff/execute-channel.test.js");
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
const actionEffectText = read(actionEffect);
const actionEffectExecutionText = read(actionEffectExecution);

for (const required of [
  "BattleChannelExecutionEvent",
  "battleChannelExecutionEventHandlers",
  "APPLY_PLAN",
  "runBattleChannelExecution",
  "CHANNEL_PLAN_EXECUTORS",
  "click: executeClickPlan",
  "BattleSkillCommandEvent.CLICK_READY",
  "runBattleSkillCommand",
  "recordChannelExecutionFailure",
  "channelSkillCommandThrew",
  "BattleActionEffectEvidenceEvent.RECORD_APPLIED",
  "runBattleActionEffectEvidence",
  "unknownChannelExecutionEvent",
  "rejectUnknownChannelExecutionEvent(event)",
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
  ownerText.match(/export function runBattleChannelExecution\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_PLAN\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleChannelExecutionEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null execution events as not acted`);
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
  if (
    !ownerTestText.includes(
      "rejects unknown and null channel execution events as not acted with evidence"
    )
  ) {
    violations.push(`${rel(ownerTest)} must cover unknown and null channel execution events`);
  }
  for (const required of [
    "runBattleActionEffectEvidence",
    "unknown-channel-execution-event",
    "unknownChannelExecutionEvent",
    '[{ type: "unknown" }, "unknown"]',
    "[null, null]",
    "eventType,",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${rel(ownerTest)} must cover ${required}`);
    }
  }
  if (!ownerTestText.includes("returns the command result")) {
    violations.push(`${rel(ownerTest)} must cover channel command acted semantics`);
  }
  if (
    !ownerTestText.includes(
      "records skill command exceptions as not acted channel execution evidence"
    ) ||
    !ownerTestText.includes("channelSkillCommandThrew")
  ) {
    violations.push(`${rel(ownerTest)} must cover thrown channel skill command evidence`);
  }
}

if (
  !actionEffectExecutionText.includes("BattleChannelExecutionEvent.APPLY_PLAN") ||
  !actionEffectExecutionText.includes("runBattleChannelExecution")
) {
  violations.push(
    `${rel(actionEffectExecution)} must execute channel plans through the channel entry`
  );
}
if (
  /\bexecuteChannel\s*\(/.test(actionEffectText) ||
  /\bexecuteChannel\s*\(/.test(actionEffectExecutionText)
) {
  violations.push(`${rel(actionEffectExecution)} must not call the retired executeChannel path`);
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
