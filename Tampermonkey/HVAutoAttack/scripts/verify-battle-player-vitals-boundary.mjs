import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-player-vitals.js");
const ownerTest = path.normalize("src/battle/battle-player-vitals.test.js");
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
  "BattlePlayerVitalsEvent",
  "runBattlePlayerVitals",
  "READ_CURRENT",
  "MIRROR_RUNTIME",
  "#vbh",
  "#dvbh>div>img",
  "#dvrhd",
  "hpAbs",
  "mpAbs",
  "spAbs",
  "hpDeficit",
  "mpDeficit",
  "spDeficit",
  'g("hp"',
  'g("oc"',
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattlePlayerVitalsEvent\b|runBattlePlayerVitals\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover player vitals entry contract`);
}
if (!snapshotText.includes("runBattlePlayerVitals")) {
  violations.push(`${rel(snapshot)} must read player vitals through battle player vitals entry`);
}
if (/#vbh|#dvbh|#dvrhd|#dvrm|#dvrs|readPlayerVitals/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not own player vitals DOM rules`);
}

if (violations.length) {
  console.error("[verify-battle-player-vitals-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-player-vitals-boundary] OK - player vitals are behind one entry");
