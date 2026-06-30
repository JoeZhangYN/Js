import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-runtime.js");
const ownerTest = path.normalize("src/battle/battle-runtime.test.js");
const storage = path.normalize("src/state/storage.js");
const storageTest = path.normalize("src/state/storage.test.js");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== storage &&
      relative !== storageTest &&
      /\bdelValue\(\s*2\s*\)/.test(line)
    ) {
      violations.push(`${where} battle session clear must use runBattleRuntimeAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== storage &&
      relative !== storageTest &&
      relative !== path.normalize("src/state/persist-keys.js") &&
      /\bSTORAGE_KEYS\.(?:DISABLED|ROUND_NOW|ROUND_ALL|ROUND_TYPE|BATTLE_CODE|MONSTER_STATUS)\b/.test(
        line
      ) &&
      /\bdelValue\(/.test(line)
    ) {
      violations.push(`${where} battle runtime deletion belongs in battle-runtime boundary`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (!/export function runBattleRuntimeAutomation\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runBattleRuntimeAutomation()`);
}
if (!ownerText.includes("CLEAR_SESSION")) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose CLEAR_SESSION event`);
}
if (!ownerText.includes("delValue(2)")) {
  violations.push(`${owner.replaceAll("\\", "/")} must own legacy delValue(2) bridge`);
}
if (!/const battleRuntimeEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_CLEAR_SESSION\]: clearSession/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route runtime events through battleRuntimeEventHandlers`);
}
const ownerEntryBody =
  ownerText.match(/export function runBattleRuntimeAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/event\.type\s*!==|event\.type\s*===/.test(ownerEntryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}

if (violations.length) {
  console.error("[verify-battle-runtime-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-runtime-boundary] OK — battle session clear is behind one entry");
