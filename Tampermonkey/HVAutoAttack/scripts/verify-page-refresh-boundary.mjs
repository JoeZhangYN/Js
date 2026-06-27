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
      /page refresh|UNKNOWN_PAGE_READY|5\s*\*\s*60/.test(line)
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
for (const required of ["PageRefreshEvent", "UNKNOWN_PAGE_READY", "5 * 60"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required} page refresh policy`);
  }
}

if (violations.length) {
  console.error("[verify-page-refresh-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-page-refresh-boundary] OK — periodic page refresh is behind one entry");
