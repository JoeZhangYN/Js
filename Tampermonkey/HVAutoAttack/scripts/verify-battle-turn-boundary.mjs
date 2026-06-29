import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/battle-turn.js");
const ownerTest = path.normalize("src/state/battle-turn.test.js");
const allowedTests = new Set(
  [ownerTest, "src/state/auto-tune.test.js", "src/state/recovery-learner.test.js"].map((p) =>
    path.normalize(p)
  )
);
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (relative !== owner && !allowedTests.has(relative) && /\bg\(\s*["']turn["']/.test(line)) {
      violations.push(`${where} battle turn lifecycle belongs in runBattleTurnAutomation(event)`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "BattleTurnEvent",
  "runBattleTurnAutomation",
  "battleTurnEventHandlers",
  "ROUND_STARTED",
  "TURN_STARTED",
  "READ_CURRENT",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}

for (const legacy of ["resetTurn", "advanceTurn", "readCurrentTurn"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runBattleTurnAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-battle-turn-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-turn-boundary] OK — battle turn lifecycle is behind one entry");
