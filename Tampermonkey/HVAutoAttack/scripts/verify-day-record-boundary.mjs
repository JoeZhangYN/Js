import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/day-record.js");
const ownerTest = path.normalize("src/state/day-record.test.js");
const lobby = path.normalize("src/pages/lobby-automation.js");
const idleArena = path.normalize("src/arena/idle-arena.js");
const encounter = path.normalize("src/pages/encounter.js");
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
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
for (const required of [
  "DayRecordEvent",
  "runDayRecordAutomation",
  "TimeEvent.UTC_DATE_KEY",
  "TimeEvent.MS_UNTIL_NEXT_UTC_DAY",
  "REFRESH_AND_SCHEDULE_NEXT_UTC_DAY",
  "UTC_DAY_ROLLOVER_GRACE_MS",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/Date\.UTC\(.*getUTCFullYear\(\).*getUTCMonth\(\).*getUTCDate\(\)\s*\+\s*1/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must read UTC day rollover timing through time entry`
  );
}
if (!ownerText.includes("const dayRecordEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route day-record events through a handler table`
  );
}
const ownerEntry = ownerText.match(/export function runDayRecordAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for null day-record events`
  );
}
for (const internal of ["syncUtcDate(", "refreshAndScheduleNextUtcDay("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through dayRecordEventHandlers`
    );
  }
}
if (!/runDayRecordAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null day-record events`);
}

const lobbyText = fs.readFileSync(path.join(root, lobby), "utf8");
if (!lobbyText.includes("DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY")) {
  violations.push(
    `${lobby.replaceAll("\\", "/")} must refresh and schedule daily records through day-record`
  );
}
if (
  !/function rerunLobbyPageReady\(\) \{\s*return runLobbyAutomation\(\s*\{\s*type:\s*EVENT_PAGE_READY\s*\}\s*\);\s*\}/.test(
    lobbyText
  ) ||
  !/rerun:\s*rerunLobbyPageReady/.test(lobbyText)
) {
  violations.push(
    `${lobby.replaceAll("\\", "/")} must let the UTC day rollover rerun the lobby page-ready workflow`
  );
}
if (/DayRecordEvent\.SYNC_UTC_DATE/.test(lobbyText)) {
  violations.push(
    `${lobby.replaceAll("\\", "/")} must not bypass the daily record rollover scheduler`
  );
}

const idleArenaText = fs.readFileSync(path.join(root, idleArena), "utf8");
if (!idleArenaText.includes("DayRecordEvent.SYNC_UTC_DATE")) {
  violations.push(`${idleArena.replaceAll("\\", "/")} must sync arena day through day-record`);
}

const encounterText = fs.readFileSync(path.join(root, encounter), "utf8");
if (/DayRecordEvent|runDayRecordAutomation/.test(encounterText)) {
  violations.push(
    `${encounter.replaceAll("\\", "/")} must not duplicate lobby daily-record refresh`
  );
}

if (violations.length) {
  console.error("[verify-day-record-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-day-record-boundary] OK — daily date records sync through one entry");
