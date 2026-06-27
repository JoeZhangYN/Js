import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/day-record.js");
const ownerTest = path.normalize("src/state/day-record.test.js");
const lobby = path.normalize("src/pages/lobby-automation.js");
const encounter = path.normalize("src/pages/encounter.js");
const idleArena = path.normalize("src/arena/idle-arena.js");
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
  if (relative.endsWith(".test.js")) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (relative !== owner && /\bg\(\s*["']dateNow["']\s*,/.test(line)) {
      violations.push(`${where} dateNow writes belong in state/day-record.js`);
    }
    if (relative !== owner && relative !== ownerTest && /\bg\(\s*["']dateNow["']\s*\)/.test(line)) {
      violations.push(`${where} dateNow reads must be an explicit daily-record consumer`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["DayRecordEvent", "runDayRecordAutomation", "TimeEvent.UTC_DATE_KEY"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

for (const consumer of [lobby, encounter, idleArena]) {
  const text = fs.readFileSync(path.join(root, consumer), "utf8");
  if (!text.includes("DayRecordEvent.SYNC_UTC_DATE")) {
    violations.push(`${consumer.replaceAll("\\", "/")} must sync daily records through day-record`);
  }
}

if (violations.length) {
  console.error("[verify-day-record-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-day-record-boundary] OK — daily date records sync through one entry");
