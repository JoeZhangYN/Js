import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/option.js");
const ownerTest = path.normalize("src/state/option.test.js");
const backup = path.normalize("src/state/option-backup.js");
const backupTest = path.normalize("src/state/option-backup.test.js");
const battleMainLoop = path.normalize("src/battle/main-loop.js");
const turnContext = path.normalize("src/battle/turn-context.js");
const storage = path.normalize("src/state/storage.js");
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
      relative !== backupTest &&
      relative !== storage &&
      /\b(?:getValue|setValue|delValue)\(\s*["']option["']/.test(line)
    ) {
      violations.push(`${where} option storage belongs in state/option.js`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== backupTest &&
      relative !== storage &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.OPTION\b/.test(line)
    ) {
      violations.push(`${where} option storage key belongs in state/option.js`);
    }
    if (
      relative === settingsRender &&
      /\bOptionEvent\.READ\b|JSON\.parse\(gE\(["']\.hvAAConfig["']\)\.value\)|JSON\.stringify\(/.test(
        line
      )
    ) {
      violations.push(`${where} settings must not compose option import/export payloads`);
    }
    if (
      ![owner, ownerTest, backup, backupTest].includes(relative) &&
      /\bOptionEvent\.READ\b/.test(line)
    ) {
      violations.push(`${where} whole option reads are reserved for option owners`);
    }
    if (relative === battleMainLoop && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(
        `${where} battle rules must read options through OptionEvent.READ_BATTLE_RULE_OPTIONS`
      );
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "OptionEvent",
  "runOptionAutomation",
  "STORAGE_KEYS.OPTION",
  "EXPORT_TEXT",
  "PARSE_IMPORT_TEXT",
  "READ_BATTLE_RULE_OPTIONS",
  "SYNC_STARTUP_OPTION",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required}`);
  }
}

const battleMainLoopText = fs.readFileSync(path.join(root, battleMainLoop), "utf8");
if (/OptionEvent\.READ_BATTLE_RULE_OPTIONS|runOptionAutomation/.test(battleMainLoopText)) {
  violations.push(
    `${battleMainLoop.replaceAll("\\", "/")} must receive battle rule options from turn context`
  );
}
const turnContextText = fs.readFileSync(path.join(root, turnContext), "utf8");
for (const required of ["runOptionAutomation", "OptionEvent.READ_BATTLE_RULE_OPTIONS"]) {
  if (!turnContextText.includes(required)) {
    violations.push(`${turnContext.replaceAll("\\", "/")} must request ${required}`);
  }
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
for (const required of ["OptionEvent.EXPORT_TEXT", "OptionEvent.PARSE_IMPORT_TEXT"]) {
  if (!settingsText.includes(required)) {
    violations.push(`${settingsRender.replaceAll("\\", "/")} must request ${required}`);
  }
}
for (const legacy of [
  "readOption",
  "writeOption",
  "clearOption",
  "getOption",
  "isOptionOn",
  "setOption",
]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runOptionAutomation(event)`
    );
  }
}
if (!/export const OptionEvent\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose OptionEvent`);
}
if (!/export function runOptionAutomation\(\s*event\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runOptionAutomation(event)`);
}

if (violations.length) {
  console.error("[verify-option-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-option-boundary] OK — option persistence is behind one entry");
