import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/repair-orchestrator.js");
const ownerTest = path.normalize("src/repair/repair-orchestrator.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/repair\/)repair-orchestrator\.js["']/.test(line) &&
      (!/\bRepairEvent\b/.test(line) || !/\brunRepairAutomation\b/.test(line))
    ) {
      violations.push(`${where} repair consumers must use runRepairAutomation(event)`);
    }
    if (relative !== owner && relative !== ownerTest && /\brunRepair\s*\(/.test(line)) {
      violations.push(`${where} legacy runRepair call is forbidden`);
    }
    if (relative === ownerTest && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(`${where} repair tests must seed option through runOptionAutomation(event)`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runRepairAutomation", "RepairEvent"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
const entryBody =
  ownerText.match(/export function runRepairAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/const repairEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_START\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*(?:!==|===)|switch\s*\(\s*event\.type\s*\)/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (entryBody.includes("repairEventHandlers[event.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null repair events without throwing`);
}
if (!entryBody.includes("repairEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null repair events`);
}
if (/export\s+function\s+runRepair\s*\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} legacy runRepair export is forbidden`);
}
if (!ownerText.includes("OptionEvent.READ_FIELD")) {
  violations.push(`${owner.replaceAll("\\", "/")} must read repair options through option entry`);
}
if (/from\s+["']\.\.\/state\/store\.js["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not import store for repair option reads`);
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read repair options directly`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover repair workflow entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (!ownerTestText.includes("rejects unknown repair automation events without scanning or scheduling")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown repair events`);
  }
  if (!ownerTestText.includes("runRepairAutomation(null")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null repair events`);
  }
}

if (violations.length) {
  console.error("[verify-repair-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-repair-boundary] OK — repair workflow is behind one entry");
