import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/riddle-stats.js");
const failureOwner = path.normalize("src/state/riddle-stats-failure.js");
const ownerTest = path.normalize("src/state/riddle-stats.test.js");
const failureTest = path.normalize("src/state/riddle-stats-failure.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/state\/)riddle-stats\.js["']/.test(line) &&
      /\b(?:getRiddleStats|recordMLDetail|recordRiddleAppear|recordMLOutcome|resetRiddleStats)\b/.test(
        line
      )
    ) {
      violations.push(`${where} legacy riddle stats imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      relative !== settingsRender &&
      /from\s+["'](?:\.\/|\.\.\/state\/)riddle-stats\.js["']/.test(line) &&
      !/\b(?:ML_OUTCOMES|RiddleStatsEvent|runRiddleStatsAutomation)\b/.test(line)
    ) {
      violations.push(`${where} riddle stats consumers must use runRiddleStatsAutomation(event)`);
    }
    if (
      relative === settingsRender &&
      /\bML_OUTCOMES\b|\bmlCall\b|\boutcomes\b|\bRECORD_OUTCOME\b/.test(line)
    ) {
      violations.push(`${where} settings must not compose riddle stats report fields`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      /\b(?:getValue|setValue|delValue)\(\s*["']riddleStats["']/.test(line)
    ) {
      violations.push(`${where} riddle stats storage belongs in state/riddle-stats.js`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
for (const required of [
  "runRiddleStatsAutomation",
  "RiddleStatsEvent",
  "ML_OUTCOMES",
  "riddleStatsEventHandlers",
  "RENDER_REPORT_ROWS",
  "RIDDLE_STATS_KEY",
  "persistRiddleStats",
  "clearPersistedRiddleStats",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (
  !/\[EVENT_READ\]: getRiddleStats[\s\S]*\[EVENT_RECORD_DETAIL\]: \(event\) => recordMLDetail\(event\.detail\)[\s\S]*\[EVENT_RECORD_APPEAR\]: recordRiddleAppear[\s\S]*\[EVENT_RECORD_OUTCOME\]: \(event\) => recordMLOutcome\(event\.outcome\)[\s\S]*\[EVENT_RESET\]: resetRiddleStats[\s\S]*\[EVENT_RENDER_REPORT_ROWS\]: renderRiddleStatsReportRows/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} must route stats events through handler table`);
}

const entryBody =
  ownerText.match(/export function runRiddleStatsAutomation\(event = \{ type: EVENT_READ \}\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must route events through handler table`);
}
if (/\bevent\.type\b/.test(entryBody) || !/\bevent\?\.type\b/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for null riddle stats events`);
}
for (const forbidden of [
  "getRiddleStats",
  "recordMLDetail",
  "recordRiddleAppear",
  "recordMLOutcome",
  "resetRiddleStats",
  "renderRiddleStatsReportRows",
]) {
  if (entryBody.includes(forbidden)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must route stats work through handlers`);
  }
}
if (!/runRiddleStatsAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null riddle stats events`);
}

if (/\b(?:setValue|delValue)\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not write or delete riddle stats storage directly`);
}
if (!/function persistRiddleStats\(stats,\s*stage\) \{[\s\S]*setValue\(RIDDLE_STATS_KEY,\s*stats\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordRiddleStatsFailure\(stage,\s*error\);[\s\S]*return false;/.test(failureOwnerText)) {
  violations.push(`${failureOwner.replaceAll("\\", "/")} must classify riddle stats write failures`);
}
if (!/function clearPersistedRiddleStats\(\) \{[\s\S]*delValue\(RIDDLE_STATS_KEY\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordRiddleStatsFailure\("reset",\s*error\);[\s\S]*return false;/.test(failureOwnerText)) {
  violations.push(`${failureOwner.replaceAll("\\", "/")} must classify riddle stats reset failures`);
}
for (const required of [
  "RIDDLE_STATS_FAILURE_KEY",
  "HVAA:lastRiddleStatsFailure",
  "recordRiddleStatsFailure",
  "riddleStats",
  "persistRiddleStats",
  "clearPersistedRiddleStats",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "RIDDLE_STATS_FAILURE_KEY",
  "riddle stats write blocked",
  "riddle stats delete blocked",
  "storageWrite",
  "RiddleLogEvent.READ",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (!/if \(!persistRiddleStats\(s,\s*"record-detail"\)\) return false;[\s\S]*runRiddleLogAutomation/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must append riddle detail log only after stats persistence succeeds`);
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!settingsText.includes("RiddleStatsEvent.RENDER_REPORT_ROWS")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must request rendered riddle stats rows`
  );
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
