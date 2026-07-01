import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const specs = [
  {
    owner: "src/battle/battle-automation-evidence.js",
    test: "src/battle/battle-automation-evidence.test.js",
    handler: "battleAutomationEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null automation evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleAutomation",
  },
  {
    owner: "src/battle/battle-action-decision-evidence.js",
    test: "src/battle/battle-action-decision-evidence.test.js",
    handler: "battleActionDecisionEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null decision evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleActionDecision",
  },
  {
    owner: "src/battle/battle-action-effect-evidence.js",
    test: "src/battle/battle-action-effect-evidence.test.js",
    handler: "battleActionEffectEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null effect evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleActionEffect",
  },
  {
    owner: "src/battle/battle-action-lifecycle-evidence.js",
    test: "src/battle/battle-action-lifecycle-evidence.test.js",
    handler: "battleActionLifecycleEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null lifecycle evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleActionLifecycle",
  },
  {
    owner: "src/battle/battle-command-evidence.js",
    test: "src/battle/battle-command-evidence.test.js",
    handler: "battleCommandEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null command evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleCommand",
  },
];

const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function collectJs(dir, base = "") {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(abs).isDirectory()) out.push(...collectJs(abs, rel));
    else if (name.endsWith(".js")) out.push(rel.replaceAll("\\", "/"));
  }
  return out;
}

for (const spec of specs) {
  const ownerText = read(spec.owner);
  const testText = read(spec.test);
  if (!ownerText.includes(spec.handler)) {
    violations.push(`${spec.owner} must reject null events through its evidence entry`);
  }
  if (/EventHandlers\[event\.type\]/.test(ownerText)) {
    violations.push(`${spec.owner} must not read event.type directly in evidence dispatch`);
  }
  for (const required of [spec.nullTest, spec.evidenceKey, "not.toHaveBeenCalled()"]) {
    if (!testText.includes(required)) {
      violations.push(`${spec.test} must cover ${required}`);
    }
  }
}

