import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-player-effects.js");
const ownerTest = path.normalize("src/battle/battle-player-effects.test.js");
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
  "BattlePlayerEffectsEvent",
  "runBattlePlayerEffects",
  "READ_CURRENT",
  "#pane_effects",
  "parseEffectName",
  "parseEffectTurns",
  "playerBuffs",
  "playerEffectTurns",
  "channeling",
  "etherTapActiveX2",
  "etherTapExpiring",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattlePlayerEffectsEvent\b|runBattlePlayerEffects\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover player effects entry contract`);
}
if (!snapshotText.includes("runBattlePlayerEffects")) {
  violations.push(`${rel(snapshot)} must read player effects through battle player effects entry`);
}
if (/#pane_effects|etherTapActiveX2:\s*!!gE|playerBuffs:\s*playerEffects\.map/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not own player effect DOM rules`);
}

if (violations.length) {
  console.error("[verify-battle-player-effects-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-player-effects-boundary] OK - player effects are behind one entry");
