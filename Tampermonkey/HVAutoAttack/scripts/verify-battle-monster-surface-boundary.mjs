import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-monster-surface.js");
const ownerTest = path.normalize("src/battle/battle-monster-surface.test.js");
const snapshot = path.normalize("src/battle/snapshot.js");
const effectParse = path.normalize("src/battle/effect-parse.js");
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
  "BattleEffectParseEvent.READ_EFFECT",
  "runBattleEffectParse",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (/import\s*\{[^}]*\b(?:parseEffectName|parseEffectTurns)\b/.test(ownerText)) {
  violations.push(`${rel(owner)} must consume effect parsing through runBattleEffectParse(event)`);
}
const effectParseText = read(effectParse);
for (const required of [
  "BattleEffectParseEvent",
  "battleEffectParseEventHandlers",
  "runBattleEffectParse",
  "READ_EFFECT",
  "parseEffectName",
  "parseEffectTurns",
]) {
  if (!effectParseText.includes(required)) {
    violations.push(`${rel(effectParse)} must own effect parse query ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleEffectParseEvent\b|runBattleEffectParse\b)/.test(
    effectParseText
  )
) {
  violations.push(`${rel(effectParse)} may export only its event query entry`);
}
const effectParseEntryBody =
  effectParseText.match(/export function runBattleEffectParse\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (/battleEffectParseEventHandlers\[event\.type\]/.test(effectParseEntryBody)) {
  violations.push(`${rel(effectParse)} entry must fail closed for invalid effect parse events`);
}
if (!/battleEffectParseEventHandlers\[event\?\.type\]/.test(effectParseEntryBody)) {
  violations.push(`${rel(effectParse)} entry must dispatch invalid effect parse events through optional type`);
}
const effectParseTest = path.normalize("src/battle/effect-parse.test.js");
const effectParseTestText = read(effectParseTest);
if (!/runBattleEffectParse\(null\)/.test(effectParseTestText)) {
  violations.push(`${rel(effectParseTest)} must cover null effect parse events`);
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
if (/battleMonsterSurfaceEventHandlers\[event\.type\]/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must fail closed for invalid monster surface events`);
}
if (!/battleMonsterSurfaceEventHandlers\[event\?\.type\]/.test(entryBody)) {
  violations.push(
    `${rel(owner)} entry must dispatch invalid monster surface events through optional type`
  );
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover monster surface entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects invalid events without touching DOM")) {
    violations.push(`${rel(ownerTest)} must cover invalid monster surface events`);
  }
  if (!/runBattleMonsterSurface\(null\)/.test(ownerTestText)) {
    violations.push(`${rel(ownerTest)} must cover null monster surface events`);
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
