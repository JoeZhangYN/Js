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
const decisionEvidenceText = read("src/battle/battle-action-decision-evidence.js");
const effectEvidenceText = read("src/battle/battle-action-effect-evidence.js");
const lifecycleEvidenceText = read("src/battle/battle-action-lifecycle-evidence.js");
const automationEvidenceText = read("src/battle/battle-automation-evidence.js");
const actionEvidencePersistenceTestText = read(
  "src/battle/battle-action-evidence-persistence.test.js"
);
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
    violations.push(`src/battle/battle-command-evidence.js must normalize command evidence ${required}`);
  }
}
for (const required of [
  "records accepted commands as acted without a failure reason",
  "acted: false",
  "failureReason: \"skillNotReady\"",
  "acted: true",
  "failureReason: null",
]) {
  if (!commandEvidenceTestText.includes(required)) {
    violations.push(`src/battle/battle-command-evidence.test.js must cover ${required}`);
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
    violations.push(`src/battle/battle-action-effect-evidence.js must expose effect evidence reader ${required}`);
  }
}
for (const required of ["storageWriteOk", "storageWriteError"]) {
  if (!automationEvidenceText.includes(required)) {
    violations.push(`src/battle/battle-automation-evidence.js must expose automation persistence evidence ${required}`);
  }
  if (!decisionEvidenceText.includes(required)) {
    violations.push(`src/battle/battle-action-decision-evidence.js must expose decision persistence evidence ${required}`);
  }
  if (!lifecycleEvidenceText.includes(required)) {
    violations.push(`src/battle/battle-action-lifecycle-evidence.js must expose lifecycle persistence evidence ${required}`);
  }
}
for (const required of [
  "keeps decision evidence visible when storage is unavailable",
  "keeps effect evidence visible when storage is unavailable",
  "keeps command evidence visible when storage is unavailable",
  "keeps lifecycle evidence visible when storage is unavailable",
  "storageWriteOk: false",
  'storageWriteError: "quota"',
]) {
  if (!actionEvidencePersistenceTestText.includes(required)) {
    violations.push(`src/battle/battle-action-evidence-persistence.test.js must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-battle-action-evidence-contract] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-battle-action-evidence-contract] OK - action evidence entries reject null events");
