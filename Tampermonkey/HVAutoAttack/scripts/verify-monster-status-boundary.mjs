import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src/battle");
const entry = path.normalize("src/battle/monster-status-automation.js");
const hpImpl = path.normalize("src/battle/attack.js");
const parserImpl = path.normalize("src/battle/log-parser.js");
const newRound = path.normalize("src/battle/new-round.js");
const reloader = path.normalize("src/battle/reloader.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && item.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    const where = `${rel(file)}:${index + 1}`;
    if (/\bfixMonsterStatus\b/.test(line)) {
      violations.push(`${where} legacy fixMonsterStatus path is forbidden`);
    }
    if (
      (relative === newRound || relative === reloader) &&
      /btm1|btm2|nbardead|g\(\s*["'](?:monsterAll|monsterAlive|bossAll|bossAlive)["']\s*,/.test(
        line
      ) &&
      !line.includes("runMonsterStatusAutomation") &&
      !line.includes("MonsterStatusEvent")
    ) {
      violations.push(`${where} combatant counts belong behind runMonsterStatusAutomation(event)`);
    }
    if (
      relative !== entry &&
      relative !== hpImpl &&
      relative !== parserImpl &&
      /\bcountMonsterHP\b/.test(line)
    ) {
      violations.push(`${where} countMonsterHP belongs behind runMonsterStatusAutomation(event)`);
    }
    if (/\b(?:getValue|setValue)\(\s*["']monsterStatus["']/.test(line)) {
      violations.push(
        `${where} monsterStatus persistence belongs in runMonsterStatusAutomation(event)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runMonsterStatusAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runMonsterStatusAutomation(event)`);
  }
  if (!text.includes("STORAGE_KEYS.MONSTER_STATUS")) {
    violations.push(`${entry.replaceAll("\\", "/")} must use STORAGE_KEYS.MONSTER_STATUS`);
  }
  for (const required of [
    "countMonsterHP",
    "buildMonsterStatus",
    "monsterStatus",
    "REFRESH_COMBATANT_COUNTS",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
}

walk(srcDir);
checkEntry();

if (violations.length) {
  console.error("[verify-monster-status-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monster-status-boundary] OK — monster status lifecycle is behind one entry");
