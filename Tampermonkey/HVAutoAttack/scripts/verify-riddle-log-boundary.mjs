import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/riddle-log.js");
const failureOwner = path.normalize("src/state/riddle-log-failure.js");
const ownerTest = path.normalize("src/state/riddle-log.test.js");
const failureTest = path.normalize("src/state/riddle-log-failure.test.js");
const settingsRender = path.normalize("src/settings/render.js");
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
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      /from\s+["'](?:\.\/|\.\.\/state\/)riddle-log\.js["']/.test(line) &&
      !/\b(?:RiddleLogEvent|runRiddleLogAutomation)\b/.test(line)
    ) {
      violations.push(`${where} riddle log consumers must use runRiddleLogAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      /\b(?:getValue|setValue|delValue)\(\s*["']riddleLog["']/.test(line)
    ) {
      violations.push(`${where} riddle log storage belongs in state/riddle-log.js`);
    }
    if (
      relative === settingsRender &&
      /\bRiddleLogEvent\.READ\b|\brlog\b|Run log \(last/.test(line)
    ) {
      violations.push(`${where} settings must not compose riddle log report fields`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
for (const required of [
  "runRiddleLogAutomation",
  "RiddleLogEvent",
  "RENDER_REPORT_ROWS",
  "RIDDLE_LOG_KEY",
  "persistRiddleLog",
  "clearPersistedRiddleLog",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (!ownerText.includes("const riddleLogEventHandlers")) {
  violations.push(`${owner.replaceAll("\\", "/")} must route riddle log events through a handler table`);
}

const entryMatch = ownerText.match(/export function runRiddleLogAutomation[\s\S]*?\n}/);
if (!entryMatch) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runRiddleLogAutomation(event)`);
} else {
  const entryBody = entryMatch[0];
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`);
  }
  if (/\bevent\.type\b/.test(entryBody) || !/\bevent\?\.type\b/.test(entryBody)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for null riddle log events`);
  }
  for (const internal of [
    "pushRiddleLog(",
    "getRiddleLog(",
    "clearRiddleLog(",
    "renderRiddleLogReportRows(",
  ]) {
    if (entryBody.includes(internal)) {
      violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch through riddleLogEventHandlers`);
    }
  }
}
if (!/runRiddleLogAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null riddle log events`);
}

if (/\b(?:setValue|delValue)\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not write or delete riddle log storage directly`);
}
if (!/function persistRiddleLog\(entries\) \{[\s\S]*setValue\(RIDDLE_LOG_KEY,\s*entries\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordRiddleLogFailure\("persist",\s*error\);[\s\S]*return false;/.test(failureOwnerText)) {
  violations.push(`${failureOwner.replaceAll("\\", "/")} must classify riddle log write failures`);
}
if (!/function clearPersistedRiddleLog\(\) \{[\s\S]*delValue\(RIDDLE_LOG_KEY\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordRiddleLogFailure\("clear",\s*error\);[\s\S]*return false;/.test(failureOwnerText)) {
  violations.push(`${failureOwner.replaceAll("\\", "/")} must classify riddle log clear failures`);
}
for (const required of [
  "RIDDLE_LOG_FAILURE_KEY",
  "HVAA:lastRiddleLogFailure",
  "recordRiddleLogFailure",
  "riddleLog",
  "persistRiddleLog",
  "clearPersistedRiddleLog",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "RIDDLE_LOG_FAILURE_KEY",
  "riddle log write blocked",
  "riddle log delete blocked",
  "storageWrite",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!settingsText.includes("RiddleLogEvent.RENDER_REPORT_ROWS")) {
  violations.push(`${settingsRender.replaceAll("\\", "/")} must request rendered riddle log rows`);
}

for (const legacy of ["pushRiddleLog", "getRiddleLog", "clearRiddleLog"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runRiddleLogAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-riddle-log-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-log-boundary] OK — riddle log is behind one entry");
