import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/cd-tracker.js");
const checkpointOwner = path.normalize("src/state/cd-runtime-checkpoint.js");
const ownerTest = path.normalize("src/state/cd-tracker.test.js");
const failureTest = path.normalize("src/state/cd-tracker-failure.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
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
    const isTest = relative.endsWith(".test.js");
    if (
      relative !== owner &&
      relative !== checkpointOwner &&
      relative !== ownerTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.(?:GLOBAL_TURN|SKILL_LAST_USED)\b/.test(line)
    ) {
      violations.push(`${where} CD runtime persistence belongs in state/cd-tracker.js`);
    }
    if (
      relative !== owner &&
      /\b(?:getValue|setValue|delValue)\(\s*["'](?:globalTurn|skillLastUsed)["']/.test(line)
    ) {
      violations.push(`${where} CD runtime storage must use cd-tracker entry`);
    }
    if (relative !== owner && !isTest && /\bg\(\s*["']globalTurn["']/.test(line)) {
      violations.push(`${where} globalTurn reads belong behind runCdRuntimeAutomation(event)`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runCdRuntimeAutomation",
  "CdRuntimeEvent",
  "normalizeGlobalTurn",
  "normalizeSkillLastUsed",
  "readGlobalTurn",
  "readSkillLastUsed",
  "READ_GLOBAL_TURN",
  "CD_RUNTIME_FAILURE_KEY",
  "recordCdRuntimeFailure",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "storageWrite",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

const checkpointText = fs.readFileSync(path.join(root, checkpointOwner), "utf8");
for (const required of [
  "BattleSessionCheckpointEvent",
  "STORAGE_KEYS.GLOBAL_TURN",
  "STORAGE_KEYS.SKILL_LAST_USED",
  "loadCdRuntimeCheckpoint",
  "persistCdRuntimeCheckpoint",
  "delValue",
]) {
  if (!checkpointText.includes(required)) {
    violations.push(`${checkpointOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (((ownerText + checkpointText).match(/normalizeSkillLastUsed\(/g) || []).length < 2) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize skillLastUsed reads and writes`);
}
if ((ownerText.match(/readGlobalTurn\(/g) || []).length < 4) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize globalTurn reads and writes`);
}
if (/g\(\s*["']globalTurn["']\s*\)\s*\|\|\s*0/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read raw globalTurn with || fallback`);
}
if (/g\(\s*["']skillLastUsed["']\s*\)\s*\|\|\s*\{\}/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not read raw skillLastUsed with || fallback`
  );
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} CD runtime diagnostics must use the typed diagnostic console entry`
  );
}

for (const legacy of [
  "loadCdState",
  "persistCdState",
  "incrementGlobalTurn",
  "recordFire",
  "turnsUntilReady",
  "collectCdMap",
]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runCdRuntimeAutomation(event)`
    );
  }
}

if (!ownerText.includes("const cdRuntimeEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route CD runtime events through a handler table`
  );
}
const ownerEntry = ownerText.match(/export function runCdRuntimeAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (ownerEntry.includes("event.type")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null events without throwing`);
}
if (!ownerEntry.includes("event?.type")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
  );
}
for (const internal of [
  "loadCdState(",
  "persistCdState(",
  "incrementGlobalTurn(",
  "recordFire(",
  "turnsUntilReady(",
  "collectCdMap(",
  "readGlobalTurn(",
]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through cdRuntimeEventHandlers`
    );
  }
}
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
if (
  !ownerTestText.includes(
    "expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST })).toBe(true)"
  )
) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover successful CD persistence result`);
}
if (
  !ownerTestText.includes(
    "rejects unknown and null cd runtime events without changing runtime or persisted state"
  ) ||
  !ownerTestText.includes("runCdRuntimeAutomation(null)")
) {
  violations.push(
    `${ownerTest.replaceAll("\\", "/")} must cover unknown and null CD runtime events`
  );
}
if (!fs.existsSync(path.join(root, failureTest))) {
  violations.push(
    `${failureTest.replaceAll("\\", "/")} must cover CD runtime persistence failures`
  );
} else {
  const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
  for (const required of [
    "does not report CD runtime persistence success when storage writes fail",
    "does not throw when CD runtime failure evidence and diagnostic console both fail",
    "CD_RUNTIME_FAILURE_KEY",
    "cd runtime write blocked",
    "session blocked",
    "runDiagnosticConsoleAutomation",
    "storageWrite",
  ]) {
    if (!failureTestText.includes(required)) {
      violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-cd-tracker-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-cd-tracker-boundary] OK — CD runtime persistence is behind one entry");
