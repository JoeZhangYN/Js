import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-monster-view.js");
const ownerTest = path.normalize("src/battle/battle-monster-view.test.js");
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
  "BattleMonsterViewEvent",
  "battleMonsterViewEventHandlers",
  "runBattleMonsterView",
  "READ_VIEW",
  "runMonsterStatusAutomation",
  "runMonsterCacheAutomation",
  "joinMonsterView",
  "monsterHpVars",
  "monsterIdentities",
  "aliveCount",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleMonsterViewEvent\b|runBattleMonsterView\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleMonsterView\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_VIEW\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover monster view entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown events without reading status, cache, or deriving view")) {
    violations.push(`${rel(ownerTest)} must cover unknown monster view events`);
  }
}
if (
  !snapshotText.includes("BattleMonsterViewEvent.READ_VIEW") ||
  !snapshotText.includes("runBattleMonsterView")
) {
  violations.push(`${rel(snapshot)} must read unified monster view through battle monster view entry`);
}
if (/MonsterStatusEvent\.READ_STATUS|MonsterCacheEvent\.READ_DB|joinMonsterView/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not assemble monster status/cache/view directly`);
}
if (/monsterHpVars|\.filter\(\s*\(?\w+\)?\s*=>\s*!\w+\.isDead/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not derive monster view summary directly`);
}

if (violations.length) {
  console.error("[verify-battle-monster-view-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-monster-view-boundary] OK - unified monster view is behind one entry");