const commandEvidenceText = read("src/battle/battle-command-evidence.js");
const commandEvidenceTestText = read("src/battle/battle-command-evidence.test.js");
const commandRecordingText = read("src/battle/battle-command-recording.js");
const commandRecordingFailureTestText = read("src/battle/battle-command-recording-failure.test.js");
const commandRecordingFailureExtendedTestText = read(
  "src/battle/battle-command-recording-failure-extended.test.js"
);
const decisionEvidenceText = read("src/battle/battle-action-decision-evidence.js");
const effectEvidenceText = read("src/battle/battle-action-effect-evidence.js");
const lifecycleEvidenceText = read("src/battle/battle-action-lifecycle-evidence.js");
const automationEvidenceText = read("src/battle/battle-automation-evidence.js");
const actionEvidencePersistenceTestText = read(
  "src/battle/battle-action-evidence-persistence.test.js"
);
const evidenceDebugText = read("src/battle/battle-evidence-debug.js");
if (
  !evidenceDebugText.includes("export function safeDebug") ||
  !evidenceDebugText.includes("deps.debug?.(label, evidence)")
) {
  violations.push("src/battle/battle-evidence-debug.js must own safe evidence debug output");
}
for (const required of [
  "acted: commandActed(event.result)",
  "failureReason: commandFailureReason(event)",
  "RESULT_ACCEPTED",
  "export function readBattleCommandEvidence",
  "JSON.parse(storage.getItem(BATTLE_COMMAND_EVIDENCE_KEY)",
  "storageWriteOk",
  "storageWriteError",
]) {
  if (!commandEvidenceText.includes(required)) {
    violations.push(
      `src/battle/battle-command-evidence.js must normalize command evidence ${required}`
    );
  }
}
for (const required of [
  "records accepted commands as acted without a failure reason",
  "acted: false",
  'failureReason: "skillNotReady"',
  "acted: true",
  "failureReason: null",
]) {
  if (!commandEvidenceTestText.includes(required)) {
    violations.push(`src/battle/battle-command-evidence.test.js must cover ${required}`);
  }
}
for (const required of [
  "export function recordBattleCommandResult",
  "BattleCommandEvidenceEvent.RECORD_RESULT",
  "runBattleCommandEvidence",
  "catch (error)",
  "[HVAA] battle command evidence failed",
  "recordingError",
  "return false",
]) {
  if (!commandRecordingText.includes(required)) {
    violations.push(`src/battle/battle-command-recording.js must own ${required}`);
  }
}
for (const required of [
  "keeps clicked skills acted when command evidence recording throws",
  "keeps clicked skills acted when command evidence recording and warning both throw",
  "keeps clicked items acted when command evidence recording throws",
  "command evidence failed",
  "console failed",
  "recordingError",
]) {
  if (!commandRecordingFailureTestText.includes(required)) {
    violations.push(`src/battle/battle-command-recording-failure.test.js must cover ${required}`);
  }
}
for (const required of [
  "keeps clicked focus acted when command evidence recording throws",
  "keeps clicked defend acted when command evidence recording throws",
  "keeps clicked target acted when command evidence recording throws",
  "keeps clicked flee acted when command evidence recording throws",
  "keeps clicked spirit acted when command evidence recording throws",
  "command evidence failed",
  "recordingError",
]) {
  if (!commandRecordingFailureExtendedTestText.includes(required)) {
    violations.push(
      `src/battle/battle-command-recording-failure-extended.test.js must cover ${required}`
    );
  }
}
for (const required of [
  "export function readBattleActionEffectEvidence",
  "JSON.parse(storage.getItem(ACTION_EFFECT_EVIDENCE_KEY)",
  "knownResultKind:",
  "storageWriteOk",
  "storageWriteError",
]) {
  if (!effectEvidenceText.includes(required)) {
    violations.push(
      `src/battle/battle-action-effect-evidence.js must expose effect evidence reader ${required}`
    );
  }
}
for (const required of ["storageWriteOk", "storageWriteError"]) {
  if (!automationEvidenceText.includes(required)) {
    violations.push(
      `src/battle/battle-automation-evidence.js must expose automation persistence evidence ${required}`
    );
  }
  if (!decisionEvidenceText.includes(required)) {
    violations.push(
      `src/battle/battle-action-decision-evidence.js must expose decision persistence evidence ${required}`
    );
  }
  if (!lifecycleEvidenceText.includes(required)) {
    violations.push(
      `src/battle/battle-action-lifecycle-evidence.js must expose lifecycle persistence evidence ${required}`
    );
  }
}
for (const required of [
  "keeps decision evidence visible when storage is unavailable",
  "keeps effect evidence visible when storage is unavailable",
  "keeps command evidence visible when storage is unavailable",
  "keeps lifecycle evidence visible when storage is unavailable",
  "does not throw when evidence debug output fails",
  "storageWriteOk: false",
  'storageWriteError: "quota"',
  'throw new Error("console blocked")',
]) {
  if (!actionEvidencePersistenceTestText.includes(required)) {
    violations.push(`src/battle/battle-action-evidence-persistence.test.js must cover ${required}`);
  }
}
for (const spec of specs) {
  const ownerText = read(spec.owner);
  if (!ownerText.includes("safeDebug(deps,")) {
    violations.push(`${spec.owner} must route debug output through safeDebug`);
  }
  if (ownerText.includes("deps.debug(")) {
    violations.push(`${spec.owner} must not let debug output throw through evidence entry`);
  }
}

for (const relative of collectJs(path.join(root, "src", "battle"), "src/battle")) {
  if (
    relative.endsWith(".test.js") ||
    relative === "src/battle/battle-command-evidence.js" ||
    relative === "src/battle/battle-command-recording.js"
  ) {
    continue;
  }
  const text = read(relative);
  if (
    /import\s*\{[^}]*\b(?:BattleCommandEvidenceEvent|runBattleCommandEvidence)\b[^}]*\}\s*from\s+["'][^"']*battle-command-evidence\.js["']/.test(
      text
    )
  ) {
    violations.push(`${relative} must record commands through battle-command-recording.js`);
  }
}

if (violations.length) {
  console.error("[verify-battle-action-evidence-contract] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-battle-action-evidence-contract] OK - action evidence entries reject null events"
);
