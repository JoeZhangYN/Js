import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/persist-keys.js");
const learnedKeys = ["learnedRecovery", "learnedCd", "learnedBigKill", "learnedIncomingBurst"];
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
  if (relative === owner) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const key of learnedKeys) {
      if (line.includes(`"${key}"`) || line.includes(`'${key}'`)) {
        violations.push(
          `${rel(file)}:${index + 1} learned storage key "${key}" must use STORAGE_KEYS`
        );
      }
    }
  });
}

walk(srcDir);

if (violations.length) {
  console.error("[verify-learning-storage-keys] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-learning-storage-keys] OK — learned storage keys use STORAGE_KEYS");
