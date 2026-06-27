import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/alarm/alarm.js");
const ownerTest = path.normalize("src/alarm/alarm.test.js");
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
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/alarm\/|\.\.\/\.\.\/alarm\/)alarm\.js["']/.test(line) &&
      /\b(?:setAlarm|setAudioAlarm|setNotification)\b/.test(line)
    ) {
      violations.push(`${rel(file)}:${index + 1} legacy alarm imports are forbidden`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runAlarmAutomation", "AlarmEvent"]) {
  if (!ownerText.includes(required)) violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
}

for (const legacy of ["setAlarm", "setAudioAlarm", "setNotification"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runAlarmAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-alarm-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-alarm-boundary] OK — alarm workflow is behind one entry");
