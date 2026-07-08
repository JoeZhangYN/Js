import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-runtime.js");
const failureOwner = path.normalize("src/battle/battle-runtime-failure.js");
const ownerTest = path.normalize("src/battle/battle-runtime.test.js");
const failureTest = path.normalize("src/battle/battle-runtime-failure.test.js");
const storage = path.normalize("src/state/storage.js");
const storageTest = path.normalize("src/state/storage.test.js");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      relative !== storage &&
      relative !== storageTest &&
      /\bdelValue\(\s*2\s*\)/.test(line)
    ) {
      violations.push(`${where} battle session clear must use runBattleRuntimeAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== storage &&
      relative !== storageTest &&
      relative !== path.normalize("src/state/persist-keys.js") &&
      /\bSTORAGE_KEYS\.(?:DISABLED|ROUND_NOW|ROUND_ALL|ROUND_TYPE|BATTLE_CODE|MONSTER_STATUS)\b/.test(
        line
      ) &&
      /\bdelValue\(/.test(line)
    ) {
      violations.push(`${where} battle runtime deletion belongs in battle-runtime boundary`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
if (!/export function runBattleRuntimeAutomation\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runBattleRuntimeAutomation()`);
}
if (!ownerText.includes("CLEAR_SESSION")) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose CLEAR_SESSION event`);
}
if (!ownerText.includes("clearPersistedBattleSession")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must clear persisted session through failure-aware owner`
  );
}
if (!failureOwnerText.includes("delValue(2)")) {
  violations.push(`${failureOwner.replaceAll("\\", "/")} must own legacy delValue(2) bridge`);
}
for (const required of [
  "BATTLE_RUNTIME_FAILURE_KEY",
  "HVAA:lastBattleRuntimeFailure",
  "recordBattleRuntimeFailure",
  "clearPersistedBattleSession",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "battleRuntime",
  "storageDelete",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "does not report session clear success when persisted clear fails",
  "does not throw when runtime failure evidence and typed warning both fail",
  "BATTLE_RUNTIME_FAILURE_KEY",
  "storageDelete",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(failureOwnerText)) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} must route failure diagnostics through the typed diagnostic console entry`
  );
}
if (
  !/const battleRuntimeEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_CLEAR_SESSION\]: clearSession/.test(
    ownerText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route runtime events through battleRuntimeEventHandlers`
  );
}
const ownerEntryBody =
  ownerText.match(/export function runBattleRuntimeAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/event\.type\s*!==|event\.type\s*===/.test(ownerEntryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleRuntimeEventHandlers[event?.type]")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must reject null runtime events without clearing session`
  );
}
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
if (!ownerTestText.includes("runBattleRuntimeAutomation(null)")) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null runtime events`);
}

if (violations.length) {
  console.error("[verify-battle-runtime-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-runtime-boundary] OK — battle session clear is behind one entry");
