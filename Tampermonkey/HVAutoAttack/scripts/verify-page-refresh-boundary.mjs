import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/alarm/page-refresh.js");
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
    if (
      relative !== owner &&
      relative !== pageAutomation &&
      /\brunPageRefreshAutomation\b/.test(line)
    ) {
      violations.push(`${where} page refresh scheduling is owned by page-automation`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (!ownerText.includes("scheduleReload")) {
  violations.push(`${owner.replaceAll("\\", "/")} must use scheduleReload`);
}

if (violations.length) {
  console.error("[verify-page-refresh-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-page-refresh-boundary] OK — periodic page refresh is behind one entry");
