import fs from "node:fs";

const ownerFile = "src/battle/battle-round-start.js";
const owner = fs.readFileSync(ownerFile, "utf8");
const tests = [
  fs.readFileSync("src/battle/battle-round-start.test.js", "utf8"),
  fs.readFileSync("src/battle/battle-round-start-rejection.test.js", "utf8"),
].join("\n");
const violations = [];

for (const required of [
  "runBattleRoundStartAutomation",
  "BattleSessionEvent.START_OR_RESUME",
  "BattleSessionEvent.RECORD_START_PROGRESS",
  "BattleSessionEvent.SYNC_RUNTIME",
  "EncounterEvent.BATTLE_SESSION_STARTED",
  "session: result.snapshot",
  "BattleStaminaEvent.ROUND_LOG_READY",
  "MonsterStatusEvent.PREPARE_ROUND_START",
  "BattleRoundLifecycleEvent.ROUND_READY",
]) {
  if (!owner.includes(required)) violations.push(`${ownerFile} must use ${required}`);
}

for (const retired of [
  "BattleRoundEvent",
  "runBattleRoundAutomation",
  "RANDOM_ENCOUNTER_STARTED",
]) {
  if (owner.includes(retired)) violations.push(`${ownerFile} must retire ${retired}`);
}

const startIndex = owner.indexOf("BattleSessionEvent.START_OR_RESUME");
const encounterIndex = owner.indexOf("EncounterEvent.BATTLE_SESSION_STARTED");
const progressIndex = owner.indexOf("BattleSessionEvent.RECORD_START_PROGRESS");
const syncIndex = owner.indexOf("BattleSessionEvent.SYNC_RUNTIME");
if (
  [startIndex, encounterIndex, progressIndex, syncIndex].some((index) => index < 0) ||
  !(startIndex < encounterIndex && encounterIndex < progressIndex && progressIndex < syncIndex)
) {
  violations.push(
    `${ownerFile} must identify session, report encounter, record progress, then sync`
  );
}

for (const required of [
  "routes round-start bookkeeping through the lifecycle entry",
  "stops round preparation when stamina gate pauses the round",
  "returns false when round start context records persistence failure",
  'type: "startOrResume"',
  'type: "recordStartProgress"',
]) {
  if (!tests.includes(required)) violations.push(`battle round start tests must cover ${required}`);
}

if (violations.length) {
  console.error("[verify-battle-round-start-contract] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log(
  "[verify-battle-round-start-contract] OK — round start binds one battle session identity"
);
