import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src/battle");
const entry = path.normalize("src/battle/turn-context.js");
const entryTest = path.normalize("src/battle/turn-context.test.js");
const snapshotImpl = path.normalize("src/battle/snapshot.js");
const snapshotTest = path.normalize("src/battle/snapshot.test.js");
const battleRound = path.normalize("src/battle/battle-round.js");
const battleRoundTest = path.normalize("src/battle/battle-round.test.js");
const monsterStatus = path.normalize("src/battle/monster-status-automation.js");
const monsterStatusTest = path.normalize("src/battle/monster-status-automation.test.js");
const spiritToggle = path.normalize("src/battle/battle-spirit-toggle.js");
const spiritToggleTest = path.normalize("src/battle/battle-spirit-toggle.test.js");
const rawRuntimeReaders = new Set([
  path.normalize("src/battle/attack/decide-attack.js"),
  path.normalize("src/battle/item/decide-item.js"),
  path.normalize("src/battle/rules/index.js"),
]);
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
    if (
      relative === entry ||
      relative === entryTest ||
      relative === snapshotImpl ||
      relative === snapshotTest ||
      relative === battleRound ||
      relative === battleRoundTest ||
      relative === monsterStatus ||
      relative === monsterStatusTest ||
      relative === spiritToggle ||
      relative === spiritToggleTest
    )
      return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of [
      "CdRuntimeEvent.INCREMENT_TURN",
      "CdRuntimeEvent.PERSIST",
      "collectSnapshot",
      "assertNoDomRefs",
    ]) {
      if (new RegExp(`\\b${name}\\b`).test(line)) {
        violations.push(`${where} ${name} belongs behind prepareBattleTurnContext()`);
      }
    }
    if (
      rawRuntimeReaders.has(relative) &&
      /\bg\(\s*["'](?:roundNow|roundAll|roundType|monsterAlive|globalTurn|lastSpiritToggleGlobalTurn)["']/.test(
        line
      )
    ) {
      violations.push(`${where} turn decisions must read prepared snap context, not raw g()`);
    }
    if (/\bg\(\s*["']lastSpiritToggleGlobalTurn["']/.test(line)) {
      violations.push(`${where} Spirit toggle cooldown state belongs in battle-spirit-toggle`);
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function prepareBattleTurnContext\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose prepareBattleTurnContext()`);
  }
  for (const required of [
    "runCdRuntimeAutomation",
    "CdRuntimeEvent.INCREMENT_TURN",
    "CdRuntimeEvent.PERSIST",
    "collectSnapshot",
    "assertNoDomRefs",
    "OptionEvent.READ_FIELD",
    "BattleRoundEvent.READ_RUNTIME",
    "BattleRoundEvent.READ_TYPE",
    "MonsterStatusEvent.READ_COMBATANT_COUNTS",
    "BattleSpiritToggleEvent.READ_LAST_TOGGLE",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must read debugSnapshot through option entry`);
  }
}

function checkSpiritToggleEntry() {
  const text = fs.readFileSync(path.join(root, spiritToggle), "utf8");
  for (const required of ["DEFAULT_SPIRIT_TOGGLE_TURN", "normalizeSpiritToggleTurn"]) {
    if (!text.includes(required)) {
      violations.push(`${spiritToggle.replaceAll("\\", "/")} must internalize turn invariants`);
    }
  }
  if ((text.match(/normalizeSpiritToggleTurn\(/g) || []).length < 3) {
    violations.push(
      `${spiritToggle.replaceAll("\\", "/")} must normalize Spirit toggle writes and reads`
    );
  }
}

walk(srcDir);
checkEntry();
checkSpiritToggleEntry();

if (violations.length) {
  console.error("[verify-turn-context-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-turn-context-boundary] OK — battle turn context is behind one entry");
