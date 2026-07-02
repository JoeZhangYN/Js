import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/option-backup.js");
const ownerTest = path.normalize("src/state/option-backup.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const settingsRender = path.normalize("src/settings/render.js");
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
      /\bOptionBackupEvent\.READ\b|\bcode in backups\b|\bexistingBackups\b|\bObject\.keys\(.*backups/.test(
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
  "STORAGE_KEYS.BACKUP",
  "HAS_CODE",
  "RENDER_LIST_ITEMS",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required}`);
  }
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
for (const required of ["OptionBackupEvent.HAS_CODE", "OptionBackupEvent.RENDER_LIST_ITEMS"]) {
  if (!settingsText.includes(required)) {
    violations.push(`${settingsRender.replaceAll("\\", "/")} must request ${required}`);
  }
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

if (violations.length) {
  console.error("[verify-option-backup-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-option-backup-boundary] OK — option backups are behind one entry");
