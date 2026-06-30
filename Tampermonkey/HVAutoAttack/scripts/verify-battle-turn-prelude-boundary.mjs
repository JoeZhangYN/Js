import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-turn-prelude.js");
const ownerTest = path.normalize("src/battle/battle-turn-prelude.test.js");
const mainLoop = path.normalize("src/battle/main-loop.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
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
  "killBug",
  "MonsterStatusEvent.UPDATE_HP",
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
}
if (
  !mainLoopText.includes("BattleTurnPreludeEvent.PREPARE_CURRENT_TURN") ||
  !mainLoopText.includes("runBattleTurnPrelude")
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

if (violations.length) {
  console.error("[verify-battle-turn-prelude-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-turn-prelude-boundary] OK - turn prelude effects are behind one entry");
