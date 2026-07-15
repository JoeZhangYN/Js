import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const violations = [];

// Transitional debt is exact and can only shrink. Each owner is retired by its named Epic Todo.
const transitionalRawWrites = new Map([
  ["src/state/riddle-dataset.js", { count: 2, retire: "#2046" }],
  ["src/pages/riddle-ml.js", { count: 2, retire: "#2046" }],
  ["src/pages/encounter-generation-incident.js", { count: 1, retire: "#2045" }],
  ["src/pages/encounter-generation-incident-clear.js", { count: 1, retire: "#2045" }],
  ["src/i18n/hv-utils.js", { count: 2, retire: "#2049" }],
]);

function productionFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(absolute);
    if (!entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) return [];
    return [absolute];
  });
}

const found = new Map();
const rawWrite = /\b(?:GM_(?:setValue|deleteValue)|GM\.(?:setValue|deleteValue))\s*\(/g;
for (const file of productionFiles(srcRoot)) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const matches = [...fs.readFileSync(file, "utf8").matchAll(rawWrite)];
  if (matches.length) found.set(relative, matches.length);
}

for (const [file, count] of found) {
  const allowance = transitionalRawWrites.get(file);
  if (!allowance) violations.push(`${file} introduces ${count} raw GM write(s)`);
  else if (count !== allowance.count) {
    violations.push(
      `${file} raw GM write count changed: expected ${allowance.count}, found ${count}`
    );
  }
}
for (const [file, allowance] of transitionalRawWrites) {
  if (!found.has(file)) {
    violations.push(
      `${file} transitional allowance (${allowance.retire}) is stale; remove it from the guard`
    );
  }
}

const policy = fs.readFileSync(path.join(srcRoot, "state", "storage-io-policy.js"), "utf8");
for (const required of [
  "StorageIdentity",
  "StorageAuthority",
  "StorageWriteOutcome",
  "storageIoPolicyOf",
  "RIDDLE_SAMPLE",
  "SESSION_RUNTIME_CHECKPOINT",
  "DIAGNOSTIC_EVIDENCE",
]) {
  if (!policy.includes(required)) violations.push(`storage-io-policy.js must own ${required}`);
}

const storage = fs.readFileSync(path.join(srcRoot, "state", "storage.js"), "utf8");
for (const required of [
  "StorageIdentity.WORLD_SMALL_VALUE",
  "StorageWriteOutcome.WRITTEN",
  "StorageWriteOutcome.DELETED",
  "StorageWriteOutcome.FAILED",
  "runStorageIoMetricsAutomation",
]) {
  if (!storage.includes(required)) violations.push(`storage.js must consume ${required}`);
}

if (violations.length) {
  console.error("[verify-storage-io-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `[verify-storage-io-boundary] OK - ${[...found.values()].reduce((a, b) => a + b, 0)} transitional raw writes are owned and cannot grow`
);
