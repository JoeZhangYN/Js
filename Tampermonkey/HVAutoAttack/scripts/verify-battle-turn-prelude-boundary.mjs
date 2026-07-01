import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-turn-prelude.js");
const ownerTest = path.normalize("src/battle/battle-turn-prelude.test.js");
const killBug = path.normalize("src/battle/kill-bug.js");
const mainLoop = path.normalize("src/battle/main-loop.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

function requireText(relative, required) {
  const text = read(relative);
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${rel(relative)} must own ${token}`);
    }
  }
  return text;
}

const ownerText = read(owner);
const killBugText = read(killBug);
const mainLoopText = read(mainLoop);

for (const required of [
  "BattleTurnPreludeEvent",
  "battleTurnPreludeEventHandlers",
  "runBattleTurnPrelude",
  "PREPARE_CURRENT_TURN",
  "TURN_PRELUDE_STEPS",
  'capability: "monsterStatusReady"',
  'capability: "turnStarted"',
  'capability: "monitorHudRefresh"',
  'capability: "killBugRecovery"',
  'capability: "monsterHpUpdate"',
  "MonsterStatusEvent.ENSURE_READY",
  "BattleTurnEvent.TURN_STARTED",
  "BattleMonitorEvent.HUD_REFRESH",
  "BattleKillBugRecoveryEvent.RECOVER",
  "runBattleKillBugRecovery",
  "MonsterStatusEvent.UPDATE_HP",
  "battleLogTelemetry",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleTurnPreludeEvent\b|runBattleTurnPrelude\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleTurnPrelude\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_PREPARE_CURRENT_TURN\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleTurnPreludeEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null turn prelude events without effects`);
}
if (
  !/const TURN_PRELUDE_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "monsterStatusReady"[\s\S]*capability: "turnStarted"[\s\S]*capability: "monitorHudRefresh"[\s\S]*capability: "killBugRecovery"[\s\S]*capability: "monsterHpUpdate"[\s\S]*\]\)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} must own frozen explicit turn prelude order`);
}
const prepareBody = ownerText.match(/function prepareCurrentTurn\(\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/for\s*\(\s*const\s+step\s+of\s+TURN_PRELUDE_STEPS\s*\)/.test(prepareBody)) {
  violations.push(`${rel(owner)} must run current-turn prelude through TURN_PRELUDE_STEPS`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover turn prelude entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown prelude events without running prelude effects")) {
    violations.push(`${rel(ownerTest)} must cover unknown turn prelude events`);
  }
  if (!ownerTestText.includes("runBattleTurnPrelude(null)")) {
    violations.push(`${rel(ownerTest)} must cover null turn prelude events`);
  }
}
if (
  !mainLoopText.includes("BattleTurnPreludeEvent.PREPARE_CURRENT_TURN") ||
  !mainLoopText.includes("runBattleTurnPrelude") ||
  !mainLoopText.includes("prelude?.battleLogTelemetry")
) {
  violations.push(`${rel(mainLoop)} must run turn prelude through one entry`);
}
if (
  /MonsterStatusEvent\.(?:ENSURE_READY|UPDATE_HP)|BattleTurnEvent\.TURN_STARTED|BattleMonitorEvent\.HUD_REFRESH|killBug|runMonsterStatusAutomation|runBattleTurnRuntime|runBattleMonitorAutomation/.test(
    mainLoopText
  )
) {
  violations.push(`${rel(mainLoop)} must not assemble turn prelude effects directly`);
}
for (const required of [
  "BattleKillBugRecoveryEvent",
  "battleKillBugRecoveryEventHandlers",
  "runBattleKillBugRecovery",
  "RECOVER",
  "BattleKillBugEvidenceEvent.RECORD_RECOVERY",
  "runBattleKillBugEvidence",
  "unknownKillBugRecoveryEvent",
  "battleKillBugRecoveryEventHandlers[event?.type]",
  "NavigationEvent.RELOAD_NOW",
  "KILL_BUG_PATTERN",
  'source: "battleKillBugRecovery"',
  "matchedText",
  "scheduledReload",
  "scannedRows",
]) {
  if (!killBugText.includes(required)) {
    violations.push(`${rel(killBug)} must own ${required}`);
  }
}
if (/export function killBug\(/.test(killBugText)) {
  violations.push(`${rel(killBug)} legacy killBug() export must stay retired`);
}
const killBugTest = path.normalize("src/battle/kill-bug.test.js");
const killBugTestText = read(killBugTest);
for (const required of [
  "HVAA:lastBattleKillBugRecovery",
  "rejects null bug recovery events with evidence instead of throwing",
  "unknownKillBugRecoveryEvent",
  "scheduledReload",
  "notMatched",
]) {
  if (!killBugTestText.includes(required)) {
    violations.push(`${rel(killBugTest)} must cover ${required}`);
  }
}
requireText(path.normalize("src/battle/kill-bug-evidence.js"), [
  "BattleKillBugEvidenceEvent",
  "runBattleKillBugEvidence",
  "DiagnosticEvidenceKey.BATTLE_KILL_BUG_RECOVERY",
  "battleKillBugEvidenceEventHandlers[event?.type]",
  "[HVAA] battle kill bug recovery",
  "storageWriteOk",
  "storageWriteError",
]);
requireText(path.normalize("src/battle/kill-bug-evidence.test.js"), [
  "records battle kill-bug recovery evidence",
  "rejects null kill-bug evidence events without writing diagnostics",
  "HVAA:lastBattleKillBugRecovery",
]);
const diagnosticKeysText = read(path.normalize("src/core/diagnostic-evidence-keys.js"));
for (const required of [
  'BATTLE_KILL_BUG_RECOVERY: "HVAA:lastBattleKillBugRecovery"',
  'source("battleKillBugRecovery", DiagnosticEvidenceKey.BATTLE_KILL_BUG_RECOVERY)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`src/core/diagnostic-evidence-keys.js must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-battle-turn-prelude-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-turn-prelude-boundary] OK - turn prelude effects are behind one entry");
