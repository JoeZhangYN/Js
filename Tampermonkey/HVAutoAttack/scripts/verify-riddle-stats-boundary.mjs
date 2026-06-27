import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/riddle-stats.js");
const ownerTest = path.normalize("src/state/riddle-stats.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/state\/)riddle-stats\.js["']/.test(line) &&
      /\b(?:getRiddleStats|recordMLDetail|recordRiddleAppear|recordMLOutcome|resetRiddleStats)\b/.test(
        line
      )
    ) {
      violations.push(`${where} legacy riddle stats imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/state\/)riddle-stats\.js["']/.test(line) &&
      !/\b(?:ML_OUTCOMES|RiddleStatsEvent|runRiddleStatsAutomation)\b/.test(line)
    ) {
      violations.push(`${where} riddle stats consumers must use runRiddleStatsAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /\b(?:getValue|setValue|delValue)\(\s*["']riddleStats["']/.test(line)
    ) {
      violations.push(`${where} riddle stats storage belongs in state/riddle-stats.js`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runRiddleStatsAutomation", "RiddleStatsEvent", "ML_OUTCOMES"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

for (const legacy of [
  "getRiddleStats",
  "recordMLDetail",
  "recordRiddleAppear",
  "recordMLOutcome",
  "resetRiddleStats",
]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runRiddleStatsAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-riddle-stats-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-stats-boundary] OK — riddle stats are behind one entry");
