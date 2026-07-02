import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-skill-readiness.js");
const ownerTest = path.normalize("src/battle/battle-skill-readiness.test.js");
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
  "BattleSkillReadinessEvent",
  "battleSkillReadinessEventHandlers",
  "runBattleSkillReadiness",
  "READ_READY_MAP",
  "BATTLE_SKILL_IDS",
  "document.getElementById",
  'el.style.opacity !== "0.5"',
  '"111"',
  '"213"',
  '"1111"',
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleSkillReadinessEvent\b|runBattleSkillReadiness\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleSkillReadiness\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_READY_MAP\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (/battleSkillReadinessEventHandlers\[event\.type\]/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must fail closed for invalid skill readiness events`);
}
if (!/battleSkillReadinessEventHandlers\[event\?\.type\]/.test(entryBody)) {
  violations.push(
    `${rel(owner)} entry must dispatch invalid skill readiness events through optional type`
  );
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover skill readiness entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects invalid events without reading skill button DOM")) {
    violations.push(`${rel(ownerTest)} must cover invalid skill readiness events`);
  }
  if (!/runBattleSkillReadiness\(null\)/.test(ownerTestText)) {
    violations.push(`${rel(ownerTest)} must cover null skill readiness events`);
  }
}
if (!snapshotText.includes("runBattleSkillReadiness")) {
  violations.push(`${rel(snapshot)} must read skillReady through battle skill readiness entry`);
}
if (
  /document\.getElementById|style\.opacity !== ["']0\.5["']|BATTLE_SKILL_IDS/.test(snapshotText)
) {
  violations.push(`${rel(snapshot)} must not own skill readiness DOM rules`);
}

if (violations.length) {
  console.error("[verify-battle-skill-readiness-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-skill-readiness-boundary] OK - skill readiness is behind one entry");
