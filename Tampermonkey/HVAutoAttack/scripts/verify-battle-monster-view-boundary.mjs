import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-monster-view.js");
const ownerTest = path.normalize("src/battle/battle-monster-view.test.js");
const legacyMonsterView = path.normalize("src/battle/monster-view.js");
const monsterViewCoreTest = path.normalize("src/battle/monster-view.test.js");
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

if (fs.existsSync(path.join(root, legacyMonsterView))) {
  violations.push(`${rel(legacyMonsterView)} pure monster view helper exports must stay retired`);
}

for (const required of [
  "BattleMonsterViewEvent",
  "battleMonsterViewEventHandlers",
  "runBattleMonsterView",
  "READ_VIEW",
  "READ_ALIVE_BY_ORDER",
  "READ_BY_ORDER",
  "READ_HP_VARS",
  "runMonsterStatusAutomation",
  "runMonsterCacheAutomation",
  "joinMonsterView",
  "aliveByOrder",
  "byOrder",
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
if (/battleMonsterViewEventHandlers\[event\.type\]/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must fail closed for invalid monster view events`);
}
if (!/battleMonsterViewEventHandlers\[event\?\.type\]/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch invalid monster view events through optional type`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover monster view entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects invalid events without reading status, cache, or deriving view")) {
    violations.push(`${rel(ownerTest)} must cover invalid monster view events`);
  }
  if (!/runBattleMonsterView\(null\)/.test(ownerTestText)) {
    violations.push(`${rel(ownerTest)} must cover null monster view events`);
  }
  if (!ownerTestText.includes("routes monster ordering queries through the entry without reading status or cache")) {
    violations.push(`${rel(ownerTest)} must cover monster ordering query events`);
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

const battleDir = path.join(root, "src/battle");
for (const entry of fs.readdirSync(battleDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
  const file = path.join(entry.parentPath, entry.name);
  const relative = path.normalize(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  if (/from\s+["'][^"']*(?:^|[\\/])monster-view\.js["']/.test(text)) {
    violations.push(`${rel(relative)} must read monster view ordering through runBattleMonsterView`);
  }
}

if (violations.length) {
  console.error("[verify-battle-monster-view-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-monster-view-boundary] OK - unified monster view is behind one entry");
