import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-action-effect-dispatch.js");
const execution = path.normalize("src/battle/battle-action-effect-execution.js");
const ownerTest = path.normalize("src/battle/battle-action-effect-dispatch.test.js");
const exceptionTest = path.normalize("src/battle/battle-action-effect-dispatch-exception.test.js");
const evidenceFailureTest = path.normalize(
  "src/battle/battle-action-effect-evidence-failure.test.js"
);
const pauseResultTest = path.normalize("src/battle/battle-action-effect-pause-result.test.js");
const commandEvidenceTest = path.normalize(
  "src/battle/battle-action-effect-command-evidence.test.js"
);
const commandEvidenceFailureTest = path.normalize(
  "src/battle/battle-action-effect-command-evidence-failure.test.js"
);
const evidence = path.normalize("src/battle/battle-action-effect-evidence.js");
const recording = path.normalize("src/battle/battle-action-effect-recording.js");
const evidenceTest = path.normalize("src/battle/battle-action-effect-evidence.test.js");
const recordingFallbackTest = path.normalize(
  "src/battle/battle-action-effect-recording-fallback.test.js"
);
const evidenceExceptionTest = path.normalize(
  "src/battle/battle-action-effect-evidence-exception.test.js"
);
const planFailureTest = path.normalize("src/battle/battle-action-effect-plan-failure.test.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const actionDecisionDispatch = path.normalize("src/battle/battle-action-decision-dispatch.js");
const executionRecordingFailureTest = path.normalize(
  "src/battle/battle-execution-recording-failure.test.js"
);
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
const executionText = read(execution);
const evidenceText = read(evidence);
const recordingText = read(recording);
const actionDecisionText = read(actionDecision);
const actionDecisionDispatchText = read(actionDecisionDispatch);

for (const required of [
  "BattleActionEffectDispatchEvent",
  "APPLY_ACTION_RESULT",
  "battleActionEffectDispatchEventHandlers",
  "runBattleActionEffectDispatch",
  "executeActionResult",
  "isKnownActionResultKind",
  "recordActionEffectEvidence",
  "readBattleCommandEvidence",
  "readCommandEvidenceSafely",
  "readFreshCommandEvidence",
  "commandEvidenceReadError: previousCommandEvidence.error || freshCommandEvidence.error",
  "rejectUnknownActionEffectEvent",
  "unknownActionEffectDispatchEvent",
  "knownResultKind: isKnownActionResultKind(result?.kind)",
  "knownResultKind: false",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

for (const required of [
  "ACTION_RESULT_EXECUTORS",
  "executeNoopResult",
  "BattleItemCommandEvent.CLICK_ITEM",
  "BattleSkillCommandEvent.CLICK_READY",
  "BattleDefendCommandEvent.CLICK",
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "BattlePreCastSpiritEvent.ACTIVATE_IF_ALLOWED",
  "runBattlePreCastSpiritAutomation",
  "BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET",
  "BattleFleeCommandEvent.CLICK_AND_RELOAD",
  "BattlePauseEvent.PAUSE",
  "CriticalBuffPauseExecutionEvent.APPLY_PLAN",
  "runCriticalBuffPauseExecution",
  "BattleAttackExecutionEvent.APPLY_PLAN",
  "runBattleAttackExecution",
  "BattleItemExecutionEvent.APPLY_PLAN",
  "runBattleItemExecution",
  "BattleChannelExecutionEvent.APPLY_PLAN",
  "runBattleChannelExecution",
  "executeActionResult",
  "actionEffectActed",
  'result?.kind === "failed"',
  "actionExecutorThrew",
  "isKnownActionResultKind",
  "executeItemCommandResult",
  "executeSkillCommandResult",
  "executeDefendCommandResult",
  "executeToggleSpiritResult",
  "executeSkillTargetResult",
  "executeFleeCommandResult",
  "executeAlertPauseResult",
  "executePauseResult",
  "executeCriticalPauseResult",
  "executeAttackPlanResult",
  "executeItemPlanResult",
  "executeChannelPlanResult",
]) {
  if (!executionText.includes(required)) violations.push(`${rel(execution)} must own ${required}`);
}

for (const required of [
  "BattleActionEffectEvidenceEvent.RECORD_APPLIED",
  "runBattleActionEffectEvidence",
  "actionEffectEvidenceWriteFailed",
  "effect-evidence-event",
  "recordActionEffectEvidenceFailure",
  "acted: Boolean(event?.acted)",
  "knownResultKind: event?.knownResultKind ?? false",
]) {
  if (!recordingText.includes(required)) {
    violations.push(`${rel(recording)} must own action effect recording ${required}`);
  }
}

const applyBody =
  ownerText.match(/function applyActionResult\(result, snap\) \{[\s\S]*?\n\}/)?.[0] || "";
const executeBody =
  executionText.match(/export function executeActionResult\(result, snap\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (/switch\s*\(\s*result\.kind\s*\)/.test(executeBody)) {
  violations.push(
    `${rel(execution)} must dispatch ActionResult kinds through ACTION_RESULT_EXECUTORS`
  );
}
for (const required of [
  "noop: executeNoopResult",
  '"item-command": executeItemCommandResult',
  '"skill-command": executeSkillCommandResult',
  '"defend-command": executeDefendCommandResult',
  '"toggle-spirit": executeToggleSpiritResult',
  '"click-skill-then-target": executeSkillTargetResult',
  '"flee-command": executeFleeCommandResult',
  '"alert-and-pause": executeAlertPauseResult',
  "pause: executePauseResult",
  '"critical-pause": executeCriticalPauseResult',
  '"attack-plan": executeAttackPlanResult',
  '"item-plan": executeItemPlanResult',
  '"channel-plan": executeChannelPlanResult',
]) {
  if (!executionText.includes(required)) {
    violations.push(`${rel(execution)} must lock ActionResult executor ${required}`);
  }
}
for (const forbidden of [
  "runBattleItemCommand",
  "runBattleSkillCommand",
  "runBattleDefendCommand",
  "runBattleSpiritToggleAutomation",
  "runBattleTargetCommand",
  "runBattleFleeCommand",
  "_alert",
  "runBattlePauseAutomation",
  'reason: "alertAndPause"',
  'reason: "autoPause"',
  "runCriticalBuffPauseExecution",
  "runBattleAttackExecution",
  "runBattleItemExecution",
  "runBattleChannelExecution",
]) {
  if (applyBody.includes(forbidden)) {
    violations.push(
      `${rel(owner)} applyActionResult must route by result kind, not inline ${forbidden}`
    );
  }
}

const entryBody =
  ownerText.match(/export function runBattleActionEffectDispatch\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_ACTION_RESULT\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table, not an event if-chain`);
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
} else {
  const ownerTestText = read(ownerTest);
  for (const required of [
    "retired halt kind",
    "rejects unknown events",
    "rejects null events with structured evidence instead of throwing",
    "unknownActionEffectDispatchEvent",
    "failureReason",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${rel(ownerTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, exceptionTest))) {
  violations.push(`${rel(exceptionTest)} must cover action effect executor exceptions`);
} else {
  const exceptionTestText = read(exceptionTest);
  for (const required of [
    "records executor exceptions as not acted action effect evidence",
    "actionExecutorThrew",
    "executionError",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!exceptionTestText.includes(required)) {
      violations.push(`${rel(exceptionTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, evidenceFailureTest))) {
  violations.push(
    `${rel(evidenceFailureTest)} must cover action effect evidence recording failures`
  );
} else {
  const evidenceFailureTestText = read(evidenceFailureTest);
  for (const required of [
    "keeps acted effects acted when effect evidence recording fails once",
    "keeps acted effects acted when effect evidence recording keeps failing",
    "expect(result).toBe(true)",
    "actionEffectEvidenceWriteFailed",
  ]) {
    if (!evidenceFailureTestText.includes(required)) {
      violations.push(`${rel(evidenceFailureTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, commandEvidenceTest))) {
  violations.push(`${rel(commandEvidenceTest)} must cover command failure evidence bridging`);
} else {
  const commandEvidenceTestText = read(commandEvidenceTest);
  for (const required of [
    "carries fresh command failure evidence into action effect evidence",
    "does not reuse stale command evidence for effects that write no command",
    "targetDead",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!commandEvidenceTestText.includes(required)) {
      violations.push(`${rel(commandEvidenceTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, commandEvidenceFailureTest))) {
  violations.push(`${rel(commandEvidenceFailureTest)} must cover command evidence read failures`);
} else {
  const commandEvidenceFailureTestText = read(commandEvidenceFailureTest);
  for (const required of [
    "keeps acted command effects acted when command evidence reads throw",
    "commandEvidenceReadError",
    "command evidence read failed",
    "acted: true",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!commandEvidenceFailureTestText.includes(required)) {
      violations.push(`${rel(commandEvidenceFailureTest)} must cover ${required}`);
    }
  }
}
for (const forbidden of [
  "halt: executeHaltResult",
  "function executeHaltResult",
  'runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE, reason: "autoPause" });\n  return true',
  "return !!runBattle",
]) {
  if (ownerText.includes(forbidden) || executionText.includes(forbidden)) {
    violations.push(`${rel(owner)} must keep retired halt/booleanized ActionResult paths out of dispatch`);
  }
}
if (
  !executionText.includes(
    'return runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE, reason: "autoPause" })'
  )
) {
  violations.push(`${rel(execution)} pause effects must return the pause entry result`);
}
if (
  !/function executeAlertPauseResult\(result\) \{[\s\S]*?return runBattlePauseAutomation\(\{[\s\S]*?reason: "alertAndPause"/.test(
    executionText
  )
) {
  violations.push(`${rel(execution)} alert-and-pause effects must return the pause entry result`);
}
if (!fs.existsSync(path.join(root, pauseResultTest))) {
  violations.push(`${rel(pauseResultTest)} must cover pause effect acted semantics`);
} else {
  const pauseResultTestText = read(pauseResultTest);
  for (const required of [
    "returns not acted when pause automation rejects a pause result",
    "returns not acted when pause automation returns a typed failure",
    "returns pause automation result for alert-and-pause effects",
    'kind: "failed"',
    "actionExecutorRejected",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!pauseResultTestText.includes(required)) {
      violations.push(`${rel(pauseResultTest)} must cover ${required}`);
    }
  }
}
const coreTypesText = read(path.normalize("src/core/types.js"));
if (/kind:\s*"halt"/.test(coreTypesText)) {
  violations.push("src/core/types.js must keep retired halt out of ActionResult");
}
for (const required of [
  "BattleActionEffectEvidenceEvent",
  "RECORD_APPLIED",
  "runBattleActionEffectEvidence",
  "ACTION_EFFECT_EVIDENCE_KEY",
  "DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT",
  "summarizeResult",
  "eventType: result.eventType",
  "originalResultKind: result.originalResultKind",
  "error: result.error",
  "result.plan?.type ?? result.plan?.kind",
  "acted: Boolean(event.acted)",
  "knownResultKind:",
  "classifyActionEffectFailure",
  "classifyPlanFailure",
  "KNOWN_PLAN_TYPES",
  "failureReason: classifyActionEffectFailure(event)",
  "executionError: event.executionError",
  "commandEvidenceReadError: event.commandEvidenceReadError",
  "command: summarizeCommandEvidence(event.commandEvidence)",
  "event.commandEvidence?.failureReason",
  "missingActionResult",
  "unknownActionResultKind",
  "noActionCandidate",
  "unknownAttackPlanType",
  "unknownItemPlanType",
  "unknownChannelPlanType",
  "actionExecutorRejected",
]) {
  if (!evidenceText.includes(required)) violations.push(`${rel(evidence)} must own ${required}`);
}
if (!fs.existsSync(path.join(root, evidenceTest))) {
  violations.push(`${rel(evidenceTest)} must cover action effect evidence contract`);
} else {
  const evidenceTestText = read(evidenceTest);
  for (const required of [
    "records acted action effect evidence for diagnostics",
    "records not-acted effect evidence so empty turns are diagnosable",
    "records event type for rejected dispatch events",
    "recognized result-kind state",
    "failureReason",
    "records real plan type for plan action results",
    "classifies noop and unknown plan failures for diagnostics",
    "unknownChannelPlanType",
    "keeps legacy plan kind fallback for older evidence producers",
    "rejects unknown evidence events",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!evidenceTestText.includes(required)) {
      violations.push(`${rel(evidenceTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, recordingFallbackTest))) {
  violations.push(`${rel(recordingFallbackTest)} must cover acted recording fallback evidence`);
} else {
  const recordingFallbackTestText = read(recordingFallbackTest);
  for (const required of [
    "preserves recording failure reason for acted fallback evidence",
    "actionEffectEvidenceWriteFailed",
    "originalResultKind",
    "acted: true",
    "knownResultKind: true",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!recordingFallbackTestText.includes(required)) {
      violations.push(`${rel(recordingFallbackTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, evidenceExceptionTest))) {
  violations.push(`${rel(evidenceExceptionTest)} must cover action effect exception evidence`);
} else {
  const evidenceExceptionText = read(evidenceExceptionTest);
  for (const required of [
    "records executor exceptions as structured failure detail",
    "actionExecutorThrew",
    "executionError",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!evidenceExceptionText.includes(required)) {
      violations.push(`${rel(evidenceExceptionTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, planFailureTest))) {
  violations.push(`${rel(planFailureTest)} must cover action effect plan failure evidence`);
} else {
  const planFailureTestText = read(planFailureTest);
  for (const required of [
    "classifies unknown attack, item, and channel plan types",
    "unknownAttackPlanType",
    "unknownItemPlanType",
    "unknownChannelPlanType",
    "HVAA:lastBattleActionEffect",
  ]) {
    if (!planFailureTestText.includes(required)) {
      violations.push(`${rel(planFailureTest)} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, executionRecordingFailureTest))) {
  violations.push(
    `${rel(executionRecordingFailureTest)} must cover execution evidence recording failures`
  );
} else {
  const executionRecordingFailureTestText = read(executionRecordingFailureTest);
  for (const required of [
    "does not throw from unknown attack execution events when recording fails",
    "does not throw from unknown item execution events when recording fails",
    "does not throw from unknown channel execution events when recording fails",
    "does not throw when a sub-command throws and failure recording also fails",
    "effect recording failed",
  ]) {
    if (!executionRecordingFailureTestText.includes(required)) {
      violations.push(`${rel(executionRecordingFailureTest)} must cover ${required}`);
    }
  }
}

if (
  !actionDecisionText.includes("applyActionResultStep") ||
  !actionDecisionDispatchText.includes("BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT") ||
  !actionDecisionDispatchText.includes("runBattleActionEffectDispatch")
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
    if (
      normalized === owner ||
      normalized === actionDecision ||
      normalized === actionDecisionDispatch
    )
      continue;
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*battle-action-effect-dispatch\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (
      normalized !== owner &&
      /from\s+["'][^"']*battle-action-effect-execution\.js["']/.test(text)
    ) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionEffectDispatch`);
    }
    if (/from\s+["'][^"']*(?:^|\/)dispatch\.js["']/.test(text)) {
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
