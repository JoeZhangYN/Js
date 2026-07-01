import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-next-round-continuation.js");
const ownerTest = path.normalize("src/battle/battle-next-round-continuation.test.js");
const rejectionTest = path.normalize("src/battle/battle-next-round-continuation-rejection.test.js");
const evidenceFailureTest = path.normalize(
  "src/battle/battle-next-round-continuation-evidence-failure.test.js"
);
const recording = path.normalize("src/battle/battle-next-round-continuation-recording.js");
const actionLifecycle = path.normalize("src/battle/battle-action-lifecycle.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const recordingText = read(recording);
const actionLifecycleText = read(actionLifecycle);

for (const required of [
  "BattleNextRoundContinuationEvent",
  "battleNextRoundContinuationEventHandlers",
  "runBattleNextRoundContinuation",
  "CONTINUE",
  "RiddleEvent.BATTLE_POST_RESULT",
  "BattleRoundStartEvent.ROUND_STARTED",
  "runBattleTurnAutomation",
  "BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE",
  "PHASE_NEXT_ROUND_CONTINUATION",
  "recordContinuation",
  "unknownNextRoundContinuationEvent",
  "missingCompletionControl",
  "nextRoundCompletionControlReadFailed",
  "nextRoundContinuationStepThrew",
  "nextRoundRestartRejected",
  "readCompletionControls",
  "recordStep",
  "recordContinuationSafely",
  "recordCallbackRejection",
  "#pane_completion",
  "#btcp",
  "#battle_right",
  "#battle_left",
  "unsafeWindow.battle",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}
for (const required of [
  "recordContinuationSafely",
  "nextRoundContinuationEvidenceWriteFailed",
  'step: "recordContinuation"',
  "deps.recordContinuation?.(result, steps)",
]) {
  if (!recordingText.includes(required)) {
    violations.push(`${rel(recording)} must own safe continuation recording ${required}`);
  }
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
} else {
  const ownerTestText = read(ownerTest);
  if (
    !ownerTestText.includes("rejects unknown next-round continuation events without side effects")
  ) {
    violations.push(`${rel(ownerTest)} must cover unknown next-round continuation events`);
  }
  if (!ownerTestText.includes("rejects null next-round continuation events without side effects")) {
    violations.push(`${rel(ownerTest)} must cover null next-round continuation events`);
  }
  if (
    !ownerTestText.includes(
      "rejects missing next-round completion controls with lifecycle evidence"
    )
  ) {
    violations.push(`${rel(ownerTest)} must cover missing completion controls`);
  }
  for (const required of [
    "recordContinuation",
    'outcome: "continued"',
    'outcome: "riddle"',
    'outcome: "rejected"',
    "replaceBattlePanels",
    "restartBattleRuntime",
    "handleRiddle",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${rel(ownerTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, rejectionTest))) {
  violations.push(`${rel(rejectionTest)} must cover next-round continuation rejection evidence`);
} else {
  const rejectionTestText = read(rejectionTest);
  for (const required of [
    "records rejected continuation when restarted turn does not act",
    "records callback step exceptions without throwing",
    "records completion control read failures before posting",
    "nextRoundCompletionControlReadFailed",
    "nextRoundRestartRejected",
    "nextRoundContinuationStepThrew",
  ]) {
    if (!rejectionTestText.includes(required)) {
      violations.push(`${rel(rejectionTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, evidenceFailureTest))) {
  violations.push(`${rel(evidenceFailureTest)} must cover continuation evidence failures`);
} else {
  const evidenceFailureTestText = read(evidenceFailureTest);
  for (const required of [
    "keeps a restarted next-round turn accepted when continuation evidence fails once",
    "keeps rejected continuations rejected when continuation evidence keeps failing",
    "nextRoundContinuationEvidenceWriteFailed",
    "continuation evidence failed",
    "restartBattleRuntime",
  ]) {
    if (!evidenceFailureTestText.includes(required)) {
      violations.push(`${rel(evidenceFailureTest)} must cover ${required}`);
    }
  }
}
const entryBody =
  ownerText.match(/export function runBattleNextRoundContinuation\([^)]*\)[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_CONTINUE\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleNextRoundContinuationEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null events without next-round side effects`);
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
