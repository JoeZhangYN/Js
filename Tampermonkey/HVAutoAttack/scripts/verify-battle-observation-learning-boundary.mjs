import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-observation-learning.js");
const ownerTest = path.normalize("src/battle/battle-observation-learning.test.js");
const snapshot = path.normalize("src/battle/snapshot.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const snapshotText = read(snapshot);

for (const required of [
  "BattleObservationLearningEvent",
  "runBattleObservationLearning",
  "FINALIZE_TURN_OBSERVATIONS",
  "RecoveryLearningEvent.FINALIZE_PENDING",
  "CdLearningEvent.FINALIZE_PENDING",
  "BigSkillKillLearningEvent.FINALIZE_PENDING",
  "IncomingBurstLearningEvent.RECORD_EVENTS",
  "IncomingBurstLearningEvent.READ_MAP",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleObservationLearningEvent\b|runBattleObservationLearning\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover observation learning entry contract`);
}
if (!snapshotText.includes("runBattleObservationLearning")) {
  violations.push(`${rel(snapshot)} must finalize observation learning through one entry`);
}
for (const forbidden of [
  "runRecoveryLearningAutomation",
  "runCdLearningAutomation",
  "runBigSkillKillLearningAutomation",
  "runIncomingBurstLearningAutomation",
  "RecoveryLearningEvent",
  "CdLearningEvent",
  "BigSkillKillLearningEvent",
  "IncomingBurstLearningEvent",
]) {
  if (snapshotText.includes(forbidden)) {
    violations.push(
      `${rel(snapshot)} must not bypass battle observation learning via ${forbidden}`
    );
  }
}

if (violations.length) {
  console.error("[verify-battle-observation-learning-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-observation-learning-boundary] OK - turn observation learning is behind one entry"
);
