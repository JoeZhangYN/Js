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
  "runBattleTurnPrelude",
  "PREPARE_CURRENT_TURN",
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
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover turn prelude entry contract`);
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
