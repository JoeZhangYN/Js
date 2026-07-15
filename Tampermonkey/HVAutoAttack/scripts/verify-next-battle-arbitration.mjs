import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const arbitrationFile = "src/pages/next-battle-arbitration.js";
const arbitrationTests = [
  "src/pages/next-battle-arbitration.test.js",
  "src/pages/next-battle-arbitration-recovery.test.js",
  "src/pages/next-battle-arbitration-guard.test.js",
];
const policyFile = "src/pages/next-battle-policy.js";
const wakeScheduleFile = "src/pages/next-battle-wake-schedule.js";
const optionFile = "src/pages/next-battle-option.js";
const wakeScheduleTestFile = "src/pages/next-battle-wake-schedule.test.js";
const lobbyFile = "src/pages/lobby-automation.js";
const encounterLobbyFile = "src/pages/encounter-lobby-flow.js";
const encounterOutcomeFile = "src/pages/encounter-lobby-outcome.js";
const idleArenaFile = "src/arena/idle-arena.js";
const idleArenaTestFile = "src/arena/idle-arena.test.js";
const idleArenaSettingsFile = "src/settings/render.js";
const idleArenaPlanFile = "src/arena/idle-arena-plan.js";
const repairFile = "src/repair/repair-orchestrator.js";
const dayRecordFile = "src/state/day-record.js";
const incidentTestFile = "src/pages/encounter-generation-block.test.js";
const encounterCheckFile = "src/pages/next-battle-encounter-check.js";
const arbitrationText = read(arbitrationFile);
const testText = arbitrationTests.map(read).join("\n");
const policyText = read(policyFile);
const wakeScheduleText = read(wakeScheduleFile);
const optionText = read(optionFile);
const wakeScheduleTestText = read(wakeScheduleTestFile);
const lobbyText = read(lobbyFile);
const encounterLobbyText = read(encounterLobbyFile);
const encounterOutcomeText = read(encounterOutcomeFile);
const idleArenaText = read(idleArenaFile);
const idleArenaTestText = read(idleArenaTestFile);
const idleArenaPlanText = read(idleArenaPlanFile);
const repairText = read(repairFile);
const dayRecordText = read(dayRecordFile);
const incidentTestText = read(incidentTestFile);
const encounterCheckText = read(encounterCheckFile);
const violations = [];

function requireText(text, needle, message) {
  if (!text.includes(needle)) violations.push(message);
}

for (const required of [
  "createNextBattleArbitrationCapability",
  "NextBattleArbitrationEvent",
  "NextBattleArbitrationStatus",
  "idlePlan",
  "pendingPlan",
  "chooseNextBattleCandidate",
  "readEncounterBattleCandidate",
  "createNextBattleWakeSchedule",
  "RepairStatus.READY",
  "EncounterLobbyStatus.CLAIMED",
  "IdleArenaEvent.PLAN_NEXT_BATTLE",
  "IdleArenaEvent.START_NEXT_BATTLE",
  "StaminaEvent.SHOULD_STOP_AUTOMATIC_BATTLE",
  "createNextBattleEncounterCheck",
  "Date.now()",
]) {
  requireText(arbitrationText, required, `${arbitrationFile} must own ${required}`);
}
for (const required of [
  "isAutomaticEncounterEnabled",
  "EncounterEvent.LOBBY_TICK",
  "createEncounterDegradedOutcome",
  "encounterRejected",
]) {
  requireText(encounterCheckText, required, `${encounterCheckFile} must own ${required}`);
}
for (const required of [
  "keeps one exact timer for the same owner and deadline",
  "fails closed when a pending wake cannot be cancelled",
  "reports timer creation failure without claiming a scheduled wake",
]) {
  requireText(wakeScheduleTestText, required, `${wakeScheduleTestFile} must cover: ${required}`);
}

