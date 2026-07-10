import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/repair-backend.js");
const ownerTest = path.normalize("src/repair/repair-backend.test.js");
const httpFailureTest = path.normalize("src/repair/repair-backend-http-failure.test.js");
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
const entryBody =
  ownerText.match(/export function runRepairBackendAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!ownerText.includes("export function createRepairBackendCapability")) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose its IO-bound capability factory`);
}
if (!entryBody.includes("event?.type") || !entryBody.includes("return undefined")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null backend events`
  );
}
if (/isIsekai|\.\.\/env\.js/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} Armory repair must be world-invariant`);
}
if (/export\s+function\s+makeRepairBackend\s*\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} legacy makeRepairBackend export is forbidden`);
}
for (const required of ["fetchState(cb, onFailure)", "submitRepair(ids, cb, onFailure)"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose backend ${required}`);
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover repair backend entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (!ownerTestText.includes("rejects unknown backend events without creating a backend")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown backend events`);
  }
  if (
    !ownerTestText.includes("rejects null backend events without creating a backend") ||
    !ownerTestText.includes("runRepairBackendAutomation(null")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null backend events`);
  }
}
if (!fs.existsSync(path.join(root, httpFailureTest))) {
  violations.push(`${httpFailureTest.replaceAll("\\", "/")} must cover backend HTTP failures`);
} else {
  const httpFailureTestText = fs.readFileSync(path.join(root, httpFailureTest), "utf8");
  for (const required of [
    "routes fetch-state HTTP failures to the failure callback",
    "routes Armory HTTP status failures to the failure callback",
    "routes submit-repair HTTP failures to the failure callback",
    'kind: "networkError"',
    'kind: "httpStatus"',
  ]) {
    if (!httpFailureTestText.includes(required)) {
      violations.push(`${httpFailureTest.replaceAll("\\", "/")} must lock ${required}`);
    }
  }
}
const ownerTestText = fs.existsSync(path.join(root, ownerTest))
  ? fs.readFileSync(path.join(root, ownerTest), "utf8")
  : "";
for (const required of [
  "world-invariant Armory repair authority",
  'href: "?s=Bazaar&ss=am&screen=repair"',
  "postoken=tokp&eqids[]=5",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(
      `${ownerTest.replaceAll("\\", "/")} must lock current main-world repair authority: ${required}`
    );
  }
}
if (ownerText.includes("?s=Forge&ss=re") || ownerText.includes("select_item=")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not use retired persistent Forge repair authority`
  );
}

if (violations.length) {
  console.error("[verify-repair-backend-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-repair-backend-boundary] OK — repair backend is behind one entry");
