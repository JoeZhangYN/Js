import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/alarm/page-refresh.js");
const testFile = path.normalize("src/alarm/page-refresh.test.js");
const pageAutomation = path.normalize("src/pages/page-automation.js");
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
    if (/\blocation\.reload\s*\(/.test(line)) {
      violations.push(`${where} page refresh must go through runPageRefreshAutomation`);
    }
    if (/\bsetupPageRefresh\b/.test(line)) {
      violations.push(`${where} legacy setupPageRefresh is forbidden`);
    }
    if (/\bexport\s+function\s+planPageRefreshDelayMs\s*\(/.test(line)) {
      violations.push(
        `${where} page refresh delay planning must stay private behind runPageRefreshAutomation(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== testFile &&
      relative !== pageAutomation &&
      /\brunPageRefreshAutomation\b/.test(line)
    ) {
      violations.push(`${where} page refresh scheduling is owned by page-automation`);
    }
    if (
      relative !== owner &&
      relative !== testFile &&
      /\bscheduleReload\b/.test(line) &&
      /page refresh|UNKNOWN_PAGE_READY|UNKNOWN_PAGE_RELOAD_MINUTES/.test(line)
    ) {
      violations.push(`${where} page reload scheduling belongs in alarm/page-refresh.js`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (!ownerText.includes("scheduleReload")) {
  violations.push(`${owner.replaceAll("\\", "/")} must use scheduleReload`);
}
if (!ownerText.includes("schedulePageRefreshReload")) {
  violations.push(`${owner.replaceAll("\\", "/")} must converge page refresh reload execution`);
}
if ((ownerText.match(/NavigationEvent\.SCHEDULE_RELOAD/g) || []).length !== 1) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must have one page refresh navigation command construction`
  );
}
for (const required of ["PageRefreshEvent", "UNKNOWN_PAGE_READY", "UNKNOWN_PAGE_RELOAD_MINUTES"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required} page refresh policy`);
  }
}
for (const required of ["OptionEvent.READ_FIELD", "runOptionAutomation"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must read page refresh option internally`);
  }
}
if (!ownerText.includes("return minutes;")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not add random minutes beyond the configured page refresh limit`
  );
}
for (const forbidden of ["jitterMinutes", "return minutes +"]) {
  if (ownerText.includes(forbidden)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must not exceed configured page refresh minutes with ${forbidden}`
    );
  }
}
if (/OptionEvent\.READ\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not read the whole option bag for page refresh fields`
  );
}
if (!ownerText.includes("const pageRefreshEventHandlers")) {
  violations.push(`${owner.replaceAll("\\", "/")} must route page refresh events through a handler table`);
}
const ownerEntry = ownerText.match(/export function runPageRefreshAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*(?:===|!==)/.test(ownerEntry)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must not reintroduce event.type branching`);
}
if (ownerEntry.includes("pageRefreshEventHandlers[event.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null page refresh events without throwing`);
}
if (!ownerEntry.includes("pageRefreshEventHandlers[event?.type]") || !ownerEntry.includes("?? false")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null page refresh events`);
}
for (const internal of ["scheduleUnknownPageRefresh(", "scheduleGamePageRefresh("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch through pageRefreshEventHandlers`);
  }
}

const testText = fs.readFileSync(path.join(root, testFile), "utf8");
if (!testText.includes("runPageRefreshAutomation(null")) {
  violations.push(`${testFile.replaceAll("\\", "/")} must cover null page refresh events`);
}

if (violations.length) {
  console.error("[verify-page-refresh-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-page-refresh-boundary] OK — periodic page refresh is behind one entry");
