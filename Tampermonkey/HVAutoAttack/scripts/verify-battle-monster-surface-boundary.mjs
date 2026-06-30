import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-monster-surface.js");
const ownerTest = path.normalize("src/battle/battle-monster-surface.test.js");
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
  "BattleMonsterSurfaceEvent",
  "battleMonsterSurfaceEventHandlers",
  "runBattleMonsterSurface",
  "READ_CURRENT",
  'gE("div.btm1", "all")',
  "nbardead",
  "nbargreen",
  ".btm6",
  "parseEffectName",
  "parseEffectTurns",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleMonsterSurfaceEvent\b|runBattleMonsterSurface\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleMonsterSurface\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_CURRENT\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover monster surface entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown events without touching DOM")) {
    violations.push(`${rel(ownerTest)} must cover unknown monster surface events`);
  }
}
if (
  !snapshotText.includes("BattleMonsterSurfaceEvent.READ_CURRENT") ||
  !snapshotText.includes("runBattleMonsterSurface")
) {
  violations.push(`${rel(snapshot)} must read monsters through battle monster surface entry`);
}
if (/readMonsters|readMonsterBuffs|div\.btm1|\.btm5|\.btm6|nbargreen|nbardead/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not own monster surface DOM reads`);
}

if (violations.length) {
  console.error("[verify-battle-monster-surface-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-monster-surface-boundary] OK - monster surface reads are behind one entry"
);
