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
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover skill readiness entry contract`);
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
