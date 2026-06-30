import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-next-round-continuation.js");
const ownerTest = path.normalize("src/battle/battle-next-round-continuation.test.js");
const actionLifecycle = path.normalize("src/battle/battle-action-lifecycle.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const actionLifecycleText = read(actionLifecycle);

for (const required of [
  "BattleNextRoundContinuationEvent",
  "runBattleNextRoundContinuation",
  "CONTINUE",
  "RiddleEvent.BATTLE_POST_RESULT",
  "BattleRoundStartEvent.ROUND_STARTED",
  "runBattleTurnAutomation",
  "#pane_completion",
  "#btcp",
  "#battle_right",
  "#battle_left",
  "unsafeWindow.battle",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleNextRoundContinuationEvent\b|runBattleNextRoundContinuation\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover next-round continuation contract`);
}
if (
  !actionLifecycleText.includes("BattleNextRoundContinuationEvent.CONTINUE") ||
  !actionLifecycleText.includes("runBattleNextRoundContinuation")
) {
  violations.push(`${rel(actionLifecycle)} must continue next rounds through one entry`);
}
if (
  /RiddleEvent\.BATTLE_POST_RESULT|BattleRoundStartEvent\.ROUND_STARTED|runBattleRoundStartAutomation|unsafeWindow\.battle|#pane_completion|#battle_right|#battle_left|post\(/.test(
    actionLifecycleText
  )
) {
  violations.push(`${rel(actionLifecycle)} must not own next-round continuation IO`);
}

if (violations.length) {
  console.error("[verify-battle-next-round-continuation-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-next-round-continuation-boundary] OK - next-round continuation is behind one entry"
);
