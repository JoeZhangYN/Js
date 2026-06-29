import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/decide-repair.js");
const ownerTest = path.normalize("src/repair/decide-repair.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/repair\/)decide-repair\.js["']/.test(line) &&
      (!/\bRepairDecisionEvent\b/.test(line) || !/\brunRepairDecision\b/.test(line))
    ) {
      violations.push(`${where} repair decision consumers must use runRepairDecision(event)`);
    }
    if (relative !== owner && relative !== ownerTest && /\bdecideRepair\s*\(/.test(line)) {
      violations.push(`${where} legacy decideRepair usage is forbidden`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runRepairDecision", "RepairDecisionEvent"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/export\s+function\s+decideRepair\s*\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} legacy decideRepair export is forbidden`);
}
if (/g\(\s*["']option["']/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not describe repair decisions as raw option reads`
  );
}

if (violations.length) {
  console.error("[verify-repair-decision-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-repair-decision-boundary] OK — repair decisions are behind one entry");
