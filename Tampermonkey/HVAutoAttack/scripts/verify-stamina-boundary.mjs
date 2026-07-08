import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/stamina.js");
const ownerTest = path.normalize("src/state/stamina.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/state\/|\.\.\/\.\.\/state\/)stamina\.js["']/.test(line) &&
      /\breadStaminaValue\b/.test(line)
    ) {
      violations.push(`${where} legacy stamina value import is forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /restoreStamina/.test(line) &&
      /staminaLow/.test(line)
    ) {
      violations.push(
        `${where} stamina restore/stop decision belongs in runStaminaAutomation(event)`
      );
    }
    if (relative !== owner && relative !== ownerTest && /recover=stamina/.test(line)) {
      violations.push(`${where} stamina recovery POST belongs in runStaminaAutomation(event)`);
    }
    if (relative === owner && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(`${where} stamina decisions must read options through option entry`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runStaminaAutomation",
  "StaminaEvent",
  "OptionEvent.READ_FIELD",
  "CLAIM_RECOVERY",
  "STAMINA_RECOVERY_POST_BODY",
  "STAMINA_RECOVERY_FAILURE_KEY",
  "HVAA:lastStaminaRecoveryFailure",
  "recordStaminaRecoveryFailure",
  'capability: "staminaRecovery"',
  'stage: "claimRecoveryPost"',
  "sessionStorage.setItem(STAMINA_RECOVERY_FAILURE_KEY",
  "[HVAA] stamina recovery request failed",
  "Stamina recovery fallback must not depend on diagnostic storage.",
  "Console hooks must not block stamina recovery failure handling.",
  "NavigationEvent.RELOAD_NOW",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (!/const\s+STAMINA_RECOVERY_POST_BODY\s*=\s*"recover=stamina"/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must define stamina recovery POST body`);
}

if (/export\s+function\s+readStaminaValue\s*\(/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} legacy readStaminaValue export must stay private behind runStaminaAutomation(event)`
  );
}

if (!ownerText.includes("const staminaEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route stamina events through a handler table`
  );
}
const ownerEntry = ownerText.match(/export function runStaminaAutomation[\s\S]*?\n}/)?.[0] || "";
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
  "readStaminaValue(",
  "shouldRestoreForBattle(",
  "shouldStopLobby(",
  "shouldRestoreForIdleArena(",
  "claimStaminaRecovery(",
]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through staminaEventHandlers`
    );
  }
}
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
if (
  !ownerTestText.includes(
    "rejects unknown and null stamina events without reading or writing state"
  ) ||
  !ownerTestText.includes("runStaminaAutomation(null)") ||
  !ownerTestText.includes("querySelector).not.toHaveBeenCalled()")
) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown and null stamina events`);
}
for (const required of [
  "records stamina recovery POST failures without claiming reload success",
  "keeps stamina recovery failure handling when diagnostics are blocked",
  "STAMINA_RECOVERY_FAILURE_KEY",
  "HVAA:lastStaminaRecoveryFailure",
  "session blocked",
  "console blocked",
  "claimRecoveryPost",
  'kind: "networkError"',
  "runNavigationAutomation).not.toHaveBeenCalled()",
  "[HVAA] stamina recovery request failed",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(
      `${ownerTest.replaceAll("\\", "/")} must cover stamina recovery request failures`
    );
  }
}

const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
for (const required of [
  'STAMINA_RECOVERY_FAILURE: "HVAA:lastStaminaRecoveryFailure"',
  'source("staminaRecoveryFailure", DiagnosticEvidenceKey.STAMINA_RECOVERY_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}

const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
for (const required of [
  "HVAA:lastStaminaRecoveryFailure",
  "staminaRecoveryFailure",
  "claimRecoveryPost",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-stamina-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-stamina-boundary] OK — stamina value and restore decisions are behind one entry"
);
