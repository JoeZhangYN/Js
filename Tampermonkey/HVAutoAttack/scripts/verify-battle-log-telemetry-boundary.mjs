import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-log-telemetry.js");
const ownerTest = path.normalize("src/battle/battle-log-telemetry.test.js");
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
  "BattleLogTelemetryEvent",
  "runBattleLogTelemetry",
  "READ_CURRENT",
  "parseBattleLog",
  "estimatePlayerIncomingDps",
  "estimatePerMonsterDps",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleLogTelemetryEvent\b|runBattleLogTelemetry\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover battle log telemetry entry contract`);
}
if (
  !snapshotText.includes("BattleLogTelemetryEvent.READ_CURRENT") ||
  !snapshotText.includes("runBattleLogTelemetry")
) {
  violations.push(`${rel(snapshot)} must read battle log telemetry through one entry`);
}
if (/parseBattleLog|estimatePlayerIncomingDps|estimatePerMonsterDps/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not assemble battle log telemetry directly`);
}

if (violations.length) {
  console.error("[verify-battle-log-telemetry-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-log-telemetry-boundary] OK - battle log telemetry is behind one entry");
