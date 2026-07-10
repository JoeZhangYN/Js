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
const resultRecording = path.normalize("src/battle/battle-next-round-continuation-result.js");
const actionLifecycle = path.normalize("src/battle/battle-action-lifecycle.js");
const actionLifecycleDeps = path.normalize("src/battle/battle-action-lifecycle-deps.js");
const httpFile = path.normalize("src/dom/http.js");
const httpTest = path.normalize("src/dom/http.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const recordingText = read(recording);
const resultRecordingText = read(resultRecording);
const actionLifecycleText = read(actionLifecycle);
const actionLifecycleWiringText = `${actionLifecycleText}\n${read(actionLifecycleDeps)}`;
const httpText = read(httpFile);

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
  "nextRoundPostFailed",
  "readCompletionControls",
  "recordStep",
  "normalizeStepResult",
  'rawResult?.kind === "failed"',
  "return { result: false, detail: rawResult }",
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
  "recordCallbackRejection",
  "recordPostFailure",
  "postFailure",
  "recordContinuationSafely",
]) {
  if (!resultRecordingText.includes(required)) {
    violations.push(`${rel(resultRecording)} must own ${required}`);
  }
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
    "does not treat typed failed restarted turns as successful",
    "records callback step exceptions without throwing",
    "records completion control read failures before posting",
    "records rejected continuation when next-round post fails",
    "nextRoundCompletionControlReadFailed",
    "nextRoundRestartRejected",
    "nextRoundContinuationStepThrew",
    "nextRoundPostFailed",
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
    "expect(result).toBe(false)",
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
  !actionLifecycleWiringText.includes("BattleNextRoundContinuationEvent.CONTINUE") ||
  !actionLifecycleWiringText.includes("runBattleNextRoundContinuation")
) {
  violations.push(`${rel(actionLifecycle)} must continue next rounds through one entry`);
}
if (
  /RiddleEvent\.BATTLE_POST_RESULT|BattleRoundStartEvent\.ROUND_STARTED|runBattleRoundStartAutomation|unsafeWindow\.battle|#pane_completion|#battle_right|#battle_left|post\(/.test(
    actionLifecycleWiringText
  )
) {
  violations.push(`${rel(actionLifecycle)} must not own next-round continuation IO`);
}
for (const required of ["onFailure", "httpStatus", "networkError"]) {
  if (!httpText.includes(required)) {
    violations.push(`${rel(httpFile)} must classify transport failures with ${required}`);
  }
}
if (!fs.existsSync(path.join(root, httpTest))) {
  violations.push(`${rel(httpTest)} must cover HTTP transport failure classification`);
} else {
  const httpTestText = read(httpTest);
  for (const required of [
    "reports non-success HTTP status instead of silently dropping the request",
    "reports final network failure after retry attempts are exhausted",
    "httpStatus",
    "networkError",
  ]) {
    if (!httpTestText.includes(required)) {
      violations.push(`${rel(httpTest)} must cover ${required}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-next-round-continuation-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-next-round-continuation-boundary] OK - next-round continuation is behind one entry"
);
