import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owners = new Set(
  ["src/state/persist-keys.js", "src/state/storage.js"].map((file) => path.normalize(file))
);
const keys = ["battleCode", "drop", "dropOld", "stats", "statsOld"];
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
  if (owners.has(relative) || relative.endsWith(".test.js")) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const key of keys) {
      const rawStorageCall = new RegExp(`\\b(?:getValue|setValue|delValue)\\(\\s*["']${key}["']`);
      if (rawStorageCall.test(line)) {
        violations.push(
          `${rel(file)}:${index + 1} monitor storage key "${key}" must use STORAGE_KEYS`
        );
      }
    }
  });
}

walk(srcDir);

if (violations.length) {
  console.error("[verify-monitor-storage-keys] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monitor-storage-keys] OK — monitor storage keys use STORAGE_KEYS");
