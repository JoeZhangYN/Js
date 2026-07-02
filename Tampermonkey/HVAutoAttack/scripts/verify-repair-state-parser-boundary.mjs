import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/parse-repair-state.js");
const ownerTest = path.normalize("src/repair/parse-repair-state.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/repair\/)parse-repair-state\.js["']/.test(line) &&
      (!/\bRepairStateParseEvent\b/.test(line) || !/\brunRepairStateParser\b/.test(line))
    ) {
      violations.push(`${where} repair state parsing must use runRepairStateParser(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /\b(?:parsePersistentRepairState|parseIsekaiRepairState)\b/.test(line)
    ) {
      violations.push(`${where} world-specific repair parsers must stay private`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runRepairStateParser", "RepairStateParseEvent"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
const entryBody = ownerText.match(/export function runRepairStateParser\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/const repairStateParseEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PARSE_PERSISTENT\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (/repairStateParseEventHandlers\s*\[\s*event\.type\s*\]/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null parser events instead of reading event.type directly`);
}
for (const legacy of ["parsePersistentRepairState", "parseIsekaiRepairState"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} legacy ${legacy} export is forbidden`);
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover repair state parser entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (!ownerTestText.includes("rejects unknown parser events without choosing a world parser")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown parser events`);
  }
  if (
    !ownerTestText.includes("rejects null parser events without choosing a world parser") ||
    !ownerTestText.includes("runRepairStateParser(null")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null parser events`);
  }
}

if (violations.length) {
  console.error("[verify-repair-state-parser-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-repair-state-parser-boundary] OK — repair state parsing is behind one entry");
