import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/alarm/alarm.js");
const ownerTest = path.normalize("src/alarm/alarm.test.js");
const notificationFailureTest = path.normalize("src/alarm/alarm-notification-failure.test.js");
const notificationCatalog = path.normalize("src/alarm/notification-catalog.js");
const notificationFailure = path.normalize("src/alarm/alarm-notification-failure.js");
const profileCatalog = path.normalize("src/alarm/alarm-profiles.js");
const profileCatalogTest = path.normalize("src/alarm/alarm-profiles.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticEvidenceTest = path.normalize("src/core/diagnostic-evidence.test.js");
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
      relative !== owner &&
      relative !== settingsRender &&
      relative !== profileCatalogTest &&
      /from\s+["'][^"']*alarm-profiles\.js["']/.test(line)
    ) {
      violations.push(`${rel(file)}:${index + 1} alarm profile catalog is consumed only through alarm/settings entries`);
    }
    if (/\bALARM_(?:AUDIO_PROFILES|RUNTIME_KIND_KEYS)\b/.test(line) && relative !== profileCatalog) {
      violations.push(`${rel(file)}:${index + 1} alarm profile lists are internal to alarm profile catalog`);
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
const notificationFailureText = fs.readFileSync(path.join(root, notificationFailure), "utf8");
const profileCatalogText = fs.readFileSync(path.join(root, profileCatalog), "utf8");
const profileCatalogTestText = fs.readFileSync(path.join(root, profileCatalogTest), "utf8");
const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
const diagnosticEvidenceTestText = fs.readFileSync(path.join(root, diagnosticEvidenceTest), "utf8");
for (const required of ["runAlarmAutomation", "AlarmEvent", "PREVIEW_AUDIO_URL"]) {
  if (!ownerText.includes(required))
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
}
for (const required of ["runAlarmProfileCatalog", "AlarmProfileEvent.NORMALIZE_KIND", "normalizeAlarmKind"]) {
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
for (const required of [
  "Notification side effects must not block alarm fallback actions.",
  "Notification permission hooks must not block alarm fallback actions.",
  "Notification close hooks are diagnostic only.",
  "GM_notification({",
  "recordAlarmNotificationFailure",
  "browserNotificationPermissionRejected",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must isolate notification failure ${required}`);
  }
}
if (ownerText.includes(".catch(() => {})")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not swallow notification permission failures`
  );
}
for (const required of [
  'ALARM_NOTIFICATION_FAILURE_KEY = "HVAA:lastAlarmNotificationFailure"',
  'capability: "alarmNotification"',
  "sessionStorage.setItem(ALARM_NOTIFICATION_FAILURE_KEY",
]) {
  if (!notificationFailureText.includes(required)) {
    violations.push(`${notificationFailure.replaceAll("\\", "/")} must persist ${required}`);
  }
}
for (const required of [
  'ALARM_NOTIFICATION_FAILURE: "HVAA:lastAlarmNotificationFailure"',
  'source("alarmNotificationFailure", DiagnosticEvidenceKey.ALARM_NOTIFICATION_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}
for (const required of [
  "HVAA:lastAlarmNotificationFailure",
  'alarmNotificationFailure: { capability: "alarmNotification", stage: "gmNotification" }',
]) {
  if (!diagnosticEvidenceTestText.includes(required)) {
    violations.push(`${diagnosticEvidenceTest.replaceAll("\\", "/")} must cover ${required}`);
  }
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
for (const required of ["ALARM_AUDIO_PROFILES", "renderAlarmAudioProfileRows"]) {
  if (!profileCatalogText.includes(required) && !settingsText.includes(required)) {
    violations.push(`${settingsRender.replaceAll("\\", "/")} must derive alarm audio profiles`);
  }
}
for (const required of [
  "AlarmProfileEvent.READ_AUDIO_PROFILES",
  "runAlarmProfileCatalog({ type: AlarmProfileEvent.READ_AUDIO_PROFILES })",
]) {
  if (!settingsText.includes(required)) {
    violations.push(`${settingsRender.replaceAll("\\", "/")} must read alarm audio profiles through catalog entry`);
  }
}
for (const required of [
  "AlarmProfileEvent",
  "runAlarmProfileCatalog",
  "READ_AUDIO_PROFILES",
  "NORMALIZE_KIND",
  "exposes configurable audio profiles without the notification-only test kind",
  "normalizes runtime alarm kinds through the profile entry",
]) {
  if (!profileCatalogText.includes(required) && !profileCatalogTestText.includes(required)) {
    violations.push(`${profileCatalog.replaceAll("\\", "/")} must lock alarm profile catalog entry ${required}`);
  }
}
for (const legacy of ["ALARM_AUDIO_PROFILES", "ALARM_RUNTIME_KIND_KEYS"]) {
  if (new RegExp(`export\\s+const\\s+${legacy}\\b`).test(profileCatalogText)) {
    violations.push(`${profileCatalog.replaceAll("\\", "/")} must keep ${legacy} private behind runAlarmProfileCatalog(event)`);
  }
}
for (const retired of [
  /audioEnable_Common["'][\s\S]{0,180}audioEnable_Error/,
  /audioEnable_Defeat["'][\s\S]{0,180}audioEnable_Riddle/,
]) {
  if (retired.test(settingsText)) {
    violations.push(
      `${settingsRender.replaceAll("\\", "/")} must not inline alarm audio profile rows`
    );
  }
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
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (ownerEntry.includes("alarmEventHandlers[event.type]")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must reject null alarm events without throwing`
  );
}
if (
  !ownerEntry.includes("alarmEventHandlers[event?.type]") ||
  !ownerEntry.includes("return false")
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null alarm events`
  );
}
for (const internal of ["setAlarm(", "setAudioAlarm(", "setNotification(", "previewAudioUrl("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through alarmEventHandlers`
    );
  }
}

const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
if (
  !ownerTestText.includes("rejects unknown alarm events without user-visible side effects") ||
  !ownerTestText.includes("runAlarmAutomation(null)") ||
  !ownerTestText.includes("isolates GM notification failures from notification-only alarms") ||
  !ownerTestText.includes("keeps audio alarm running when notification delivery fails") ||
  !ownerTestText.includes('throw new Error("notification blocked")') ||
  !ownerTestText.includes("HVAA:lastAlarmNotificationFailure") ||
  !ownerTestText.includes("gmNotification") ||
  !ownerTestText.includes("not.toThrow()")
) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover alarm failure fallback events`);
}
const notificationFailureTestText = fs.readFileSync(
  path.join(root, notificationFailureTest),
  "utf8"
);
for (const required of [
  "isolates synchronous browser notification permission failures",
  "isolates rejected browser notification permission requests",
  'throw new Error("permission blocked")',
  'Promise.reject(new Error("permission rejected"))',
  "HVAA:lastAlarmNotificationFailure",
  "browserNotificationPermission",
  "browserNotificationPermissionRejected",
  "not.toThrow()",
]) {
  if (!notificationFailureTestText.includes(required)) {
    violations.push(
      `${notificationFailureTest.replaceAll("\\", "/")} must cover browser notification fallback ${required}`
    );
  }
}

if (violations.length) {
  console.error("[verify-alarm-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-alarm-boundary] OK — alarm workflow is behind one entry");
