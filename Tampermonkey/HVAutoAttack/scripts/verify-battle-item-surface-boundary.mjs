import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-item-surface.js");
const ownerTest = path.normalize("src/battle/battle-item-surface.test.js");
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
  "BattleItemSurfaceEvent",
  "runBattleItemSurface",
  "READ_GEM_NAME",
  "#ikey_p",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleItemSurfaceEvent\b|runBattleItemSurface\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover item surface entry contract`);
}
if (!snapshotText.includes("runBattleItemSurface")) {
  violations.push(`${rel(snapshot)} must read gemName through battle item surface entry`);
}
if (/#ikey_p|gemName:\s*gE/.test(snapshotText)) {
  violations.push(`${rel(snapshot)} must not own item surface DOM reads`);
}

if (violations.length) {
  console.error("[verify-battle-item-surface-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-item-surface-boundary] OK - item surface reads are behind one entry");
