import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/option-backup.js");
const ownerTest = path.normalize("src/state/option-backup.test.js");
const failureTest = path.normalize("src/state/option-backup-failure.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const settingsRender = path.normalize("src/settings/render.js");
const settingsBackupCommand = path.normalize("src/settings/backup-command.js");
const settingsBackupCommandTest = path.normalize("src/settings/backup-command.test.js");
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
      /\b(?:getValue|setValue|delValue)\(\s*["']backup["']/.test(line)
    ) {
      violations.push(`${where} option backup storage belongs in state/option-backup.js`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.BACKUP\b/.test(line)
    ) {
      violations.push(`${where} option backup key belongs in state/option-backup.js`);
    }
    if (
      relative === settingsRender &&
      /\bOptionBackupEvent\b|\brunOptionBackupAutomation\b|\bcode in backups\b|\bexistingBackups\b|\bObject\.keys\(.*backups/.test(
        line
      )
    ) {
      violations.push(`${where} settings must not inspect option backup shape`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
for (const required of [
  "runOptionBackupAutomation",
  "OptionBackupEvent",
  "OPTION_BACKUP_FAILURE_KEY",
  "STORAGE_KEYS.BACKUP",
  "capability: \"optionBackup\"",
  "HAS_CODE",
  "RENDER_LIST_ITEMS",
  "persistOptionBackups",
  "recordOptionBackupFailure",
  "OPTION_FAILURE_KEY",
  "readLatestOptionFailureError",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required}`);
  }
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
for (const required of [
  "SettingsBackupCommandEvent.HAS_CODE",
  "SettingsBackupCommandEvent.RENDER_LIST_ITEMS",
  "SettingsBackupCommandEvent.SAVE_CURRENT",
  "SettingsBackupCommandEvent.DELETE",
  "SettingsBackupCommandEvent.RESTORE",
  "runSettingsBackupCommand",
  "alertBackupCommandFailure",
]) {
  if (!settingsText.includes(required)) {
    violations.push(`${settingsRender.replaceAll("\\", "/")} must request ${required}`);
  }
}
const settingsBackupCommandText = fs.readFileSync(path.join(root, settingsBackupCommand), "utf8");
for (const required of [
  "SettingsBackupCommandEvent",
  "runSettingsBackupCommand",
  "OptionBackupEvent.RENDER_LIST_ITEMS",
  "OptionBackupEvent.HAS_CODE",
  "OptionBackupEvent.SAVE_CURRENT",
  "OptionBackupEvent.DELETE",
  "OptionBackupEvent.RESTORE",
  "Failed to backup configuration",
  "Failed to delete backup",
  "Failed to restore backup",
  "const settingsBackupCommandHandlers",
]) {
  if (!settingsBackupCommandText.includes(required)) {
    violations.push(`${settingsBackupCommand.replaceAll("\\", "/")} must expose ${required}`);
  }
}
const settingsBackupCommandTestText = fs.readFileSync(
  path.join(root, settingsBackupCommandTest),
  "utf8"
);
for (const required of [
  "settings backup command entry",
  "returns typed save, delete, and restore command results",
  "preserves failure messages without claiming backup command success",
  "fails closed for unknown backup commands",
  "OPTION_BACKUP_FAILURE_KEY",
]) {
  if (!settingsBackupCommandTestText.includes(required)) {
    violations.push(`${settingsBackupCommandTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const legacy of [
  "function saveSettingsBackup(code) {",
  "function deleteSettingsBackup(code) {",
  "function restoreSettingsBackup(code) {",
  "OptionBackupEvent.SAVE_CURRENT",
  "OptionBackupEvent.DELETE",
  "OptionBackupEvent.RESTORE",
]) {
  if (!settingsText.includes(legacy)) {
    continue;
  }
  violations.push(`${settingsRender.replaceAll("\\", "/")} must not keep legacy backup command ${legacy}`);
}
const settingsBackupBlock =
  /gE\(["']\.hvAABackup["'][\s\S]*?gE\(["']\.hvAARestore["']/.exec(settingsText)?.[0] || "";
const settingsRestoreBlock =
  /gE\(["']\.hvAARestore["'][\s\S]*?gE\(["']\.hvAADelete["']/.exec(settingsText)?.[0] || "";
const settingsDeleteBlock =
  /gE\(["']\.hvAADelete["'][\s\S]*?gE\(["']\.hvAAExport["']/.exec(settingsText)?.[0] || "";
if (/runOptionBackupAutomation\(\{\s*type:\s*OptionBackupEvent\.(?:SAVE_CURRENT|DELETE)\b/.test(settingsBackupBlock)) {
  violations.push(`${settingsRender.replaceAll("\\", "/")} backup button must not bypass checked backup commands`);
}
if (/runOptionBackupAutomation\(\{\s*type:\s*OptionBackupEvent\.DELETE\b/.test(settingsDeleteBlock)) {
  violations.push(`${settingsRender.replaceAll("\\", "/")} delete button must not bypass checked backup commands`);
}
if (/runOptionBackupAutomation\(\{\s*type:\s*OptionBackupEvent\.RESTORE\b/.test(settingsRestoreBlock)) {
  violations.push(`${settingsRender.replaceAll("\\", "/")} restore button must not bypass checked backup commands`);
}

for (const legacy of [
  "readOptionBackups",
  "saveCurrentOptionBackup",
  "restoreOptionBackup",
  "deleteOptionBackup",
]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runOptionBackupAutomation(event)`
    );
  }
}

if (!ownerText.includes("const optionBackupEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route option backup events through a handler table`
  );
}
const ownerEntry =
  ownerText.match(/export function runOptionBackupAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`);
}
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for null option backup events`);
}
for (const internal of [
  "readOptionBackups(",
  "saveCurrentOptionBackup(",
  "restoreOptionBackup(",
  "deleteOptionBackup(",
  "hasOptionBackupCode(",
  "renderOptionBackupListItems(",
]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through optionBackupEventHandlers`
    );
  }
}
if (!/runOptionBackupAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null option backup events`);
}
for (const required of [
  "does not report save success when backup persistence fails",
  "does not report delete success when backup persistence fails",
  "does not report restore success when option write fails",
  "fails closed and records evidence for malformed backup storage",
  "does not report save success when failure evidence and warning both fail",
  'throw new Error("quota")',
  'throw new Error("evidence blocked")',
  'throw new Error("console blocked")',
  "not.toThrow()",
  "capability: \"optionBackup\"",
  "OPTION_BACKUP_FAILURE_KEY",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
const failureTestText = fs.existsSync(path.join(root, failureTest))
  ? fs.readFileSync(path.join(root, failureTest), "utf8")
  : "";
for (const required of [
  "does not report restore success when failure evidence and warning both fail",
  "does not report delete success when failure evidence and warning both fail",
  'throw new Error("option write blocked")',
  'throw new Error("backup write blocked")',
  'throw new Error("evidence blocked")',
  'throw new Error("console blocked")',
  "not.toThrow()",
  "toBe(false)",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (!/try\s*{[\s\S]*setValue\(STORAGE_KEYS\.BACKUP,\s*backups\);[\s\S]*return true;[\s\S]*}\s*catch/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must classify backup persistence failures before reporting success`
  );
}
if (!/catch\s*\(error\)\s*{[\s\S]*recordOptionBackupFailure\(EVENT_RESTORE,\s*"restoreFailed"/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must classify restore write failures before reporting success`
  );
}
if (
  !/if \(runOptionAutomation\(\{ type: OptionEvent\.WRITE,\s*option: backups\[code\] \}\) !== false\)[\s\S]*return true;[\s\S]*recordOptionBackupFailure\(EVENT_RESTORE,\s*"restoreFailed",\s*\{[\s\S]*error: readLatestOptionFailureError\(\)/.test(
    ownerText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must classify false option restore results before reporting success`
  );
}
if (!/globalThis\.sessionStorage\?\.setItem\(OPTION_BACKUP_FAILURE_KEY/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must persist option backup failure evidence`);
}
if (!/normalizeOptionBackups\(EVENT_READ,\s*getValue\(STORAGE_KEYS\.BACKUP,\s*true\) \|\| {}\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize malformed backup storage at read entry`);
}

const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
for (const required of [
  "OPTION_BACKUP_FAILURE: \"HVAA:lastOptionBackupFailure\"",
  "source(\"optionBackupFailure\", DiagnosticEvidenceKey.OPTION_BACKUP_FAILURE)",
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
for (const required of [
  "HVAA:lastOptionBackupFailure",
  "optionBackupFailure: { capability: \"optionBackup\", action: \"restore\", reason: \"restoreFailed\" }",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-option-backup-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-option-backup-boundary] OK — option backups are behind one entry");
