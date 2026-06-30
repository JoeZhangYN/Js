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
  "battleItemSurfaceEventHandlers",
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
const entryBody =
  ownerText.match(/export function runBattleItemSurface\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_GEM_NAME\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover item surface entry contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown events without reading item DOM")) {
    violations.push(`${rel(ownerTest)} must cover unknown item surface events`);
  }
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