const wakeTimers = wakeScheduleText.match(/\bsetTimeout\s*\(/g) || [];
if (wakeTimers.length !== 1) {
  violations.push(`${wakeScheduleFile} must own exactly one next-battle timer site`);
}
if (/\b(?:setTimeout|setInterval)\s*\(/.test(arbitrationText)) {
  violations.push(`${arbitrationFile} must delegate its timer authority to ${wakeScheduleFile}`);
}
if (/\bsetInterval\s*\(/.test(wakeScheduleText)) {
  violations.push(`${wakeScheduleFile} must not reintroduce a heartbeat interval`);
}
for (const required of [
  "scheduledWake",
  "clearTimeout",
  "cancelWake",
  "scheduleWake",
  "timerWake",
]) {
  requireText(wakeScheduleText, required, `${wakeScheduleFile} must own ${required}`);
}
for (const required of [
  "readEncounterBattleCandidate",
  "chooseNextBattleCandidate",
  "encounter.deadlineMs <= idle.deadlineMs",
  "readIdleArenaClaim",
  "IdleArenaClaimKind",
]) {
  requireText(policyText, required, `${policyFile} must own ${required}`);
}

function walkProductionJs(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkProductionJs(full));
    else if (
      entry.isFile() &&
      entry.name.endsWith(".js") &&
      !entry.name.endsWith(".test.js") &&
      !entry.name.endsWith("-test-fixture.js")
    ) {
      files.push(full);
    }
  }
  return files;
}

for (const file of walkProductionJs(path.join(root, "src"))) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  if (
    /\b(?:SCHEDULE_NEXT_BATTLE|scheduleNextBattle|PLAN_NEXT_CHECK|planNextEncounterCheck)\b/.test(
      text
    )
  ) {
    violations.push(`${relative} must not reintroduce a retired next-battle entry`);
  }
  const idleArenaEntryMentioned = /\brunIdleArenaAutomation\b/.test(text);
  if (
    idleArenaEntryMentioned &&
    ![arbitrationFile, idleArenaFile, idleArenaSettingsFile].includes(relative)
  ) {
    violations.push(`${relative} must not import, alias, or call the idle-arena entry`);
  }
  for (const eventName of ["PLAN_NEXT_BATTLE", "START_NEXT_BATTLE"]) {
    const directCall = new RegExp(
      `runIdleArenaAutomation\\s*\\(\\s*\\{\\s*type:\\s*IdleArenaEvent\\.${eventName}`
    );
    if (relative !== arbitrationFile && directCall.test(text)) {
      violations.push(`${relative} must not bypass arbitration through ${eventName}`);
    }
  }
  if (relative === idleArenaSettingsFile) {
    const entryReferences = text.match(/\brunIdleArenaAutomation\b/g) || [];
    const resetCalls =
      text.match(
        /runIdleArenaAutomation\s*\(\s*\{\s*type:\s*IdleArenaEvent\.RESET_PROGRESS\s*}\s*\)/g
      ) || [];
    const allCalls = text.match(/\brunIdleArenaAutomation\s*\(/g) || [];
    if (allCalls.length !== 1 || resetCalls.length !== 1) {
      violations.push(`${relative} may call the idle-arena entry only for RESET_PROGRESS`);
    }
    if (entryReferences.length !== 2 || /runIdleArenaAutomation\s+as\s+/.test(text)) {
      violations.push(`${relative} must not alias or forward the idle-arena entry`);
    }
  }
}
if (/runIdleArenaAutomation\s*\(\s*event\s*=/.test(idleArenaText)) {
  violations.push(`${idleArenaFile} must not default an omitted event to battle start`);
}
for (const required of ["isNextBattleOptionEnabled", "OptionEvent.READ_FIELD"]) {
  requireText(optionText, required, `${optionFile} must own ${required}`);
}

for (const [file, text] of [
  [encounterLobbyFile, encounterLobbyText],
  [idleArenaFile, idleArenaText],
  [repairFile, repairText],
]) {
  if (/\bsetTimeout\s*\(/.test(text)) {
    violations.push(`${file} must not own a next-battle timer`);
  }
}

for (const retired of [
  "src/pages/encounter-lobby-schedule.js",
  "src/pages/encounter-lobby-schedule.test.js",
]) {
  if (fs.existsSync(path.join(root, retired))) {
    violations.push(`${retired} must stay retired`);
  }
}

for (const required of ["CLAIMED", "WAITING", "DEGRADED", "STOPPED_FOR_DAY"]) {
  requireText(
    encounterOutcomeText,
    required,
    `${encounterOutcomeFile} must expose typed lobby outcome ${required}`
  );
}
for (const forbidden of ["rerun", "encounter-lobby-schedule", "showEncounterGenerationBlock"]) {
  if (encounterLobbyText.includes(forbidden)) {
    violations.push(`${encounterLobbyFile} must not retain timer/popup path ${forbidden}`);
  }
}

for (const forbidden of ["StaminaEvent", "runStaminaAutomation", "rerun"]) {
  if (lobbyText.includes(forbidden)) {
    violations.push(
      `${lobbyFile} must leave next-battle eligibility inside arbitration: ${forbidden}`
    );
  }
}
if (/\b(?:setTimeout|setInterval)\s*\(/.test(dayRecordText)) {
  violations.push(`${dayRecordFile} must not own a duplicate UTC next-battle wake`);
}
if (dayRecordText.includes("REFRESH_AND_SCHEDULE_NEXT_UTC_DAY")) {
  violations.push(`${dayRecordFile} retired UTC rerun entry must stay removed`);
}

for (const required of ["PLAN_NEXT_BATTLE", "deadlineMs", 'status: "planned"']) {
  requireText(
    idleArenaText + idleArenaPlanText,
    required,
    `${idleArenaFile} must return ${required}`
  );
}
for (const forbidden of ["SCHEDULE_NEXT_BATTLE", "scheduleNextBattle"]) {
  if (idleArenaText.includes(forbidden)) {
    violations.push(`${idleArenaFile} old timer entry must stay retired: ${forbidden}`);
  }
}

for (const required of ["RepairStatus", "READY", "BLOCKED", "return new Promise("]) {
  requireText(repairText, required, `${repairFile} must return typed async ${required}`);
}
for (const forbidden of ["idle-arena.js", "IdleArenaEvent", "scheduleIdleArena", '"idleArena"']) {
  if (repairText.includes(forbidden)) {
    violations.push(`${repairFile} must not schedule idle arena: ${forbidden}`);
  }
}

requireText(
  lobbyText,
  "createNextBattleArbitrationCapability",
  `${lobbyFile} must delegate next-battle policy`
);
for (const forbidden of [
  "runEncounterAutomation",
  "runRepairAutomation",
  "runIdleArenaAutomation",
]) {
  if (lobbyText.includes(forbidden)) {
    violations.push(`${lobbyFile} must not bypass arbitration through ${forbidden}`);
  }
}

for (const required of [
  "checks repair before encounter and only then starts the idle countdown",
  "uses one exact timer and rechecks encounter before an earlier idle deadline",
  "gives encounter priority when both deadlines are equal",
  "allows an already-due idle battle while encounter recovery is degraded",
  "keeps idle arena available after encounters stop for the day",
  "does not report idle success when no idle candidate can start",
  "blocks both battle paths when repair does not become ready",
  "binds Isekai without a reachable encounter branch",
  "singleflights concurrent planning through the complete repair decision",
  "starts idle countdown after encounter IO and arms only the remaining exact delay",
  "rechecks repair and encounter after idle token preparation before starting battle",
  "cancels an armed wake when stamina stops automatic battles",
  "schedules the encounter retry before a later idle deadline after encounter rejection",
  "keeps an encounter retry wake when idle arena is disabled",
  "reports stamina recovery request separately from an idle battle request",
]) {
  requireText(testText, required, `arbitration tests must cover: ${required}`);
}

requireText(
  idleArenaTestText,
  "runIdleArenaAutomation()).toBe(false)",
  `${idleArenaTestFile} must prove omitted events cannot start a battle`
);

requireText(
  incidentTestText,
  "keeps repeated lobby diagnostics at zero writes without suppressing widget feedback",
  `${incidentTestFile} must lock zero-write diagnostics without hiding widget feedback`
);

if (violations.length) {
  console.error("[verify-next-battle-arbitration] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-next-battle-arbitration] OK — one exact timer arbitrates repair, encounter, and idle arena"
);
