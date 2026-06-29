import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src/battle");
const entry = path.normalize("src/battle/monster-status-automation.js");
const hpImpl = path.normalize("src/battle/monster-status-hp.js");
const parserImpl = path.normalize("src/battle/log-parser.js");
const roundStart = path.normalize("src/battle/new-round.js");
const actionEventBridge = path.normalize("src/battle/battle-action-event-bridge.js");
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
      (relative === roundStart || relative === actionEventBridge) &&
      /btm1|btm2|nbardead|g\(\s*["'](?:monsterAll|monsterAlive|bossAll|bossAlive)["']\s*,/.test(
        line
      ) &&
      !line.includes("runMonsterStatusAutomation") &&
      !line.includes("MonsterStatusEvent")
    ) {
      violations.push(`${where} combatant counts belong behind runMonsterStatusAutomation(event)`);
    }
    if (/\bcountMonsterHP\b/.test(line)) {
      violations.push(`${where} legacy countMonsterHP path is forbidden`);
    }
    if (
      relative !== entry &&
      relative !== hpImpl &&
      relative !== parserImpl &&
      /\bupdateMonsterHpRuntime\b/.test(line)
    ) {
      violations.push(
        `${where} monster HP updates belong behind runMonsterStatusAutomation(event)`
      );
    }
    if (/\b(?:getValue|setValue)\(\s*["']monsterStatus["']/.test(line)) {
      violations.push(
        `${where} monsterStatus persistence belongs in runMonsterStatusAutomation(event)`
      );
    }
    if (relative === hpImpl && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(`${where} monster HP target weights must read options through option entry`);
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
    "DEFAULT_COMBATANT_COUNT",
    "normalizeCombatantCount",
    "combatantCounts",
    "updateMonsterHpRuntime",
    "buildMonsterStatus",
    "monsterStatus",
    "REFRESH_COMBATANT_COUNTS",
    "PREPARE_ROUND_START",
    "READ_COMBATANT_COUNTS",
    "READ_IDS_BY_ORDER",
    "READ_STATUS",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
  if ((text.match(/combatantCounts\(/g) || []).length < 3) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must normalize combatant counts on refresh and read`
    );
  }
  if (/RECORD_SPAWN_ROSTER/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must keep spawn roster behind prepare event`);
  }
  const roundStartText = fs.readFileSync(path.join(root, roundStart), "utf8");
  if (/MonsterStatusEvent\.(?:RECORD_SPAWN_ROSTER|ENSURE_READY)/.test(roundStartText)) {
    violations.push(`${roundStart.replaceAll("\\", "/")} must use PREPARE_ROUND_START`);
  }
  if (/battleLog:/.test(roundStartText)) {
    violations.push(`${roundStart.replaceAll("\\", "/")} must pass text rows, not raw battleLog`);
  }
  if (!text.includes("battleLogRows")) {
    violations.push(`${entry.replaceAll("\\", "/")} must parse spawn rosters from text rows`);
  }
  if (!text.includes("BattleRoundStartLogEvent.READ_CURRENT")) {
    violations.push(
      `${entry.replaceAll("\\", "/")} repair must read textlog through round-start log entry`
    );
  }
  if (/#textlog|textContent/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not read textlog DOM directly`);
  }
}

function checkParser() {
  const text = fs.readFileSync(path.join(root, parserImpl), "utf8");
  if (!/function parseMonsterRoster\(battleLogRows, monsterAll\)/.test(text)) {
    violations.push(
      `${parserImpl.replaceAll("\\", "/")} must name spawn parser input battleLogRows`
    );
  }
  const rosterBody = text.slice(
    text.indexOf("export function parseMonsterRoster"),
    text.indexOf("export function buildMonsterStatus")
  );
  if (/textContent|typeof\s+battleLogRows\[i\]/.test(rosterBody)) {
    violations.push(
      `${parserImpl.replaceAll("\\", "/")} parseMonsterRoster must not accept DOM rows`
    );
  }
}

function checkHpImpl() {
  const text = fs.readFileSync(path.join(root, hpImpl), "utf8");
  for (const required of ["OptionEvent.READ_FIELD", "runOptionAutomation"]) {
    if (!text.includes(required)) {
      violations.push(
        `${hpImpl.replaceAll("\\", "/")} must read target weight options through ${required}`
      );
    }
  }
}

walk(srcDir);
checkEntry();
checkHpImpl();
checkParser();

if (violations.length) {
  console.error("[verify-monster-status-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monster-status-boundary] OK — monster status lifecycle is behind one entry");
