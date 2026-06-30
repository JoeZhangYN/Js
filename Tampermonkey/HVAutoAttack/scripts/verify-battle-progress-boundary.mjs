import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-progress.js");
const ownerTest = path.normalize("src/battle/battle-progress.test.js");
const allowedDirectReaders = new Set(
  [
    owner,
    ownerTest,
    "src/battle/battle-round.js",
    "src/battle/battle-round.test.js",
    "src/battle/monster-status-automation.js",
    "src/battle/monster-status-automation.test.js",
    "src/battle/monster-status-runtime.test.js",
    "src/battle/monster-status-view.js",
    "src/battle/monster-status-view.test.js",
    "src/battle/monster-status-round-start.test.js",
  ].map((p) => path.normalize(p))
);
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
  if (allowedDirectReaders.has(relative)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (relative.endsWith(".test.js")) return;
    const where = `${rel(file)}:${index + 1}`;
    if (/BattleRoundEvent\.(?:READ_RUNTIME|READ_TYPE)/.test(line)) {
      violations.push(`${where} battle progress facts belong behind battle-progress`);
    }
    if (/MonsterStatusEvent\.READ_COMBATANT_COUNTS/.test(line)) {
      violations.push(`${where} combatant progress facts belong behind battle-progress`);
    }
    if (
      /\bg\(\s*["'](?:roundNow|roundAll|roundType|monsterAlive|monsterAll|bossAll|bossAlive)["']/.test(
        line
      )
    ) {
      violations.push(`${where} current battle progress must not be assembled from raw store`);
    }
  });
}

function checkOwner() {
  const text = fs.readFileSync(path.join(root, owner), "utf8");
  for (const required of [
    "BattleProgressEvent",
    "runBattleProgressAutomation",
    "READ_CONTEXT",
    "BattleRoundEvent.READ_RUNTIME",
    "BattleRoundEvent.READ_TYPE",
    "MonsterStatusEvent.READ_COMBATANT_COUNTS",
    "bossAlive",
    "bossAll",
    "monsterAlive",
    "monsterAll",
    "roundAll",
    "roundNow",
    "roundType",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  if (!/const battleProgressHandlers\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${owner.replaceAll("\\", "/")} must route progress queries through one table`);
  }
  if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(text)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must not route progress queries through an if ladder`
    );
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleProgressEvent\b|runBattleProgressAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
  }
  for (const sideEffect of ["AlarmEvent", "NavigationEvent", "CLEAR_SESSION", "post(", "click("]) {
    if (text.includes(sideEffect)) {
      violations.push(`${owner.replaceAll("\\", "/")} must stay a pure progress query`);
    }
  }
  if (!fs.existsSync(path.join(root, ownerTest))) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover battle progress query contract`);
  }
}

walk(srcDir);
checkOwner();

if (violations.length) {
  console.error("[verify-battle-progress-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-progress-boundary] OK — battle progress facts are behind one query");
