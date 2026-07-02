import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-player-effects.js");
const ownerTest = path.normalize("src/battle/battle-player-effects.test.js");
const snapshot = path.normalize("src/battle/snapshot.js");
const effectParse = path.normalize("src/battle/effect-parse.js");
const conditionEval = path.normalize("src/settings/condition-eval.js");
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
  "battlePlayerEffectsEventHandlers",
  "runBattlePlayerEffects",
  "READ_CURRENT",
  "#pane_effects",
  "BattleEffectParseEvent.READ_EFFECT",
  "runBattleEffectParse",
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
if (/import\s*\{[^}]*\b(?:parseEffectName|parseEffectTurns)\b/.test(ownerText)) {
  violations.push(`${rel(owner)} must consume effect parsing through runBattleEffectParse(event)`);
}
const conditionEvalText = read(conditionEval);
if (!conditionEvalText.includes("runBattleEffectParse")) {
  violations.push(`${rel(conditionEval)} must consume effect parsing through runBattleEffectParse(event)`);
}
if (/import\s*\{[^}]*\b(?:parseEffectName|parseEffectTurns)\b/.test(conditionEvalText)) {
  violations.push(`${rel(conditionEval)} must not import raw effect parser functions`);
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
if (
  /\bexport\s+(?:function|const)\s+(?!BattlePlayerEffectsEvent\b|runBattlePlayerEffects\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattlePlayerEffects\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_CURRENT\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (entryBody.includes("event.type") || !entryBody.includes("event?.type")) {
  violations.push(`${rel(owner)} entry must fail closed for unknown or null player effects events`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover player effects entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (
    !ownerTestText.includes("rejects invalid events without touching DOM or parsers") ||
    !ownerTestText.includes("runBattlePlayerEffects(null)")
  ) {
    violations.push(`${rel(ownerTest)} must cover unknown and null player effects events`);
  }
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
