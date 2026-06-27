import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/repair-backend.js");
const ownerTest = path.normalize("src/repair/repair-backend.test.js");
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
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/repair\/)repair-backend\.js["']/.test(line) &&
      (!/\bRepairBackendEvent\b/.test(line) || !/\brunRepairBackendAutomation\b/.test(line))
    ) {
      violations.push(
        `${where} repair backend consumers must use runRepairBackendAutomation(event)`
      );
    }
    if (relative !== owner && relative !== ownerTest && /\bmakeRepairBackend\b/.test(line)) {
      violations.push(`${where} legacy makeRepairBackend usage is forbidden`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runRepairBackendAutomation", "RepairBackendEvent"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/export\s+function\s+makeRepairBackend\s*\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} legacy makeRepairBackend export is forbidden`);
}

if (violations.length) {
  console.error("[verify-repair-backend-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-repair-backend-boundary] OK — repair backend is behind one entry");
