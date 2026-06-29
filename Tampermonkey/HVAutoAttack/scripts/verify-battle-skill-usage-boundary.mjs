import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-skill-usage.js");
const ownerTest = path.normalize("src/battle/battle-skill-usage.test.js");
const roundStart = path.normalize("src/battle/new-round.js");
const executeAttack = path.normalize("src/battle/attack/execute-attack.js");
const executeAttackTest = path.normalize("src/battle/attack/execute-attack.test.js");
const snapshot = path.normalize("src/battle/snapshot.js");
const snapshotTest = path.normalize("src/battle/snapshot.test.js");
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
    if (
      relative !== owner &&
      relative !== ownerTest &&
      !relative.endsWith(".test.js") &&
      /\bg\(\s*["']skillOTOS["']/.test(line)
    ) {
      violations.push(`${where} skillOTOS belongs behind runBattleSkillUsageAutomation(event)`);
    }
  });
}

function requireText(relative, required) {
  const text = fs.readFileSync(path.join(root, relative), "utf8");
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
}

walk(srcDir);

requireText(owner, [
  "BattleSkillUsageEvent",
  "runBattleSkillUsageAutomation",
  "RESET_ROUND",
  "RECORD_USE",
  "READ_USAGE",
]);
requireText(roundStart, ["BattleSkillUsageEvent.RESET_ROUND", "runBattleSkillUsageAutomation"]);
requireText(executeAttack, ["BattleSkillUsageEvent.RECORD_USE", "runBattleSkillUsageAutomation"]);
requireText(snapshot, ["BattleSkillUsageEvent.READ_USAGE", "runBattleSkillUsageAutomation"]);

for (const relative of [executeAttackTest, snapshotTest]) {
  requireText(relative, ["runBattleSkillUsageAutomation"]);
}

if (violations.length) {
  console.error("[verify-battle-skill-usage-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-skill-usage-boundary] OK — per-round skill usage is behind one entry");
