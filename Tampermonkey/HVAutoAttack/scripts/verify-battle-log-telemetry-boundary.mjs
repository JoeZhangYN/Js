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
  "battleLogTelemetryEventHandlers",
  "runBattleLogTelemetry",
  "READ_CURRENT",
  "BattleLogParserEvent.PARSE_CURRENT_LOG",
  "BattleLogParserEvent.ESTIMATE_PLAYER_INCOMING_DPS",
  "BattleLogParserEvent.ESTIMATE_PER_MONSTER_DPS",
  "runBattleLogParser",
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
const entryBody =
  ownerText.match(/export function runBattleLogTelemetry\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_CURRENT\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover battle log telemetry entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown events without parsing or estimating telemetry")) {
    violations.push(`${rel(ownerTest)} must cover unknown battle log telemetry events`);
  }
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
