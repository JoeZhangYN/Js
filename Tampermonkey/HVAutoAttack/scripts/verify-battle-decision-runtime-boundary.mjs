import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-decision-runtime.js");
const ownerTest = path.normalize("src/battle/battle-decision-runtime.test.js");
const turnContext = path.normalize("src/battle/turn-context.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const turnContextText = read(turnContext);

for (const required of [
  "BattleDecisionRuntimeEvent",
  "runBattleDecisionRuntime",
  "READ_CURRENT",
  "BattleProgressEvent.READ_CONTEXT",
  "BattleStartRuntimeEvent.READ_ATTACK_STATUS",
  "BattleSpiritToggleEvent.READ_LAST_TOGGLE",
  "lastSpiritToggleGlobalTurn",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleDecisionRuntimeEvent\b|runBattleDecisionRuntime\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover decision runtime entry contract`);
}
if (
  !turnContextText.includes("BattleDecisionRuntimeEvent.READ_CURRENT") ||
  !turnContextText.includes("runBattleDecisionRuntime")
) {
  violations.push(`${rel(turnContext)} must attach decision runtime through one entry`);
}
if (
  /BattleProgressEvent\.READ_CONTEXT|BattleStartRuntimeEvent\.READ_ATTACK_STATUS|BattleSpiritToggleEvent\.READ_LAST_TOGGLE|runBattleProgressAutomation|runBattleStartRuntimeAutomation|runBattleSpiritToggleAutomation/.test(
    turnContextText
  )
) {
  violations.push(`${rel(turnContext)} must not assemble decision runtime facts directly`);
}

if (violations.length) {
  console.error("[verify-battle-decision-runtime-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-decision-runtime-boundary] OK - decision runtime facts are behind one entry"
);
