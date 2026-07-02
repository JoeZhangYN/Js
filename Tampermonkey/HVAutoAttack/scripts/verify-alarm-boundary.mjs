import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/alarm/alarm.js");
const ownerTest = path.normalize("src/alarm/alarm.test.js");
const notificationCatalog = path.normalize("src/alarm/notification-catalog.js");
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
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== notificationCatalog &&
      /from\s+["'](?:\.\/|\.\.\/alarm\/|\.\.\/\.\.\/alarm\/)alarm\.js["']/.test(line) &&
      /\b(?:setAlarm|setAudioAlarm|setNotification)\b/.test(line)
    ) {
      violations.push(`${rel(file)}:${index + 1} legacy alarm imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== notificationCatalog &&
      /from\s+["'][^"']*notification-catalog\.js["']/.test(line)
    ) {
      violations.push(`${rel(file)}:${index + 1} notification catalog is internal to alarm entry`);
    }
    if (
      relative === settingsRender &&
      (/^http\(s\)\?:\|\^ftp:\|\^data:audio/.test(line) ||
        /appendChild\(cE\(["']audio["']\)/.test(line) ||
        /The audio will be tested/.test(line))
    ) {
      violations.push(
        `${rel(file)}:${index + 1} audio preview belongs in runAlarmAutomation(event)`
      );
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const notificationCatalogText = fs.readFileSync(path.join(root, notificationCatalog), "utf8");
for (const required of ["runAlarmAutomation", "AlarmEvent", "PREVIEW_AUDIO_URL"]) {
  if (!ownerText.includes(required))
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
}
for (const required of ["ALARM_KINDS", "normalizeAlarmKind"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must internalize alarm kind invariants`);
  }
}
if (!ownerText.includes("OptionEvent.READ_FIELD")) {
  violations.push(`${owner.replaceAll("\\", "/")} must read alarm options through option entry`);
}
if (!ownerText.includes("getAlarmNotification")) {
  violations.push(`${owner.replaceAll("\\", "/")} must delegate notification copy lookup`);
}
if (!notificationCatalogText.includes("getAlarmNotification")) {
  violations.push(
    `${notificationCatalog.replaceAll("\\", "/")} must own alarm notification catalog lookup`
  );
}
if (/export\s+(?:const|function)\s+(?!getAlarmNotification\b)/.test(notificationCatalogText)) {
  violations.push(
    `${notificationCatalog.replaceAll("\\", "/")} must expose only getAlarmNotification`
  );
}
if (/\bconst\s+notifications\s*=/.test(ownerText) || /Some errors have occurred/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not keep notification copy catalog inline`);
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read alarm options directly`);
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!settingsText.includes("AlarmEvent.PREVIEW_AUDIO_URL")) {
  violations.push(`${settingsRender.replaceAll("\\", "/")} must preview audio through alarm entry`);
}

for (const legacy of ["setAlarm", "setAudioAlarm", "setNotification"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runAlarmAutomation(event)`
    );
  }
}
for (const fn of ["setAlarm", "setAudioAlarm", "setNotification"]) {
  if (
    !new RegExp(
      `function\\s+${fn}\\s*\\([^)]*\\)\\s*\\{\\s*\\w+\\s*=\\s*normalizeAlarmKind\\(`
    ).test(ownerText)
  ) {
    violations.push(`${owner.replaceAll("\\", "/")} ${fn} must normalize alarm kind before use`);
  }
}

if (!ownerText.includes("const alarmEventHandlers")) {
  violations.push(`${owner.replaceAll("\\", "/")} must route alarm events through a handler table`);
}
const ownerEntry = ownerText.match(/export function runAlarmAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`);
}
if (ownerEntry.includes("alarmEventHandlers[event.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null alarm events without throwing`);
}
if (!ownerEntry.includes("alarmEventHandlers[event?.type]") || !ownerEntry.includes("return false")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null alarm events`);
}
for (const internal of [
  "setAlarm(",
  "setAudioAlarm(",
  "setNotification(",
  "previewAudioUrl(",
]) {
  if (ownerEntry.includes(internal)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch through alarmEventHandlers`);
  }
}

const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
if (
  !ownerTestText.includes("rejects unknown alarm events without user-visible side effects") ||
  !ownerTestText.includes("runAlarmAutomation(null)")
) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown and null alarm events`);
}

if (violations.length) {
  console.error("[verify-alarm-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-alarm-boundary] OK — alarm workflow is behind one entry");
