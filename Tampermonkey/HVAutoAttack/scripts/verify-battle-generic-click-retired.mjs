import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const battleDir = path.join(root, "src", "battle");
const dispatchFile = path.normalize("src/battle/dispatch.js");
const typesFile = path.normalize("src/core/types.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkBattleFile(full);
  }
}

function checkBattleFile(file) {
  const relative = path.normalize(path.relative(root, file));
  if (relative.endsWith(".test.js")) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (/kind:\s*["']click["']/.test(line)) {
      violations.push(`${rel(file)}:${index + 1} generic click ActionResult is retired`);
    }
  });
}

function requireAbsent(relative, checks) {
  const text = fs.readFileSync(path.join(root, relative), "utf8");
  for (const { pattern, message } of checks) {
    if (pattern.test(text)) {
      violations.push(`${relative.replaceAll("\\", "/")} ${message}`);
    }
  }
}

walk(battleDir);

requireAbsent(dispatchFile, [
  { pattern: /case\s+["']click["']/, message: "must not dispatch generic click ActionResult" },
  { pattern: /\battemptClick\b/, message: "must not import generic click execution" },
]);
requireAbsent(typesFile, [
  {
    pattern: /\{\s*kind:\s*["']click["']\s*,\s*selector:/,
    message: "must not expose generic click ActionResult",
  },
]);

if (violations.length) {
  console.error("[verify-battle-generic-click-retired] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-generic-click-retired] OK - generic battle click ActionResult is retired"
);
